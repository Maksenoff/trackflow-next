import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADD_BUTTON_CLASS =
  'group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-3 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35 sm:px-4'

/**
 * Bouton "+ Ajouter" standard de l'app — pill dégradé primary, icône qui pivote
 * au hover. Reprend le style déjà établi sur "+ Nouvelle séance"/"+ Nouvelle
 * compétition" (components/calendar/calendar-view.tsx) ; centralisé ici pour que
 * tous les onglets du profil athlète (et au-delà) partagent le même bouton.
 * Passer `href` (au lieu de `onClick`) le fait naviguer plutôt qu'ouvrir un
 * dialog — même rendu, pour les actions qui mènent à une page dédiée (ex:
 * "Nouvelle équipe" plutôt qu'un formulaire en popup).
 */
export function AddButton({
  label,
  onClick,
  href,
  className,
}: {
  label: string
  onClick?: () => void
  href?: string
  className?: string
}) {
  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        title={label}
        className={cn(ADD_BUTTON_CLASS, className)}
      >
        <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(ADD_BUTTON_CLASS, className)}
    >
      <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
