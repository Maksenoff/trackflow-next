// Port fidèle des seuils RPE de templates/session/show.html.twig (repo Symfony)

export function rpeColor(value: number): string {
  if (value <= 2) return '#34d399'
  if (value <= 4) return '#a3e635'
  if (value <= 6) return '#fbbf24'
  if (value <= 8) return '#fb923c'
  return '#f87171'
}

export function rpeLabel(value: number): string {
  if (value <= 2) return 'Très facile'
  if (value <= 4) return 'Facile'
  if (value <= 6) return 'Modéré'
  if (value <= 8) return 'Difficile'
  return 'Maximum'
}
