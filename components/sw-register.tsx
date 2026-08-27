'use client'

import { useEffect } from 'react'

/**
 * next-pwa (v5, ciblé Pages Router) n'injecte pas le script d'enregistrement du
 * service worker dans l'App Router — on l'enregistre nous-mêmes ici. Sans ça,
 * /sw.js existe bien mais n'est jamais activé côté client (PWA installable et
 * WebPush cassés en silence).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Pas bloquant : l'app reste utilisable sans SW (juste pas de PWA/push).
      // Logué quand même — un échec silencieux ici est la cause la plus probable
      // du bouton "Activer les notifications push" qui reste bloqué en chargement.
      // eslint-disable-next-line no-console
      console.error('Échec enregistrement du service worker :', err)
    })
  }, [])

  return null
}
