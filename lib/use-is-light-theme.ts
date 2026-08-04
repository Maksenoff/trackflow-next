'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

/**
 * Une même teinte translucide paraît toujours "délavée" sur fond clair,
 * quelle que soit l'opacité choisie côté CSS — il faut des pourcentages
 * différents selon le thème actif. `mounted` évite un mismatch
 * d'hydratation (resolvedTheme est indéfini le temps du premier rendu).
 */
export function useIsLightTheme(): boolean {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted && resolvedTheme === 'light'
}
