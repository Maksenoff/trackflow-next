'use client'

import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function checkStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Détecte si l'app peut être installée (PWA) et expose de quoi déclencher le
 * prompt natif (Chrome/Edge/Android) ou signaler qu'il faut passer par les
 * instructions manuelles (iOS Safari, qui n'expose pas `beforeinstallprompt`).
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsStandalone(checkStandalone())
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }
    // Filet de sécurité si `appinstalled` ne se déclenche pas de façon fiable :
    // on revérifie le display-mode dès que l'onglet reprend la main (ex: retour
    // après le dialogue d'installation natif) ou que le média change.
    function recheck() {
      setIsStandalone(checkStandalone())
    }

    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener('change', recheck)
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
    document.addEventListener('visibilitychange', recheck)

    return () => {
      mq.removeEventListener('change', recheck)
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') setIsStandalone(true)
  }, [deferredPrompt])

  return {
    /** Le prompt natif d'installation est disponible (Chrome/Edge/Android). */
    canInstall: deferredPrompt !== null,
    /** iOS Safari : pas de prompt natif, il faut afficher les instructions manuelles. */
    isIOS,
    /** App déjà lancée en mode installé — plus besoin de proposer l'installation. */
    isStandalone,
    promptInstall,
  }
}
