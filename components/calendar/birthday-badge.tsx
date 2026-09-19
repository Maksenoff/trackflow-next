import { cn } from '@/lib/utils'

export type CalBirthday = {
  athleteId: string
  firstName: string
  lastName: string
  date: Date
}

/**
 * Petit badge gâteau discret posé sur la case du jour d'anniversaire — même
 * traitement sur toutes les formes du calendrier (grille mois, grille
 * semaine desktop, carrousel semaine mobile), retour Maksen 2026-09-19.
 * S'il y a plusieurs anniversaires le même jour, affiche le premier prénom
 * + un compteur plutôt qu'empiler les badges (case trop petite pour ça).
 */
export function BirthdayBadge({
  birthdays,
  compact,
  className,
}: {
  birthdays: CalBirthday[]
  /** Sans le fond en pastille ni son padding — pour les cases mois mobile
   * (~50px de large), où le fond + padding + espace emoji ne laissaient
   * quasiment plus de place au prénom (retour Maksen 2026-09-19). */
  compact?: boolean
  className?: string
}) {
  if (birthdays.length === 0) return null
  const label =
    birthdays.length === 1
      ? birthdays[0].firstName
      : `${birthdays[0].firstName} +${birthdays.length - 1}`
  const title = birthdays.map((b) => `${b.firstName} ${b.lastName}`).join(', ')

  return (
    <span
      title={`Anniversaire — ${title}`}
      className={cn(
        'inline-flex min-w-0 items-center leading-none font-semibold text-pink-600 dark:text-pink-400',
        // Agrandi (retour Maksen 2026-09-19 : trop petit sur mobile, un peu
        // aussi sur desktop) — 9px → 12px en compact (case mois mobile,
        // toujours la plus contrainte en largeur, sur sa propre ligne donc
        // sans concurrence directe). Non-compact plus mesuré (9px → 10.5px,
        // padding inchangé) : partagé avec la grille desktop où le badge
        // partage sa ligne avec la pastille météo — un premier essai plus
        // gros y faisait tronquer des prénoms qui tenaient très bien avant
        // (ex: "Maksen" → "Ma...").
        compact
          ? 'gap-0.5 text-[12px]'
          : 'gap-0.5 rounded-full bg-pink-500/10 px-1.5 py-0.5 text-[9.5px]',
        className
      )}
    >
      <span aria-hidden>🎂</span>
      <span className="truncate">{label}</span>
    </span>
  )
}
