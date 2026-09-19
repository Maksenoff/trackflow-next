'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Barre de progression en haut de l'écran pendant une navigation — que ce
 * soit un clic sur un `<Link>` ou un `router.push()` déclenché depuis du
 * code (très fréquent dans l'app : formulaires qui redirigent après
 * enregistrement, navigation du calendrier...). App Router n'expose aucun
 * événement "navigation en cours" natif en Next 14 (`useLinkStatus` n'existe
 * qu'à partir de Next 15), donc :
 * - Départ : on intercepte les clics sur les liens internes ET on patche
 *   `history.pushState`/`replaceState` (c'est par là que le router Next
 *   passe en interne pour une vraie navigation, quel que soit le
 *   déclencheur — y compris les boutons du calendrier, qui ne sont pas des
 *   `<a>` donc invisibles au clic seul) — un seul patch, posé une fois.
 *   `replaceState` est aussi utilisé par Next pour de la pure tenue à jour
 *   d'URL sans navigation perceptible (restauration de scroll...) : on ne
 *   déclenche `onNavigate()` que si l'URL cible diffère vraiment de l'URL
 *   courante (comparée AVANT d'appeler l'implémentation native, donc encore
 *   l'ancienne valeur) — un appel "housekeeping" qui repose la même URL est
 *   ignoré, ce qui évite le bug constaté en test (barre relancée après coup
 *   sans jamais se refermer).
 * - Fin : dès que `pathname`/`searchParams` changent réellement.
 * - Délai d'affichage (SHOW_DELAY_MS) : App Router sert beaucoup de
 *   navigations depuis son cache client (route déjà visitée/préchargée — ex:
 *   bascule mois/semaine du calendrier, retour sur un onglet déjà vu) sans
 *   aucun aller-retour réseau perceptible. La barre ne s'affiche que si la
 *   navigation est encore en cours après ce délai — jamais pour une
 *   transition déjà résolue avant (retour Maksen : "elle apparaît alors que
 *   c'est déjà préchargé"). Contrepartie assumée : sur une page vraiment
 *   lente, la barre peut se refermer un peu avant la fin exacte du rendu —
 *   le squelette `loading.tsx` de la page prend alors le relais comme
 *   signal de chargement principal (couverture quasi complète des routes,
 *   cf. `components/ui/page-loading.tsx`), cette barre n'en est qu'un
 *   complément, pas la seule source de retour visuel.
 * - Filet de sécurité : si rien ne se résout sous 6s, on referme quand même
 *   la barre plutôt que de la laisser bloquée indéfiniment.
 */
const SHOW_DELAY_MS = 200

let historyPatched = false

// Fenêtre pendant laquelle le prochain appel pushState/replaceState est
// ignoré par la barre — pour les navigations "de confort" (persister un
// onglet actif ou une recherche dans l'URL) dont les données sont déjà
// toutes chargées côté client, où rien ne charge réellement derrière (retour
// Maksen 2026-09-21 : onglets Séances/Compétitions des Paramètres — "la
// barre sert uniquement quand un onglet charge réellement"). Expire toute
// seule si jamais consommée, pour ne jamais avaler une vraie navigation par
// erreur si l'appel attendu n'arrive pas.
let silentUntil = 0

/** À appeler juste avant un `router.replace()`/`push()` dont on sait qu'il
 * ne fait que synchroniser l'URL sans rien charger de nouveau (cf. plus
 * haut) — la barre de progression ignore l'appel history qui en résulte. */
export function markSilentNavigation() {
  silentUntil = Date.now() + 500
}

/** URL cible d'un appel `pushState`/`replaceState`, résolue en absolue —
 * le 3ᵉ argument peut être relatif, `null`/absent (URL courante) ou une
 * `URL`. */
function targetUrlOf(args: [unknown, string, (string | URL | null | undefined)?]): string {
  const raw = args[2]
  if (raw == null) return window.location.href
  return new URL(String(raw), window.location.href).href
}

function patchHistoryOnce(onNavigate: () => void) {
  if (historyPatched) return
  historyPatched = true
  const originalPush = window.history.pushState.bind(window.history)
  const originalReplace = window.history.replaceState.bind(window.history)

  function wrap(original: typeof originalPush) {
    return function (...args: Parameters<typeof originalPush>) {
      // Navigation marquée silencieuse (cf. markSilentNavigation) — on
      // consomme le laissez-passer sans jamais déclencher la barre, même si
      // l'URL cible diffère vraiment.
      if (Date.now() < silentUntil) {
        silentUntil = 0
        return original(...args)
      }
      // Ignore un appel qui reposerait la même URL (restauration de scroll,
      // autre bookkeeping interne) — seule une vraie cible différente compte
      // comme le départ d'une navigation.
      if (targetUrlOf(args) !== window.location.href) {
        // `setTimeout` plutôt qu'un appel synchrone : Next appelle lui-même
        // pushState/replaceState depuis un `useInsertionEffect` interne
        // (HistoryUpdater), où React interdit de programmer une mise à jour
        // d'état ("useInsertionEffect must not schedule updates") —
        // repousser d'un tick sort du timing interdit sans changer le
        // comportement perçu (toujours quasi instantané).
        setTimeout(onNavigate, 0)
      }
      return original(...args)
    }
  }

  window.history.pushState = wrap(originalPush)
  window.history.replaceState = wrap(originalReplace)
}

function isInternalNavigableLink(el: HTMLElement | null): boolean {
  const a = el?.closest('a')
  if (!a) return false
  const href = a.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false
  }
  if (a.target === '_blank' || a.hasAttribute('download')) return false
  try {
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin) return false
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false
    }
  } catch {
    return false
  }
  return true
}

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState(false)
  const [pct, setPct] = useState(0)
  // Vrai dès qu'une navigation a démarré, même avant que la barre soit
  // visible (pendant le délai de grâce) — distinct de `active` (l'affichage).
  const pendingRef = useRef(false)
  const showRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimers() {
    if (showRef.current) clearTimeout(showRef.current)
    if (tickRef.current) clearInterval(tickRef.current)
    if (hideRef.current) clearTimeout(hideRef.current)
    if (safetyRef.current) clearTimeout(safetyRef.current)
    showRef.current = null
    tickRef.current = null
    hideRef.current = null
    safetyRef.current = null
  }

  function start() {
    if (pendingRef.current) return // déjà en cours
    pendingRef.current = true
    if (hideRef.current) clearTimeout(hideRef.current)
    safetyRef.current = setTimeout(finish, 6000)
    // N'affiche la barre que si la navigation est toujours en cours passé ce
    // délai — une navigation déjà résolue avant (route en cache) n'affiche
    // jamais rien.
    showRef.current = setTimeout(() => {
      if (!pendingRef.current) return
      setActive(true)
      setPct(15)
      // Avance vite au début puis ralentit en s'approchant de 90% — jamais
      // 100% tant que la navigation n'est pas vraiment terminée (finish()).
      tickRef.current = setInterval(() => {
        setPct((p) => (p < 90 ? p + Math.max(1, (90 - p) * 0.12) : p))
      }, 180)
    }, SHOW_DELAY_MS)
  }

  function finish() {
    const wasVisible = pendingRef.current && tickRef.current !== null
    pendingRef.current = false
    clearTimers()
    if (!wasVisible) return
    setPct(100)
    hideRef.current = setTimeout(() => {
      setActive(false)
      setPct(0)
    }, 220)
  }

  // Une navigation qui aboutit change toujours `pathname` et/ou `searchParams`
  // — signal de fin fiable, quelle qu'en soit la source.
  useEffect(() => {
    finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => {
    patchHistoryOnce(start)

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (isInternalNavigableLink(e.target as HTMLElement)) start()
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      clearTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" aria-hidden>
      <div
        className="h-full bg-gradient-to-r from-primary to-primary/70 shadow-[0_0_8px_var(--color-primary)] transition-[width] duration-200 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
