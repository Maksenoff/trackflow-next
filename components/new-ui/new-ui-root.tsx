'use client'

import { useLayoutEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Les popovers/sheets (notifications, comptes...) sont rendus dans un portail
 * ajouté directement à <body> par Base UI, donc HORS du wrapper `.new-ui` posé
 * par app/(app)/layout.tsx — les variables --nu-* n'y sont pas héritées et le
 * fond retombe à transparent (background: var(--nu-bg) invalide → valeur
 * initiale). Fix : reposer la classe (+ l'accent perso) directement sur
 * <body>, qui contient aussi bien le wrapper que les portails.
 *
 * `accentColor === 'auto'` (swatch "Blanc/Noir", cf. appearance-panel.tsx)
 * n'est pas une couleur figée : elle se résout ici selon le thème réel
 * (blanc en sombre, noir en clair — demande explicite de Maksen
 * 2026-09-19), donc dépend de `resolvedTheme` en plus de `accentColor`.
 * `--nu-onacc-user` est recalculé en même temps : le blanc/noir de l'accent
 * n'a pas un contraste fixe comme les autres couleurs de la palette (toutes
 * assez saturées pour porter du texte blanc), donc le texte/icônes posés
 * sur l'accent doivent s'inverser avec — sinon "blanc sur blanc" en thème
 * sombre. Les autres couleurs n'y touchent pas (propriété retirée).
 */
export function NewUiRoot({ accentColor }: { accentColor: string | null }) {
  const { resolvedTheme } = useTheme()

  useLayoutEffect(() => {
    document.body.classList.add('new-ui')

    const isAuto = accentColor === 'auto'
    const effectiveAccent = isAuto
      ? resolvedTheme === 'light'
        ? '#000000'
        : '#ffffff'
      : accentColor
    const effectiveOnAccent = isAuto ? (resolvedTheme === 'light' ? '#ffffff' : '#0b0d10') : null

    if (effectiveAccent) document.body.style.setProperty('--nu-accent-user', effectiveAccent)
    else document.body.style.removeProperty('--nu-accent-user')

    if (effectiveOnAccent) document.body.style.setProperty('--nu-onacc-user', effectiveOnAccent)
    else document.body.style.removeProperty('--nu-onacc-user')

    return () => {
      document.body.classList.remove('new-ui')
      document.body.style.removeProperty('--nu-accent-user')
      document.body.style.removeProperty('--nu-onacc-user')
    }
  }, [accentColor, resolvedTheme])

  return null
}
