# CLAUDE.md — TrackFlow (Next.js rewrite)

> Ce fichier est le point d'entrée de référence pour toute session de développement Claude sur ce projet.
> Le lire en entier avant d'écrire la moindre ligne de code.

---

## 0. Autorisation globale

> **Le propriétaire du projet autorise Claude à effectuer toutes les actions nécessaires sans demander confirmation à chaque étape.**
> Cela inclut : création de fichiers, écriture de code, exécution de commandes, modifications du repo, installations de dépendances, etc.
> Claude ne doit pas demander "Puis-je faire X ?" ou attendre un "yes" avant chaque action — il exécute directement et signale ce qu'il a fait.

---

## 1. Contexte du projet

TrackFlow est une application web de suivi de performance athlétique destinée aux coachs et athlètes.
Elle est une réécriture complète de la version Symfony 7 originale (repo : `Maksenoff/Trackflow`).
Toutes les fonctionnalités sont conservées, mais le design est entièrement refait : approche moderne, fluide,
responsive mobile-first avec support PWA (installable sur iOS/Android sans store).

**Utilisateurs cibles :** coachs d'athlétisme (sprinters, sauteurs) + leurs athlètes
**Club de référence :** US Marquette

---

## 2. Stack technique

| Couche | Technologie | Version cible |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| ORM | Prisma | 5.x |
| Base de données | SQLite (dev local) → PostgreSQL (prod) | - |
| Auth | NextAuth.js v5 | 5.x |
| Style | Tailwind CSS | 3.x |
| Composants UI | shadcn/ui (Radix UI + Tailwind) | latest |
| Animations | Framer Motion | 11.x |
| Icônes | Lucide React | latest |
| Graphiques | Recharts | 2.x |
| Thèmes | next-themes | latest |
| PWA | next-pwa | latest |
| Push notifications | web-push | 3.x |
| Scraping FFA | Cheerio (équivalent JS de dom-crawler) | 1.x |
| Fichiers / vidéos | Vercel Blob | - |
| Runtime | Node.js | 20.x LTS |
| Déploiement | Vercel (tout-en-un) | - |

**Stratégie base de données :**

| Environnement | DB | Pourquoi |
|---|---|---|
| **Local / dev** | SQLite | Zéro config, zéro service externe, fichier local, rapide à reset |
| **Prod (stade avancé)** | Vercel Postgres (Neon) ou Railway PostgreSQL | Robustesse, concurrence, compatibilité Prisma parfaite |

**Règles Prisma pour la compatibilité SQLite → PostgreSQL :**
- Utiliser `String` pour les UUIDs (pas de type UUID natif en SQLite)
- Éviter les types PostgreSQL-only dans le schéma (`Json` OK, `Decimal` OK, `Bytes` à éviter)
- Toujours tester les migrations sur SQLite en dev avant de passer en prod
- Le switch SQLite → PostgreSQL se fait en changeant uniquement `DATABASE_URL` dans `.env` + `provider` dans `schema.prisma` — le schéma et le code restent identiques

**Variables d'environnement DB :**
```env
# Dev local
DATABASE_URL="file:./dev.db"

# Prod (Vercel Postgres / Neon)
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."   # requis par Prisma sur Vercel
```

**Règles absolues :**
- Pas de Redux, Zustand ou state manager global lourd — React state suffit, le fetch se fait côté serveur via les Server Components Next.js
- Pas d'Alpine.js — on est en React pur, les interactions se font en composants React
- Chaque module est conçu **design final dès le départ** — pas de phase "fonctionnel d'abord, joli ensuite"

---

## 3. Structure du projet

```
trackflow-next/
├── app/                        # App Router Next.js
│   ├── (auth)/                 # Routes auth (login, register)
│   ├── (app)/                  # Routes protégées
│   │   ├── dashboard/
│   │   ├── athletes/
│   │   │   ├── new/            # Création athlète (manuel ou via FFA)
│   │   │   └── [id]/
│   │   │       └── edit/       # Modification profil athlète
│   │   ├── calendar/           # Calendrier entraînements
│   │   ├── sessions/
│   │   │   └── [id]/           # Détail séance (programme + RPE athlètes)
│   │   ├── competitions/
│   │   │   └── [id]/           # Détail compétition (infos + inscriptions)
│   │   └── admin/
│   │       ├── users/
│   │       │   └── [id]/       # Édition utilisateur + rôle + lien athlète
│   │       ├── session-types/  # Gestion types de séances + couleurs
│   │       ├── competition-types/ # Gestion types de compétitions
│   │       └── feedbacks/      # Panel feedbacks & bugs
│   └── api/                    # API routes
│       ├── athletes/
│       ├── sessions/
│       ├── performances/
│       ├── competitions/
│       ├── goals/
│       ├── notifications/
│       ├── push/
│       ├── ffa/                # Scraping FFA isolé ici
│       └── auth/
├── components/                 # Composants React réutilisables
│   ├── ui/                     # shadcn/ui + composants custom
│   ├── calendar/               # Composants calendrier
│   ├── athlete/                # Composants page athlète
│   └── charts/                 # Wrappers Recharts
├── lib/                        # Utilitaires et helpers
│   ├── prisma.ts               # Client Prisma singleton
│   ├── auth.ts                 # Config NextAuth
│   ├── ffa-scraper.ts          # Logique scraping FFA (isolée)
│   ├── push.ts                 # Config web-push
│   └── utils.ts
├── prisma/
│   ├── schema.prisma           # Schéma DB complet
│   └── migrations/
├── public/
├── styles/
│   └── globals.css             # Tailwind + variables thèmes
├── types/                      # Types TypeScript globaux
├── .env.local                  # Variables d'environnement (ne jamais committer)
├── CLAUDE.md                   # Ce fichier
└── package.json
```

