'use client'

import { useEffect, useState } from 'react'

/** Reproduit le compteur `data-count` du mockup (ease cubic-out, ~900ms). */
export function CountUp({
  value,
  decimals = 0,
  suffix = '',
  className,
  style,
}: {
  value: number
  decimals?: number
  suffix?: string
  className?: string
  style?: React.CSSProperties
}) {
  // Le premier rendu client (hydration) s'exécute déjà dans le navigateur, donc
  // `typeof window === 'undefined'` y est faux au même titre que côté serveur —
  // initialiser à 0 sur cette base faisait diverger le HTML serveur (`value`) du
  // premier rendu client (`0`), une hydration mismatch React qui repassait toute
  // la page en rendu client (symptôme observé : cartes athlètes de tailles
  // incohérentes). On rend `value` des deux côtés puis on anime depuis 0 une fois
  // monté.
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    // Pas de garde "une seule fois" (ref `started`) : en dev, StrictMode
    // monte/nettoie/remonte chaque effet une fois pour détecter les bugs —
    // le cleanup annulait la 1ʳᵉ animation à mi-course et une garde
    // "already started" empêchait le 2ᵉ passage de la relancer, laissant le
    // compteur bloqué près de 0 pour de bon (bug constaté 2026-09-19 : "les %
    // sont toujours à 0%"). Sans garde, l'effet réagit normalement à chaque
    // changement de `value` (ex: après un vote) et le double-passage de
    // StrictMode se contente de relancer l'animation une fois de plus, sans
    // effet visible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    setDisplay(0)
    let raf = 0
    let start: number | null = null
    const DURATION = 900
    function step(t: number) {
      if (start === null) start = t
      const p = Math.min((t - start) / DURATION, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span className={className} style={style}>
      {display.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
