/**
 * Tuile "+ Ajouter" compacte pensée pour vivre DANS une grille de cards (pas
 * dans sa propre ligne au-dessus) — s'étire à la hauteur des cards voisines
 * (comportement par défaut de CSS grid), pas de ligne dédiée qui laisserait un
 * bandeau vide au-dessus du contenu. `label` porte déjà le "+" (ex: "+ Note") —
 * pas d'icône Plus en plus, ça ferait doublon.
 */
export function AddTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
    >
      {label}
    </button>
  )
}
