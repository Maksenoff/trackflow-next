'use client'

import { useRef } from 'react'
import { ZoomIn } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export type CropConfig = { zoom?: number; x?: number; y?: number }

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

/** Éditeur de cadrage : glisser l'image pour la repositionner + slider de zoom. */
export function ImagePositionEditor({
  src,
  aspect,
  shape = 'rect',
  config,
  onChange,
}: {
  src: string
  aspect: string
  shape?: 'rect' | 'circle'
  config: CropConfig
  onChange: (config: CropConfig) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  )

  const zoom = config.zoom ?? 1
  const x = config.x ?? 50
  const y = config.y ?? 50

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: x, origY: y }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    // Diviser par le zoom : à zoom élevé, l'image affichée est plus grande donc le
    // même déplacement de souris doit correspondre à un déplacement en % plus petit.
    const nextX = clamp(dragState.current.origX - (dx / rect.width / zoom) * 100, 0, 100)
    const nextY = clamp(dragState.current.origY - (dy / rect.height / zoom) * 100, 0, 100)
    onChange({ ...config, x: nextX, y: nextY })
  }

  function handlePointerUp() {
    dragState.current = null
  }

  return (
    <div className="space-y-2.5">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          'relative w-full touch-none overflow-hidden border border-border bg-muted select-none active:cursor-grabbing',
          shape === 'circle' ? 'rounded-full' : 'rounded-xl'
        )}
        style={{ aspectRatio: aspect, cursor: 'grab' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover"
          style={{
            objectPosition: `${x}% ${y}%`,
            transform: `scale(${zoom})`,
            // Ancrer le zoom sur le point actuellement cadré (et non le centre du
            // cadre) : sans ça, zoomer recentre toujours l'image et annule le
            // recadrage qu'on vient de faire en glissant.
            transformOrigin: `${x}% ${y}%`,
          }}
        />
      </div>
      <div className="flex items-center gap-2.5">
        <ZoomIn className="size-3.5 shrink-0 text-muted-foreground" />
        <Slider
          value={[zoom]}
          min={1}
          max={2.5}
          step={0.05}
          onValueChange={(v) => onChange({ ...config, zoom: Array.isArray(v) ? v[0] : v })}
          className="max-w-56"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Glisse l&apos;image pour la repositionner.
      </p>
    </div>
  )
}
