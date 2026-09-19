'use client'

import { DisciplinePictogram } from '@/components/athletes/discipline-pictogram'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDiscipline } from '@/lib/performance'
import { cn } from '@/lib/utils'

/**
 * Sélecteur de discipline mobile — dropdown à taille fixe avec pictogramme
 * SVG par discipline (même composant que les bandeaux de l'onglet
 * Performances), en remplacement de la rangée de pills sur les stats
 * avancées (retour Maksen 2026-09-19, même traitement que SeasonSelect).
 * `sm:` et plus : rangée de pills scrollable inchangée.
 */
export function DisciplineSelect({
  value,
  onChange,
  disciplines,
  className,
}: {
  value: string
  onChange: (value: string) => void
  disciplines: string[]
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className={cn('w-[220px] shrink-0 rounded-full', className)}>
        <DisciplinePictogram discipline={value} className="size-4 shrink-0" />
        <SelectValue>{() => formatDiscipline(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent className="no-scrollbar">
        {disciplines.map((d) => (
          <SelectItem key={d} value={d}>
            <DisciplinePictogram discipline={d} className="size-4 shrink-0" />
            {formatDiscipline(d)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
