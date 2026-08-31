// Corrige la lisibilité d'une couleur utilisée comme texte sur une pastille
// (fond très clair = même couleur en transparence, cf. pattern `color-mix`
// établi dans CLAUDE.md §7) — un jaune vif (#facc15, #eab308) choisi comme
// couleur de type de séance/compétition ou de discipline est illisible en
// thème clair (texte jaune sur fond quasi blanc) et reste "bizarre"/peu
// contrasté en thème sombre (demande explicite de Maksen le 2026-09-02).
// Le jaune est perçu plus clair qu'il ne l'est réellement (luminance oeil
// humain), d'où un seuil de clamp plus sévère pour cette teinte précise que
// pour les autres couleurs trop claires.
//
// N'affecte que le TEXTE de la pastille — le fond/la pastille de couleur pure
// (point coloré, swatch du color picker) garde la couleur d'origine choisie.

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100
  const lNorm = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sNorm * Math.min(lNorm, 1 - lNorm)
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`
}

export function legibleAccent(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const [h, s, l] = hexToHsl(hex)
  const isYellowish = h >= 40 && h <= 70
  const maxLightness = isYellowish ? 42 : 55
  if (l <= maxLightness) return hex
  return hslToHex(h, Math.max(s, 55), maxLightness)
}
