'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'trackflow:lastActivityPing'
const MIN_INTERVAL_MS = 60_000

/**
 * Signal "dernière activité réelle" pour l'admin (voir user-edit-form.tsx) :
 * plus fiable que lastLoginAt, qui ne bouge qu'à la connexion et ne reflète
 * rien si la session reste ouverte des jours sur l'appareil. Monté une fois
 * dans app/(app)/layout.tsx, ping à chaque changement de route (throttlé
 * côté client via localStorage, et re-vérifié côté serveur dans la route).
 */
export function ActivityPing() {
  const pathname = usePathname()

  useEffect(() => {
    try {
      const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0)
      if (Date.now() - last < MIN_INTERVAL_MS) return
      localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      // localStorage indisponible (navigation privée...) — on ping quand même,
      // le throttle serveur reste le garde-fou.
    }
    fetch('/api/activity/ping', { method: 'POST' }).catch(() => {})
  }, [pathname])

  return null
}