---

## 4. Modèle de données (18 entités)

Relations clés à respecter absolument :

```
User (coach ou athlète)
  └── Athlete (profil athlète, lié à un User)
        ├── AthleteSession (séances assignées)
        ├── AthleteCustomSession (séances perso ajoutées par l'athlète)
        ├── AthleteNote (notes coach sur l'athlète)
        ├── AthleteVideo (vidéos liées à l'athlète)
        ├── Performance (résultats chrono/distance)
        ├── Goal (objectifs de saison)
        └── CompetitionRegistration (inscriptions compétitions)

Session (séance d'entraînement template)
  └── TrainingType (type de séance : vitesse, endurance...)

Competition
  ├── CompetitionType (type : meeting, championnat...)
  ├── CompetitionRegistration (athlètes inscrits)
  └── CompetitionDebrief (bilan post-compétition)

Notification (in-app, liée à un User)
PushSubscription (abonnement WebPush, lié à un User)
Feedback (retours utilisateurs)
```

---

## 5. Rôles et permissions

| Rôle | Label UI | Accès |
|---|---|---|
| `ROLE_ADMIN` | Administrateur | Tout (panel admin, gestion users, feedbacks) |
| `ROLE_COACH` | Coach | Gestion athlètes, séances, calendriers, compétitions |
| `ROLE_COMPETITION_MANAGER` | Gest. compétitions | Ajout, modification et suppression des compétitions uniquement |
| `ROLE_ATHLETE` | Athlète | Consultation de ses propres données uniquement |

> **4 rôles**, pas 3. `ROLE_COMPETITION_MANAGER` est un rôle intermédiaire. Un utilisateur peut avoir plusieurs rôles simultanément (ex: Admin + Athlète).

Implémenter via NextAuth + middleware Next.js (`middleware.ts` à la racine).

### Écrans d'authentification

**Login (`/login`) :**
- Champs : email + mot de passe
- Option "Se souvenir de moi" (session persistante)
- Lien vers la page register
- Toggle thème accessible sur cette page

**Register (`/register`) :**
- Champs : prénom + nom + email + mot de passe + confirmation mot de passe
- Validation : mot de passe minimum 8 caractères, confirmation identique
- Register public — n'importe qui peut créer un compte
- Lien vers la page login

