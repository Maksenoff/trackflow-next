/** Ajoute un canal alpha (0-100) à une couleur hex (#rrggbb -> #rrggbbaa) */
export function tint(hex: string, percent: number): string {
  const clamped = Math.max(0, Math.min(100, percent))
  const alpha = Math.round((clamped / 100) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${alpha}`
}
