# Design tokens — palette officielle (validée par Maksen le 2026-08-21)

Source de vérité : `app/globals.css`. Ne jamais réinventer une palette différente —
toujours réutiliser ces valeurs (ou les variables CSS qu'elles alimentent) pour tout
nouveau composant.

## Thème nuit (dark, par défaut)

| Rôle | Valeur |
|---|---|
| Fond principal | `#080810` |
| Fond secondaire | `#0f0d1a` |
| Fond cards | `#13111f` |
| Bordures | `#1e1a2e` |
| Accent primaire | `#7c3aed` |
| Accent hover | `#6d28d9` |
| Accent glow | `rgba(124, 58, 237, 0.15)` |
| Texte principal | `#f1f0f5` |
| Texte secondaire | `#8b87a0` |

Zéro teinte bleue en dark — tout vire au violet foncé.

## Thème jour (light)

| Rôle | Valeur |
|---|---|
| Fond principal | `#faf9ff` |
| Fond secondaire | `#f0eeff` |
| Fond cards | `#ffffff` |
| Bordures | `#e4e0f7` |
| Accent primaire | `#7c3aed` |
| Accent hover | `#6d28d9` |
| Accent glow | `rgba(124, 58, 237, 0.1)` |
| Texte principal | `#1a1a2e` |
| Texte secondaire | `#6b6880` |

Jamais de noir pur en light — fond légèrement lavande, texte doux.

## Inputs / textareas

- Dark : fond `#13111f`, bordure `#1e1a2e`
- Light : fond `#f5f3ff`, bordure `#e4e0f7`
- Focus (les deux thèmes) : bordure `#7c3aed` + `box-shadow 0 0 0 3px rgba(124,58,237,0.2)`
- Placeholder dark : `#8b87a0` / Placeholder light : `#a89fc0`
- `border-radius: 10px`, `transition: 200ms`, `font-size` minimum 16px (anti-zoom iOS)

## Boutons

- Primaire : fond `#7c3aed`, hover `#6d28d9`, `translateY(-1px)` au hover, texte blanc
- Secondaire (outline) : fond transparent, bordure `border`, hover bordure `#7c3aed`
- Danger : fond transparent, bordure rouge, hover fond rouge à 10%
- `border-radius: 10px`, `transition: 200ms`
- Feedback tactile en CSS pur (`active:scale-[0.97]`, `hover:-translate-y-px`) plutôt
  que Framer Motion sur le composant `Button` lui-même — `Button` est composé via le
  pattern `render` de base-ui dans énormément d'endroits (`DialogClose`,
  `AlertDialogAction`, `AlertDialogCancel`, triggers...) ; l'envelopper avec `motion()`
  casserait cette composition. Le scale/tap Framer Motion reste utilisé ponctuellement
  sur des boutons/cards spécifiques qui n'ont pas besoin du pattern `render` (ex :
  pin toggle des notes, cards de note).

## Implémentation

Toutes ces valeurs vivent comme variables CSS dans `app/globals.css` (`:root` pour
light, `.dark` pour dark) et sont exposées à Tailwind via `@theme inline`
(`--color-primary`, `--color-primary-hover`, `--color-accent-glow`, `--color-input`,
etc.). Les composants de base (`Button`, `Input`, `Textarea`, `Select`, `Badge` dans
`components/ui/`) consomment ces tokens — ne jamais hardcoder une couleur hex dans un
composant, toujours passer par la classe Tailwind correspondante (`bg-primary`,
`border-border`, `bg-input`...).

Réécriture complète effectuée le 2026-08-21 (globals.css + Button/Input/Textarea/
Select/Badge) — voir historique de conversation pour le detail des choix (`--input`
redéfini comme fond solide plutôt que bordure translucide, `--radius` de base passé
à 10px, `--primary-hover` et `--accent-glow` ajoutés comme nouveaux tokens).