**Règles générales :**
- Auth email + mot de passe uniquement (pas d'OAuth, pas de magic link)
- Pas de reset de mot de passe (feature non implémentée)
- Toute route hors `/login` et `/register` est protégée par le middleware

---

## 6. Thèmes (dark / light)

- Deux thèmes : **dark** (défaut) et **light**
- Géré par `next-themes` — ThemeProvider wrappant le layout racine
- Classe appliquée sur `<html>` automatiquement : `dark` ou `light`
- Variables CSS dans `globals.css` suivant la convention shadcn/ui (`--background`, `--foreground`, `--primary`...)
- Toggle accessible depuis la nav (icône soleil/lune), animé avec Framer Motion
- **Ne jamais hardcoder de couleurs** : toujours utiliser les variables CSS ou les classes Tailwind `dark:`
- Compatible SSR (pas de flash au chargement)

---

## 7. Design system & animations

### Philosophie visuelle
- Interface **sombre par défaut**, épurée, avec des accents colorés par rôle/discipline
- Inspiration : dashboards athlétiques modernes (style Whoop, Garmin Connect)
- **Mobile-first** : chaque composant est pensé mobile avant desktop
- Espacements généreux, typographie lisible, hiérarchie visuelle claire

### Règles d'animation (Framer Motion)
- **Entrées de page :** fade + slide-up léger (`y: 20 → 0`, `opacity: 0 → 1`, durée 0.3s)
- **Modals :** scale + fade (`scale: 0.95 → 1`)
- **Listes :** stagger sur les items (`delayChildren: 0.05s`)
- **Transitions de tabs :** slide horizontal
- **Pastilles calendrier :** pop au hover (`scale: 1.15`)
- Pas d'animations > 0.4s — fluidité avant tout, jamais de lourdeur

### shadcn/ui
- Initialiser avec `npx shadcn-ui@latest init` en début de projet
- Composants à installer au fil des besoins (pas tout d'un coup)
- Customiser uniquement via `globals.css` et les variables CSS — ne jamais modifier les fichiers shadcn directement

### PWA
- Configurer `next-pwa` pour rendre l'app installable (manifest + service worker)
- Icônes app dans `public/icons/` (maskable + standard, toutes tailles)
- `manifest.json` dans `public/` : nom, couleurs, icônes, `display: standalone`
- L'app doit fonctionner **offline** pour la consultation (pas la modification)

---

## 8. Calendriers

Deux calendriers distincts, vue mensuelle, navigation mois par mois.

### Calendrier entraînements (`/calendar`)
- Affiche les `Session` sous forme de pastilles colorées par `TrainingType`
- Légende des types en haut de page (pills colorées) + bouton "Gérer" → `/admin/session-types`
- Jour actuel mis en évidence (cercle coloré sur le numéro)
- Clic sur une case → **modal du jour** : liste des séances + durée + bouton "+ Ajouter une séance ce jour"
- Clic sur une séance dans la modal → navigate vers `/sessions/[id]`
- Bouton "+ Nouvelle séance" en haut à droite
- Vue coach : toutes les séances / Vue athlète : ses séances uniquement

### Calendrier compétitions
- Affiche les `Competition` avec pastilles colorées par `CompetitionType`
- Même logique de navigation et de modal que le calendrier entraînements
- Pastilles propres aux compétitions (couleurs et formes différentes)

### Détail séance (`/sessions/[id]`)
- Header : type (pill colorée) + statut Passée/À venir + nom + date + heure + durée
- Section "Programme de la séance" : texte libre, éditable inline
- Section "Ressentis athlètes" :
  - RPE moyen /10 + label qualitatif (Facile / Modéré / Difficile / Très difficile) + barre visuelle + nb de retours
  - Liste individuelle : avatar + nom + disciplines + note RPE /10 + barre + commentaire libre de l'athlète
- Bouton download PDF en haut à droite
- Boutons Modifier + Supprimer

### Détail compétition (`/competitions/[id]`)
- Header : type (pill) + statut (pill) + nb disciplines (pill) + nom
- Bandeau 4 stats : nb inscrits / date / lieu / statut (Terminée, À venir...)
- Deux onglets :
  - **Infos pratiques** : ressources (site officiel lien cliquable, circulaire upload PDF, horaires texte) + notes libres
  - **Inscriptions (N)** : liste des inscrits avec avatar initiales + nom + numéro licence + badge FFA✓ + disciplines inscrites + badge "Toi" si utilisateur connecté + actions (lien FFA, éditer inscription, retirer)
- Bouton download PDF + Modifier + Supprimer

---

## 9. Scraping FFA (athle.fr)

> **Feature critique — logique entièrement isolée dans `lib/ffa-scraper.ts`**

- Endpoint dédié : `POST /api/ffa/sync`
- Prend en entrée le numéro de licence FFA de l'athlète
- Scrape `https://www.athle.fr/asp.net/main.html/fiche.aspx?base=participants&id={licence}`
- Récupère : nom, prénom, club, disciplines, performances récentes
- Mappe les données vers les entités `Athlete` et `Performance`
- **Toujours vérifier la structure HTML avant de scraper** (athle.fr change régulièrement)
- Gérer les erreurs silencieusement (l'athlète peut ne pas avoir de page FFA)

---

## 10. Spécifications fonctionnelles par page

### Dashboard (`/dashboard`)
- Salutation personnalisée + compteur athlètes suivis + date
- Boutons "Vue coach" / "Vue athlète" pour switcher de perspective
- Bouton "+ Nouvel athlète"
- Widget **ENTRAÎNEMENTS** : séances du jour, lien "Calendrier →", bouton "+ Créer une séance" si vide
- Widget **COMPÉTITIONS** : compétitions à venir, lien "Calendrier →", bouton "+ Ajouter" si vide
- Widget **PERFORMANCES RÉCENTES** : liste des dernières perfs de tous les athlètes
  - Chaque ligne : nom athlète + discipline + date + valeur + badge PB/SB + delta coloré (vert = amélioration, rouge = régression, unité s ou m selon discipline)
  - Clic sur une ligne → navigate vers le profil de l'athlète

### Liste athlètes (`/athletes`)
- Grid de cards, chaque card : photo ou avatar initiales + nom + âge + genre + disciplines (pills) + compteurs séances/perfs/objectifs
- Barre de recherche par nom
- Bouton "+ Nouvel athlète"
- Clic sur une card → `/athletes/[id]`

### Création athlète (`/athletes/new`)
- Deux modes : création manuelle (formulaire) ou import via numéro de licence FFA
- Champs identiques à la page édition (voir ci-dessous)

### Profil athlète (`/athletes/[id]`)
- Header : bannière customisée + avatar photo/initiales + nom + numéro licence FFA (#XXXXXXX) + disciplines (pills) + âge / genre / "Suivi depuis [mois année]"
- Lien "Profil athle.fr : bases.athle.fr" + date/heure dernière sync FFA
- Bandeau 4 stats : séances / performances / objectifs atteints / objectifs en cours
- Boutons : Stats avancées, Sync FFA, Resync complet, + Ajouter (perf)
- **6 onglets (sans rechargement de page) :**
  1. **Performances** : filtre saison (2025-26, 2024-25...) + filtre Tous/Indoor/Outdoor + bilan niveau par saison (badges niveau) + disciplines groupées avec mini-graphique sparkline + PB/SB par discipline. Clic discipline → détail des perfs avec delta coloré
  2. **Séances** : liste des séances assignées
  3. **Compétitions** : liste des compétitions de l'athlète
  4. **Objectifs** : liste des objectifs avec statut atteint/en cours
  5. **Vidéos** : bibliothèque vidéos liées à l'athlète
  6. **Notes** : notes coach sur l'athlète (compteur dans l'onglet)

### Édition athlète (`/athletes/[id]/edit`)
- **Identité** : prénom, nom, date de naissance, genre (select), numéro de licence FFA, URL profil athle.fr
- **Spécialités** groupées par catégorie (toggle pills) :
  - Sprints : 50m, 60m, 80m, 100m, 150m, 200m, 300m, 400m
  - Demi-fond / Fond : 600m → Marathon
  - Haies : 50m haies → 400m haies
  - Sauts : Longueur, Hauteur, Triple, Perche
  - Lancers : Poids, Disque, Javelot, Marteau
  - Épreuves combinées : Décathlon, Heptathlon, Pentathlon, Triathlon
  - Autres : Cross country, Marche, Relais 4x60m, 4x80m, 4x100m, 4x200m, 4x400m, Autre
- **Couleur par spécialité** : picker de couleur pour chaque discipline sélectionnée
- **Photo de profil** : upload image
- **Bannière du profil** : deux modes
  - *Motif* : sélecteur SVG parmi Sprint, Haies, Hauteur, Perche, Longueur, Triple, Javelot, Disque, Poids, Marteau + picker couleur + slider zoom (1x → ?)
  - *Photo* : upload image
- **Notes** : champ texte libre "Informations complémentaires"

### Types de séances (`/admin/session-types`)
- Liste des types existants avec barre de couleur à gauche + nom + actions éditer/supprimer
- Formulaire inline à droite : nom du type + palette de couleurs prédéfinie (16 couleurs) + affichage du code hex sélectionné + bouton Ajouter

### Utilisateurs (`/admin/users`)
- Grid de cards : avatar initiales coloré + nom + rôle(s) en pills + badge "Vous" sur l'utilisateur connecté
- Clic → `/admin/users/[id]`

### Édition utilisateur (`/admin/users/[id]`)
- **Identité** : prénom, nom, email
- **Profil athlète lié** : dropdown pour associer cet utilisateur à un profil athlète existant
- **Panneau rôle** (sidebar droite) : sélection parmi les 4 rôles, un seul actif à la fois, avec description de chaque rôle
- Avertissement "Vous modifiez votre propre compte" si applicable

### Feedbacks (`/admin/feedbacks`)
- Filtres combinables : Tous / Bugs / Suggestions + Nouveaux / En cours / Résolus
- Barre de recherche full-text dans les descriptions
- Chaque ticket :
  - Badge type (Bug 🐛 / Suggestion 💡) + badge statut + auteur + email + date
  - Description du ticket
  - Notes internes (texte libre, visible admin uniquement) + lien "+ Ajouter une note"
  - Actions inline : Nouveau → En cours → Résolu (cliquables directement sur la ligne)
  - Bouton supprimer ticket

---

## 11. Notifications

### In-app
- Entité `Notification` en DB
- Polling léger côté client (toutes les 30s) ou Server-Sent Events
- Badge compteur dans la nav

### WebPush
- Librairie `web-push` (npm)
- Générer les clés VAPID une seule fois : `npx web-push generate-vapid-keys`
- Clés VAPID dans `.env.local` : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Endpoint d'abonnement : `POST /api/push/subscribe`
- Endpoint d'envoi : `POST /api/push/send` (admin/coach uniquement)
- Service Worker à maintenir dans `public/sw.js`

---

## 12. Conventions de code

- **Langage :** TypeScript strict (`strict: true` dans `tsconfig.json`)
- **Composants :** PascalCase (`AthleteCard.tsx`)
- **Hooks :** camelCase préfixé `use` (`useAthlete.ts`)
- **API routes :** kebab-case (`/api/athlete-sessions`)
- **Variables/fonctions :** camelCase
- **Langue du code :** anglais (noms de variables, commentaires)
- **Langue de l'UI :** français
- **Imports :** toujours utiliser les alias `@/` (ex: `@/lib/prisma`)
- **Pas de `any`** en TypeScript sauf exception justifiée en commentaire

---

## 13. Variables d'environnement

```env
# Base de données — DEV LOCAL (SQLite)
DATABASE_URL="file:./dev.db"

# Base de données — PROD (Vercel Postgres / Neon) — à activer quand on passe en prod
# DATABASE_URL="postgresql://..."
# DATABASE_URL_UNPOOLED="postgresql://..."   # requis par Prisma sur Vercel

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# WebPush
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:contact@trackflow.app"

# Vercel Blob (vidéos)
BLOB_READ_WRITE_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."         # exposé côté client pour le SW
```

---

## 14. Checklist d'avancement

### ✅ Fait
**Session 1 — Fondations**
- [x] Init Next.js 14 + TypeScript + Tailwind (v4, voir note ci-dessous)
- [x] Setup shadcn/ui + next-themes (dark/light)
- [x] Schéma Prisma complet (17 entités, portées depuis le repo Symfony)
- [x] NextAuth v5 (login, register, middleware rôles)
- [x] Layout racine + nav (mobile + desktop) avec Framer Motion
- [x] PWA : manifest + next-pwa
- [x] CI/CD GitHub Actions (ci.yml, version-bump.yml)

> **Note technique :** le CLI `shadcn@latest` génère désormais des composants basés sur
> Tailwind v4 (syntaxe `gap-(--card-spacing)`, tokens `@theme`) et Base UI plutôt que Radix.
> Le projet a donc été migré sur Tailwind v4 (`@tailwindcss/postcss`, plus de `tailwind.config.ts`)
> pour rester compatible avec les futurs ajouts de composants — écart assumé par rapport à la
> section 2 qui visait Tailwind 3.x. `components/ui/input.tsx` a été corrigé pour forwarder le
> ref (nécessaire à react-hook-form) ; les autres primitives shadcn ajoutées plus tard devront
> être vérifiées au même titre si elles sont utilisées avec des refs.

**Session 2 — Dashboard**
- [x] Agrégation des données dashboard (`lib/dashboard.ts`, portage fidèle de
      `DashboardController.php` — pas d'API routes séparées : fetch direct
      côté Server Component, conformément à la règle absolue §2)
- [x] Widget entraînements + widget compétitions + widget perfs récentes
- [x] Badges PB/SB + delta coloré (vert/rouge) + unité s/m par discipline
- [x] Switch Vue coach / Vue athlète
- [x] Design final + animations
- [x] `prisma/seed.ts` pour peupler la base de dev (coach/athlète de test)

> **Note technique :** pas de routes `/api/athletes`, `/api/sessions` etc. pour le
> dashboard — les données sont lues directement depuis Prisma dans le Server
> Component (`app/(app)/dashboard/page.tsx`) via `lib/dashboard.ts`. Écart assumé
> par rapport à la liste d'origine en §14, qui mentionnait des "API routes
> dashboard" : la règle absolue du §2 ("le fetch se fait côté serveur via les
> Server Components") prime. Des API routes restent prévues pour les actions
> mutantes (créer/modifier une séance, une inscription, etc.) dans les sessions
> suivantes.

**Session 3 — Athlètes (liste + profil + édition)**
- [x] API routes athletes (CRUD complet) + notes/goals imbriquées
- [x] `/athletes` — grid de cards avec recherche
- [x] `/athletes/new` — création manuelle
- [x] `/athletes/[id]` — header bannière/avatar + bandeau stats + 6 onglets sans rechargement
- [x] Onglet Performances : regroupement par discipline, PB/SB (dégradé or/argent), delta coloré
- [x] Onglets Séances, Compétitions, Objectifs (CRUD léger), Vidéos, Notes (CRUD léger)
- [x] `/athletes/[id]/edit` — spécialités groupées + couleurs par discipline + bannière (couleur/photo + zoom) + photo profil
- [x] Design final + animations

> **Notes techniques / écarts assumés :**
> - **Import FFA sur `/athletes/new`** non implémenté — dépend du scraping
>   (`lib/ffa-scraper.ts`) prévu en Session 7. Le formulaire ne couvre que la
>   création manuelle pour l'instant.
> - **Photo/bannière** stockées en data URL base64 directement dans
>   `photoUrl`/`bannerUrl` (colonnes déjà prévues en `String` dans le schéma),
>   en attendant le branchement Vercel Blob (`BLOB_READ_WRITE_TOKEN`) en
>   Session 9. Fonctionnel en dev, à migrer avant prod pour éviter de gonfler
>   la base.
> - **Bannière "Motif"** simplifiée en sélecteur de couleur (dégradé) plutôt
>   que la bibliothèque de pictogrammes SVG par discipline (Sprint, Haies,
>   Hauteur...) décrite au §10 — écart de fidélité visuelle, pas de logique.
> - **Onglet Performances** : pas de filtres saison/indoor-outdoor ni de
>   "bilan niveau" (barème FFA) ni de sparklines Recharts — remplacé par un
>   regroupement par discipline dépliable avec historique + delta coloré
>   (réutilise `lib/performance.ts` de la Session 2). Le detail de la page
>   `/athletes/{id}/stats` (analytics avancées) du contrôleur Symfony n'a pas
>   été porté.
> - **Recherche** athlètes faite en mémoire (fetch complet + filtre JS) plutôt
>   qu'une requête SQL `contains`, pour éviter les pièges de casse
>   spécifiques à SQLite — pertinent à l'échelle d'un club, à revoir si le
>   roster grossit beaucoup.

**Session 4 — Calendriers + Séances**
- [x] API routes sessions (`POST`/`PATCH`/`DELETE`) + RPE (`POST` upsert sur `athleteId_sessionId`)
- [x] API routes training-types + competition-types (CRUD, admin uniquement)
- [x] `/calendar` — vue mensuelle unique avec onglets Entraînements/Compétitions animés
      (`layoutId`), légende couleurs + lien "Gérer", modal jour, navigation mois
- [x] `/sessions/[id]` — header (type + statut + date/heure/durée), programme, RPE moyen
      (grande jauge + barre 10 segments) + liste individuelle (avatar, disciplines,
      commentaire, RPE ou "Non effectuée"), édition/suppression pour coach/admin
- [x] Calendrier compétitions (pastilles propres par `CompetitionType`, dans le même
      calendrier via onglet plutôt que route séparée — voir écart ci-dessous)
- [x] `/admin/session-types` et `/admin/competition-types` — composant `TypeManager`
      partagé (liste + formulaire inline, palette 16 couleurs)
- [x] Bouton download PDF sur séance via `window.print()` + `print:hidden` sur toute
      la nav (sidebar, topbar, mobile-nav) et sur les boutons d'action
- [x] Design final + animations (cards arrondies, jauges RPE colorées, dialog de
      création/édition unifié)

> **Notes techniques / écarts assumés :**
> - **Un seul `/calendar`** avec onglets animés Entraînements/Compétitions, plutôt que
>   deux routes distinctes — plus cohérent avec la nav à une seule entrée "Calendrier"
>   et évite de dupliquer la logique de grille mensuelle (`lib/calendar-grid.ts`).
> - **PDF via `window.print()`** plutôt qu'une lib dédiée (jsPDF, react-pdf) — suffisant
>   pour un export propre d'une fiche séance, évite une dépendance lourde. Les composants
>   d'action (`SessionActions`, `PdfButton`) et toute la nav portent `print:hidden`.
> - **Création de compétition** depuis la modal jour du calendrier renvoie vers
>   `/competitions/new` (pas encore implémenté, prévu Session 5) — précédent déjà posé
>   en Session 3 pour les renvois vers des routes futures.
> - **RPE "non effectuée"** : un athlète peut marquer une séance comme non faite
>   (`skipped: true`, `difficulty: null`) plutôt que de laisser un ressenti — géré côté
>   `RpeLogForm` par une checkbox qui masque le slider.

### 🔄 En cours
- [ ] ...

### ⏳ À faire

**Session 1 — Fondations**
- [ ] Vercel Postgres connecté (reste en SQLite local jusqu'au déploiement)

**Session 5 — Compétitions**
- [ ] API routes competitions (CRUD, inscriptions, debrief)
- [ ] `/competitions/[id]` — onglet Infos pratiques (ressources : lien, PDF, horaires, notes) + onglet Inscriptions (liste avec FFA✓, badge Toi, actions)
- [ ] Bouton download PDF sur compétition
- [ ] Design final + animations

**Session 6 — Notifications + WebPush**
- [ ] Notifications in-app (polling / SSE)
- [ ] WebPush (VAPID, service worker, abonnement)

**Session 7 — Scraping FFA**
- [ ] `lib/ffa-scraper.ts` (Cheerio)
- [ ] Endpoint `POST /api/ffa/sync` + `POST /api/ffa/sync/full`
- [ ] Boutons Sync FFA + Resync complet sur page athlète
- [ ] Badge FFA✓ sur les inscriptions compétitions

**Session 8 — Admin**
- [ ] `/admin/users` — grid utilisateurs avec rôles + badge Vous
- [ ] `/admin/users/[id]` — édition identité + sélection rôle (4 rôles) + lien profil athlète
- [ ] `/admin/feedbacks` — filtres Bugs/Suggestions/statuts + recherche + actions inline Nouveau→En cours→Résolu + notes internes + suppression
- [ ] Design final

**Session 9 — Déploiement**
- [ ] Config Vercel (env vars, Postgres, Blob)
- [ ] Tests E2E basiques
- [ ] Domaine custom si applicable

---

## 15. Historique des sessions

| Session | Date | Bloc traité | État |
|---|---|---|---|
| 01 | 2026-07-30 | Fondations (Next.js + shadcn + Prisma + Auth + PWA) | ✅ |
| 02 | 2026-07-30 | Dashboard | ✅ |
| 03 | 2026-08-02 | Athlètes (liste + profil + édition) | ✅ |
| 04 | 2026-08-09 | Calendriers + Séances + Types | ✅ |
| 05 | - | Compétitions | ⏳ |
| 06 | - | Notifications + WebPush | ⏳ |
| 07 | - | Scraping FFA | ⏳ |
| 08 | - | Admin + Feedback | ⏳ |
| 09 | - | Déploiement Vercel | ⏳ |

> Mettre à jour ce tableau à chaque fin de session.

---

## 16. Règles Git & commits

- **Ne jamais ajouter de co-author** dans les commits (pas de `Co-authored-by: Claude` ou similaire)
- Messages de commit en français, format conventionnel : `feat:`, `fix:`, `chore:`, `refactor:`
- Un commit = une chose précise, pas de commits fourre-tout
- **Seuls `feat:` et `fix:` déclenchent un bump de version.** Les commits `chore:` et `refactor:` ne bumpent rien — c'est voulu.

---

## 17. CI/CD

### Vue d'ensemble — qui fait quoi

```
Push sur une branche / PR
  └── GitHub Actions : ci.yml
        ├── lint (ESLint + Prettier)
        ├── type-check (tsc --noEmit)
        └── ✅ OK → Vercel déclenche un deploy PREVIEW (URL unique par PR)
              ❌ KO → Vercel ne déploie pas, merge bloqué

Merge sur main
  ├── GitHub Actions : ci.yml (re-vérifie)
  ├── GitHub Actions : version-bump.yml (bump + tag + release)
  └── Vercel : deploy PRODUCTION automatique
```

Vercel écoute GitHub nativement — il déploie uniquement si les checks GitHub Actions sont verts.
**Sans CI, Vercel déploierait du code cassé en prod.** Les deux sont indissociables.

---

### Fichier 1 — `.github/workflows/ci.yml`

Déclenché sur chaque push et chaque PR.

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Installer les dépendances
        run: npm ci

      - name: Lint (ESLint)
        run: npm run lint

      - name: Vérification des types (TypeScript)
        run: npm run type-check

      - name: Vérification du format (Prettier)
        run: npm run format:check
```

**Scripts à ajouter dans `package.json` :**
```json
"scripts": {
  "lint": "next lint",
  "type-check": "tsc --noEmit",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

---

### Fichier 2 — `.github/workflows/version-bump.yml`

Déclenché uniquement au merge sur `main`. Analyse les commits, bumpe la version, crée le tag et la release.

```yaml
name: Version Bump

on:
  push:
    branches: [main]

jobs:
  bump:
    name: Bump version & Release
    runs-on: ubuntu-latest
    # Ne pas tourner sur le commit de bump lui-même (évite la boucle infinie)
    if: "!contains(github.event.head_commit.message, 'chore: bump version')"

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0          # nécessaire pour lire tout l'historique git
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Configurer git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Calculer la nouvelle version
        id: version
        run: |
          # Lire la version actuelle
          CURRENT=$(node -p "require('./package.json').version")
          echo "Version actuelle : $CURRENT"

          # Lire les commits depuis le dernier tag
          LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          if [ -z "$LAST_TAG" ]; then
            COMMITS=$(git log --oneline --pretty=format:"%s")
          else
            COMMITS=$(git log ${LAST_TAG}..HEAD --oneline --pretty=format:"%s")
          fi

          echo "Commits analysés :"
          echo "$COMMITS"

          # Détecter le type de bump
          HAS_FEAT=$(echo "$COMMITS" | grep -c "^feat:" || true)
          HAS_FIX=$(echo "$COMMITS" | grep -c "^fix:" || true)

          # Parser la version courante (MAJOR.MINOR ou MAJOR.MINOR.PATCH)
          MAJOR=$(echo $CURRENT | cut -d. -f1)
          MINOR=$(echo $CURRENT | cut -d. -f2)

          if [ "$HAS_FEAT" -gt 0 ]; then
            # Bump mineur — on drop le patch quel que soit l'état actuel
            NEW_MINOR=$((MINOR + 1))
            NEW_VERSION="${MAJOR}.${NEW_MINOR}"
            BUMP_TYPE="minor"
          elif [ "$HAS_FIX" -gt 0 ]; then
            # Bump patch
            PARTS=$(echo $CURRENT | tr '.' ' ' | wc -w)
            if [ "$PARTS" -eq 2 ]; then
              NEW_VERSION="${MAJOR}.${MINOR}.1"
            else
              PATCH=$(echo $CURRENT | cut -d. -f3)
              NEW_PATCH=$((PATCH + 1))
              NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"
            fi
            BUMP_TYPE="patch"
          else
            echo "Aucun feat: ou fix: trouvé — pas de bump"
            echo "skip=true" >> $GITHUB_OUTPUT
            exit 0
          fi

          echo "Nouvelle version : $NEW_VERSION (type: $BUMP_TYPE)"
          echo "new_version=$NEW_VERSION" >> $GITHUB_OUTPUT
          echo "bump_type=$BUMP_TYPE" >> $GITHUB_OUTPUT
          echo "skip=false" >> $GITHUB_OUTPUT

      - name: Bumper package.json
        if: steps.version.outputs.skip == 'false'
        run: |
          NEW_VERSION=${{ steps.version.outputs.new_version }}
          npm version $NEW_VERSION --no-git-tag-version
          git add package.json package-lock.json
          git commit -m "chore: bump version → v$NEW_VERSION"
          git push

      - name: Créer le tag git
        if: steps.version.outputs.skip == 'false'
        run: |
          NEW_VERSION=${{ steps.version.outputs.new_version }}
          git tag "v$NEW_VERSION"
          git push origin "v$NEW_VERSION"

      - name: Créer la GitHub Release
        if: steps.version.outputs.skip == 'false'
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.version.outputs.new_version }}
          name: TrackFlow v${{ steps.version.outputs.new_version }}
          generate_release_notes: true   # changelog auto depuis les commits
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

### Intégration Vercel ↔ GitHub

**Configuration à faire une seule fois sur Vercel :**

1. Connecter le repo GitHub depuis le dashboard Vercel
2. Dans **Settings → Git** : cocher "Require CI to pass before deploying"
3. Variables d'environnement à ajouter dans **Settings → Environment Variables** :
   - `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `NEXT_PUBLIC_APP_VERSION` → **ne pas setter manuellement**, Vercel le lit depuis `package.json` au build via :

**Dans `next.config.js` :**
```js
const { version } = require('./package.json')

module.exports = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
}
```

**Résultat final :**
- Preview deploy sur chaque PR → tester avant de merger
- Merge sur `main` → CI verte → version bumpée → tag créé → release GitHub → Vercel déploie en prod avec la bonne version affichée dans l'UI

---

## 18. Versioning automatique

### Version actuelle
> **v3.0** — la v2.4 était la dernière version Symfony. La réécriture Next.js démarre en v3.0.

### Règles de bump

| Type de changement | Commits concernés | Exemple | Résultat |
|---|---|---|---|
| Bug fix uniquement | uniquement `fix:` | `fix: correction calendrier` | `3.0 → 3.0.1` |
| Ajout de fonctionnalité | au moins un `feat:` | `feat: page compétitions` | `3.0 → 3.1` |
| Feature après patch | au moins un `feat:` | on était en `3.0.1` | `3.0.1 → 3.1` (patch tombe) |
| Changement majeur | décision manuelle uniquement | refonte, changement de techno | `3.x → 4.0` |

**Règle d'or :** le passage en version majeure (X.0) n'est jamais automatique. C'est une décision explicite du propriétaire du projet. Pour forcer une version majeure, modifier manuellement `package.json` avant le push, le workflow respectera la version en place.

### Affichage dans l'UI

La version est lisible dans le footer de l'app et/ou la page admin :

```tsx
// components/ui/AppVersion.tsx
export function AppVersion() {
  return (
    <span className="text-xs text-muted-foreground">
      v{process.env.NEXT_PUBLIC_APP_VERSION}
    </span>
  )
}
```

---

## 19. Référence — projet original (Symfony)

> Le repo Symfony est **entièrement public et librement accessible** pendant toute la durée du développement de la v3.x.
> C'est la **source de vérité absolue** pour toute la logique métier.
> En cas de doute sur un comportement, une règle de gestion, une relation entre entités, une validation
> ou un cas limite — **toujours aller lire le code Symfony en priorité**, jamais interpréter ou improviser.
>
> **Claude doit systématiquement fetcher le code Symfony concerné avant d'implémenter n'importe quelle feature.**

**Repo :** `https://github.com/Maksenoff/Trackflow`
**URL complète master :** `https://github.com/Maksenoff/Trackflow/tree/master`
**Raw fichiers :** `https://raw.githubusercontent.com/Maksenoff/Trackflow/master/`
**Branche principale :** `master`

**Stack originale :**
- Symfony 7.2, Doctrine ORM, Twig, Turbo Hotwire, Alpine.js, Chart.js, Tailwind, PostgreSQL

**Raison de la réécriture :** complexité de déploiement Azure avec Symfony + PHP + refonte graphique totale

---

### Comment utiliser ce repo comme référence

| Besoin | Où regarder dans le repo Symfony |
|---|---|
| Logique métier d'une feature | `src/Controller/XxxController.php` |
| Structure d'une entité / relations DB | `src/Entity/Xxx.php` |
| Règles de validation | Annotations Doctrine dans `src/Entity/` |
| Logique de scraping FFA | Chercher dans `src/` les usages de `DomCrawler` |
| Requêtes complexes (DQL) | `src/Repository/XxxRepository.php` |
| Templates / structure des pages | `templates/` |
| Sécurité et rôles | `src/Security/` + `config/packages/security.yaml` |
| Routes | `src/Controller/` (attributs `#[Route]`) |

**Workflow obligatoire pour Claude :**
1. Fetch le ou les fichiers Symfony concernés (entity + controller + repository)
2. Comprendre la logique métier exacte, les validations et les cas limites
3. Reproduire fidèlement dans Next.js/Prisma
4. Ne jamais écrire une API route ou un schéma Prisma sans avoir lu l'équivalent Symfony
