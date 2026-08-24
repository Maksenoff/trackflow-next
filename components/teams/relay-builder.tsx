'use client'

import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, ArrowDown, X } from 'lucide-react'
import { AthleteAvatar, type AthleteAvatarData } from './athlete-avatar'
import { fullName } from '@/lib/athlete'
import { Input } from '@/components/ui/input'

export type RelaySlotAthlete = AthleteAvatarData & {
  id: string
  licenseNumber?: string | null
}

export type RelaySlot = {
  athlete: RelaySlotAthlete
  handoffMark: string | null
}

function RelayItem({
  slot,
  index,
  total,
  readOnly,
  showLicense,
  onMarkChange,
  onRemove,
}: {
  slot: RelaySlot
  index: number
  total: number
  readOnly: boolean
  showLicense: boolean
  onMarkChange: (mark: string) => void
  onRemove?: () => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item value={slot} dragListener={false} dragControls={controls} className="list-none">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        {!readOnly && (
          <button
            type="button"
            onPointerDown={(e) => controls.start(e)}
            className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            aria-label="Réordonner"
          >
            <GripVertical className="size-4" />
          </button>
        )}
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {index + 1}
        </span>
        <AthleteAvatar athlete={slot.athlete} className="size-10" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {fullName(slot.athlete.firstName, slot.athlete.lastName)}
          </div>
          {showLicense && slot.athlete.licenseNumber && (
            <div className="text-xs text-muted-foreground">
              Licence{' '}
              <span className="font-mono font-bold text-foreground">
                {slot.athlete.licenseNumber}
              </span>
            </div>
          )}
        </div>
        {onRemove && !readOnly && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Retirer"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {index < total - 1 && (
        <div className="my-1.5 ml-9 flex items-center gap-2 pl-3.5">
          <ArrowDown className="size-3.5 shrink-0 text-muted-foreground" />
          {readOnly ? (
            <span className="text-xs font-medium text-muted-foreground">
              {slot.handoffMark || 'Marque non renseignée'}
            </span>
          ) : (
            <Input
              value={slot.handoffMark ?? ''}
              onChange={(e) => onMarkChange(e.target.value)}
              placeholder="Repère de transmission (ex : 8 pieds)"
              className="h-8 max-w-xs text-xs"
            />
          )}
        </div>
      )}
    </Reorder.Item>
  )
}

/**
 * Liste réordonnable par glisser-déposer (Reorder de Framer Motion) — chaque
 * athlète est une position du relais (1 à 4), avec un petit champ de "marque
 * de transmission" vers le suivant directement sous sa card. Le drag est
 * limité à la poignée (dragListener=false + dragControls) pour ne pas
 * déclencher un glissement en cliquant dans le champ de marque.
 */
export function RelayBuilder({
  slots,
  onChange,
  readOnly = false,
  showLicense = false,
  onRemove,
}: {
  slots: RelaySlot[]
  onChange: (slots: RelaySlot[]) => void
  readOnly?: boolean
  showLicense?: boolean
  onRemove?: (athleteId: string) => void
}) {
  if (slots.length === 0) return null

  return (
    <Reorder.Group axis="y" values={slots} onReorder={onChange} className="list-none space-y-0">
      {slots.map((slot, i) => (
        <RelayItem
          key={slot.athlete.id}
          slot={slot}
          index={i}
          total={slots.length}
          readOnly={readOnly}
          showLicense={showLicense}
          onMarkChange={(mark) => {
            const next = slots.map((s) =>
              s.athlete.id === slot.athlete.id ? { ...s, handoffMark: mark } : s
            )
            onChange(next)
          }}
          onRemove={onRemove ? () => onRemove(slot.athlete.id) : undefined}
        />
      ))}
    </Reorder.Group>
  )
}
