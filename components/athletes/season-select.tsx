'use client'

import { CalendarRange, Layers } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Sélecteur de saison mobile — dropdown à taille fixe, en remplacement de la
 * rangée de pills (qui reste affichée telle quelle à partir de `sm:`) quand
 * il y a beaucoup de saisons : la rangée de pills scrollable donnait un
 * énorme scroll latéral sur mobile plutôt qu'un menu compact (retour Maksen
 * 2026-09-19). Utilisé sur l'onglet Performances, les stats avancées et les
 * podiums — `value`/`options` en `string` uniquement, les appelants avec des
 * saisons numériques (`seasonStart`) convertissent via `String()`/`Number()`.
 */
export function SeasonSelect({
  value,
  onChange,
  options,
  allLabel,
  icon: Icon = CalendarRange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  /** Option "Toutes les saisons" en tête de liste — omise si absente (ex: podiums,
   *  qui affichent toujours exactement une saison à la fois). */
  allLabel?: string
  /** Icône des options (calendrier par défaut) — remplaçable pour réutiliser
   *  ce même composant comme filtre générique (ex: discipline sur l'onglet
   *  Podiums de la nouvelle interface, retour Maksen 2026-09-20 : "un système
   *  de filtre... comme sur le profil ou stats avancés"). L'option "Toutes"
   *  garde toujours l'icône Layers, quel que soit le type filtré. */
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  // SelectValue n'affiche pas automatiquement le contenu du SelectItem
  // sélectionné (icône + texte) — il faut lui fournir le libellé via une
  // render prop, même pattern que le Select "Profil athlète lié" de
  // components/admin/user-edit-form.tsx (sinon il affiche la valeur brute,
  // ex: "all" au lieu de "Toutes").
  const currentLabel =
    value === 'all' ? allLabel : (options.find((o) => o.value === value)?.label ?? value)

  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className={cn('w-[152px] shrink-0 rounded-full', className)}>
        {value === 'all' ? (
          <Layers className="size-3.5 shrink-0" />
        ) : (
          <Icon className="size-3.5 shrink-0" />
        )}
        <SelectValue>{() => currentLabel}</SelectValue>
      </SelectTrigger>
      {/* no-scrollbar : quand la liste dépasse la hauteur dispo (beaucoup de
          saisons), le popup scrolle mais sans afficher la scrollbar native du
          navigateur — même convention que le reste de l'app (rangées de pills
          horizontales), retour Maksen 2026-09-19 sur la scrollbar visible qui
          faisait parasite. */}
      <SelectContent className="no-scrollbar">
        {allLabel && (
          <SelectItem value="all">
            <Layers className="size-3.5" />
            {allLabel}
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <Icon className="size-3.5" />
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
