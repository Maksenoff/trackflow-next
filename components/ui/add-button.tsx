import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Bouton "+ Ajouter" standard de l'app — pill dégradé primary, icône qui pivote
 * au hover. Reprend le style déjà établi sur "+ Nouvelle séance"/"+ Nouvelle
 * compétition" (components/calendar/calendar-view.tsx) ; centralisé ici pour que
 * tous les onglets du profil athlète (et au-delà) partagent le même bouton.
 */
export function AddButton({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 sm:px-4',
        className
      )}
    >
      <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
