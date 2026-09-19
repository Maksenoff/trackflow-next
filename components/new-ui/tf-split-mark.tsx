/**
 * Icône de marque "TF Split Relief" (retour Maksen 2026-09-19, assets fournis
 * dans le chat — geometry portée telle quelle depuis `tf-split.svg`/
 * `TFSplitLogo.jsx`, jamais redessinée à la main). Un T-F incliné tamponné
 * deux fois : un jumeau décalé plus léger (la "reprise"), et une face nette
 * par-dessus (la "course"). Le jumeau porte la couleur d'accent choisie par
 * l'utilisateur (`var(--nu-acc)`, avec repli sur le violet de marque
 * d'origine).
 *
 * Fond de tuile et couleur de la face entièrement adaptatifs au thème
 * (retour Maksen 2026-09-19, "faut que ca soit le meme que le theme
 * (parfaitement)" — la tuile sombre fixe de la charte, correcte sur l'icône
 * PWA statique (public/brand/icon*.svg, sans accès aux tokens CSS de l'app),
 * détonnait posée sur le bandeau/la sidebar en thème clair). `--nu-bg` fait
 * disparaître visuellement le contour de la tuile (identique à ce qui
 * l'entoure) ; `--nu-txt` fait suivre la face à la même inversion clair/sombre
 * que le reste du texte de l'app, plutôt qu'un crème fixe qui devenait
 * illisible sur fond clair.
 */
export function TfSplitMark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ background: 'var(--nu-bg)' }}>
      <svg viewBox="0 0 100 100" className="size-full p-[18%]" aria-hidden focusable="false">
        <g
          transform="translate(5 14) skewX(-13) translate(-4 0) scale(0.94) translate(0 1)"
          opacity={0.55}
          fill="var(--nu-acc, #8A6BFF)"
        >
          <rect x="12" y="24" width="76" height="13" rx="1" />
          <rect x="30" y="24" width="13" height="54" rx="1" />
          <rect x="61" y="24" width="13" height="54" rx="1" />
          <rect x="61" y="45" width="22" height="11" rx="1" />
        </g>
        <g transform="skewX(-13) translate(-4 0) scale(0.94) translate(0 1)" fill="var(--nu-txt)">
          <rect x="12" y="24" width="76" height="13" rx="1" />
          <rect x="30" y="24" width="13" height="54" rx="1" />
          <rect x="61" y="24" width="13" height="54" rx="1" />
          <rect x="61" y="45" width="22" height="11" rx="1" />
        </g>
      </svg>
    </span>
  )
}
