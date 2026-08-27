// Helpers navigateur pour l'abonnement WebPush — cf. §11 CLAUDE.md

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * `navigator.serviceWorker.ready` ne se résout JAMAIS si l'enregistrement du SW
 * (components/sw-register.tsx) a échoué ou n'a pas eu lieu — sans garde-fou, le
 * bouton "Activer les notifications push" restait bloqué en chargement à l'infini,
 * sans aucune erreur visible (correctif 2026-08-27 : "le bouton ne marche pas").
 */
function waitForServiceWorker(timeoutMs = 8000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error("Le service worker n'a pas démarré (rafraîchis la page et réessaie).")),
        timeoutMs
      )
    ),
  ])
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await waitForServiceWorker()
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error('Push non supporté par ce navigateur.')
  }

  // Récupérée en direct depuis le serveur plutôt que lue sur
  // `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (figée au moment du build dans le bundle JS) —
  // un appareil resté sur un vieux bundle en cache (PWA iOS notamment, dont le
  // cache survit à un "effacer les données" classique de Safari) restait bloqué
  // indéfiniment sur une clé absente/périmée sans jamais pouvoir se rattraper.
  const keyRes = await fetch('/api/push/vapid-public-key')
  if (!keyRes.ok) {
    throw new Error('Clé VAPID publique introuvable (config serveur à vérifier).')
  }
  const { publicKey } = (await keyRes.json()) as { publicKey: string }

  const registration = await waitForServiceWorker()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })

  const json = subscription.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  })
  if (!res.ok) {
    throw new Error(`Échec de l'enregistrement de l'abonnement (${res.status}).`)
  }
  return true
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await getExistingPushSubscription()
  if (!subscription) return true

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  const res = await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  })
  return res.ok
}
