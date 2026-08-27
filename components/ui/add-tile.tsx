import Link from 'next/link'
import { cn } from '@/lib/utils'

const TILE_CLASS =
  'flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary'

/**
 * Tuile "+ Ajouter" compacte pensée pour vivre DANS une grille de cards (pas
 * dans sa propre ligne au-dessus) — s'étire à la hauteur des cards voisines
 * (comportement par défaut de CSS grid), pas de ligne dédiée qui laisserait un
 * bandeau vide au-dessus du contenu. `label` porte déjà le "+" (ex: "+ Note") —
 * pas d'icône Plus en plus, ça ferait doublon.
 * Passer `href` (au lieu de `onClick`) la fait naviguer plutôt qu'ouvrir un
 * dialog — même rendu, pour les actions qui mènent à une page dédiée (ex:
 * "Créer son équipe" plutôt qu'un formulaire en popup), même principe que
 * `AddButton`.
 */
export function AddTile({
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
      <Link href={href} className={cn(TILE_CLASS, className)}>
        {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={cn(TILE_CLASS, className)}>
      {label}
    </button>
  )
}
