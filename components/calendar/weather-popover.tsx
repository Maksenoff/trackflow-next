'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Wind } from 'lucide-react'
import { weatherIcon, weatherTone, type HourForecast } from '@/lib/weather'

const WIDTH = 200
const GAP = 8

/**
 * Enrobe une pastille météo (enfant passé tel quel, styles inchangés) d'un
 * détail au survol (desktop) ou au tap (mobile) — condition + température +
 * vent (retour Maksen 2026-09-18). Un seul composant partagé entre la grille
 * mois/semaine desktop (components/calendar/calendar-view.tsx) et le
 * carrousel semaine mobile (mobile-week-carousel.tsx).
 *
 * Rendu via portail + position `fixed` calculée depuis le rect du
 * déclencheur (même technique que `HoverPreview` dans calendar-view.tsx),
 * plutôt qu'un simple `position: absolute` imbriqué : les cases de la grille
 * mois ont `overflow-hidden` (pour les pastilles/libellés qui débordent),
 * ce qui rognait le détail météo et ne laissait voir qu'un bout (retour
 * Maksen 2026-09-18, "on voit pas tout").
 */
export function WeatherPopover({
  forecast,
  children,
}: {
  forecast: HourForecast
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const { Icon, label } = weatherIcon(forecast.code)
  const tone = weatherTone(forecast.code)

  function place() {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const spaceBelow = viewportH - rect.bottom
    const placeAbove = spaceBelow < 110 && rect.top > spaceBelow

    let left = rect.left + rect.width / 2 - WIDTH / 2
    left = Math.min(Math.max(left, 8), viewportW - WIDTH - 8)

    setPos(
      placeAbove ? { left, bottom: viewportH - rect.top + GAP } : { left, top: rect.bottom + GAP }
    )
  }

  function show() {
    place()
    setOpen(true)
  }

  // Tap ailleurs sur l'écran pour refermer (mobile, pas de hover pour ça).
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <span
      ref={triggerRef}
      role="button"
      tabIndex={0}
      className="relative inline-flex cursor-pointer"
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (open) setOpen(false)
        else show()
      }}
    >
      {children}
      {open &&
        pos &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
            style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: WIDTH }}
          >
            <div className="flex items-center gap-2.5 p-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}
              >
                <Icon className="size-4.5" strokeWidth={2.25} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold">{label}</div>
                <div className="text-xs text-muted-foreground">{Math.round(forecast.temp)}°</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground">
              <Wind className="size-3.5 shrink-0" />
              {Math.round(forecast.windSpeed)} km/h de vent
            </div>
          </div>,
          document.body
        )}
    </span>
  )
}
