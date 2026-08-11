---
name: trackflow-design
description: "Conventions de code, de stack et de design pour TrackFlow, l'app de suivi de performance athlétique de Maksen (réécriture Symfony vers Next.js, repo trackflow-next). Utilise systématiquement cette skill dès que Maksen travaille sur TrackFlow, que ce soit création ou modification de composants, pages, modules front, thème, ou toute question de design/UI/UX sur ce projet. Contient la stack exacte à respecter, les règles de design system (shadcn/ui, Framer Motion, dual-theme), l'approche module par module avec design final directement, et la méthode pour référencer la logique métier de l'ancien repo Symfony sans copier son rendu visuel."
---

# TrackFlow — Design & conventions

TrackFlow est une app de suivi de performance athlétique pour coachs et athlètes
(club US Marquette), en cours de réécriture complète de Symfony 7 vers Next.js.

Objectif de cette skill : que chaque composant ou page généré ait un rendu visuel
cohérent avec le reste de l'app, sans que Maksen ait à répéter la stack et les
règles de design à chaque session.

## Stack à respecter strictement

- **Framework** : Next.js 14 (App Router)
- **ORM / DB** : Prisma + Vercel Postgres (Neon)
- **Auth** : NextAuth v5
- **UI kit** : shadcn/ui — ne jamais réinventer un composant que shadcn fournit déjà
  (Button, Card, Dialog, Sheet, Tabs, etc.). Toujours partir du composant shadcn et le
  personnaliser, jamais écrire un composant équivalent from scratch.
- **Animations** : Framer Motion — micro-interactions (hover, transitions de page,
  apparition de cartes/listes), pas d'animation gratuite qui ralentit l'usage
- **Graphiques** : Recharts (pas Chart.js — abandonné dans la réécriture)
- **Thème** : next-themes — l'app doit fonctionner en dual-theme (clair/sombre),
  chaque composant généré doit être testé mentalement dans les deux thèmes
- **PWA** : next-pwa — mobile-first obligatoire, l'app est pensée pour être installée
  et utilisée sur le terrain (entraînements, compétitions)
- **Scraping FFA** : Cheerio — sans lien avec le design mais fait partie du socle

Ne jamais suggérer d'alternative à cette stack (ex: Tailwind seul sans shadcn, Chart.js,
Alpine.js) sauf si Maksen le demande explicitement.

## Règle d'or : pas de portage visuel de Symfony

La version Symfony (repo public `Maksenoff/Trackflow`, raw accessible via
`https://raw.githubusercontent.com/Maksenoff/Trackflow/master/`) sert uniquement de
**référence de logique métier** (règles de disciplines athlétiques, calculs de points,
structure des données). Le rendu visuel Symfony ne doit jamais être copié ou pris comme
inspiration — le design Next.js est repensé entièrement, moderne, mobile-first.

Si Maksen demande de porter une fonctionnalité depuis l'ancien repo : aller chercher la
logique métier dans le fichier PHP correspondant, mais proposer un rendu visuel neuf
cohérent avec shadcn/ui + Framer Motion, jamais une réplique de l'ancien template Twig.

## Méthode de travail : module par module, design final directement

Ne jamais livrer un composant "fonctionnel mais moche" en attendant une passe de style
plus tard. Chaque module doit sortir fini : logique + design + animations Framer Motion
dans la même livraison. Raisons : évite de refaire le travail deux fois, le design
system posé dès les premiers modules doit être hérité par les suivants.

Quand un rendu visuel doit être clairement amélioré ou repensé (pas juste un ajustement
mineur), utiliser une approche "rewrite" : reconstruire entièrement le fichier/composant
plutôt que patcher par petites touches, et si possible s'ancrer sur une référence
visuelle concrète (ex: Linear, Vercel — esthétique épurée, dense en information mais
respirable) plutôt que de rester vague sur l'intention de style.

## Patterns UI réutilisables — ne pas réinventer

Le §7 "Design system & animations" de `CLAUDE.md` (racine du repo) documente les
patterns UI concrets déjà établis (ex : le switcher à onglets en pill bar avec
indicateur animé, utilisé sur calendrier / profil athlète / détail compétition).
**Toujours vérifier ce fichier avant de construire un composant d'interaction qui
existe peut-être déjà ailleurs** (onglets, toggles, modals de confirmation, dialogs
de création/édition, drag-and-drop) — copier le pattern existant plutôt que d'en
écrire une variante légèrement différente. Les divergences entre pages sur un même
pattern sont ce que Maksen signale le plus souvent comme incohérence visuelle.

## Système de rôles à garder en tête pour l'UI

Quatre rôles existent : `ROLE_ADMIN`, `ROLE_COACH`, `ROLE_COMPETITION_MANAGER`,
`ROLE_ATHLETE`. L'UI doit refléter clairement le rôle actif (navigation, actions
visibles) — ne pas générer une interface générique qui ignore cette hiérarchie de
permissions.

## Points ouverts à valider avec Maksen

Cette skill ne connaît pas encore la palette de couleurs exacte ni les tokens de
thème définitifs (couleurs claires/sombres, radius, police). Si une tâche nécessite
ces valeurs précises et qu'elles ne sont pas présentes dans le repo ou communiquées par
Maksen, demander plutôt que d'inventer une palette — puis, une fois données, les ajouter
au fichier `references/design-tokens.md` de cette skill pour les sessions suivantes.

## Contexte projet (pour ne jamais le redemander)

- Repo cible : `Maksenoff/trackflow-next`, démarre en v3.0 (dernière version Symfony : v2.4)
- CI/CD : GitHub Actions (lint + type-check + bump de version auto) + déploiement Vercel
- Versioning auto : `feat:` → bump mineur, `fix:` → bump patch, majeure manuelle uniquement
- Hébergement 100% Vercel : Vercel Postgres + Vercel Blob, pas de Railway
- Fonctionnalités à préserver : scraping données athlètes FFA, notifications WebPush,
  deux calendriers avec code couleur
