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
| `ROLE_COACH` | Coach | Séances + compétitions (CRUD complet), pastilles des deux calendriers (`/settings`, les deux onglets) ; **ne peut pas modifier le profil d'un athlète** (identité/photo/bannière/spécialités — réservé admin), sauf son propre profil s'il a un compte athlète lié |
| `ROLE_COMPETITION_MANAGER` | Gest. compétitions | Compétitions uniquement (CRUD), pastilles du calendrier compétitions seulement (`/settings`, onglet compétitions seul, sans l'onglet séances) ; ne gère ni séances ni profils athlètes (sauf le sien, s'il en a un lié) |
| `ROLE_ATHLETE` | Athlète | Consultation de ses propres données uniquement |

> **4 rôles**, pas 3. `ROLE_COMPETITION_MANAGER` est un rôle intermédiaire. Le schéma
> Prisma stocke `roles` en tableau JSON (legacy : un compte peut historiquement en
> avoir plusieurs), mais l'admin `/admin/users/[id]` impose désormais **un seul rôle
> actif à la fois** (sélection exclusive façon radio) — décision explicite du
> propriétaire du projet le 2026-08-14, qui annule le choix multi-rôles pris en
> Session 8. Voir écarts assumés de la Session 8 au §14.
>
> **Matrice de permissions précisée le 2026-08-18** (écart par rapport à la
> description initiale "Gestion athlètes" pour le coach, qui prêtait à confusion) :
> - **Modifier un profil athlète** (`/athletes/[id]/edit`, `PATCH /api/athletes/[id]`
>   hors `videosEnabled`) : admin, ou l'athlète pour son propre profil. Le coach en
>   est exclu — `canEdit` (large, coach inclus) reste utilisé pour séances/objectifs/
>   notes/débriefs sur l'onglet profil ; `canEditProfile` (strict) gère uniquement le
>   bouton "Modifier" + la page `/edit` (voir `app/(app)/athletes/[id]/page.tsx`).
> - **Créer** un nouvel athlète reste ouvert à coach + admin (`POST /api/athletes`,
>   non concerné par la restriction ci-dessus — l'onboarding d'un nouvel athlète est
>   traité comme une action distincte de la modification d'un profil existant).
> - **Pastilles séances** (`TrainingType`) : admin + coach uniquement.
> - **Pastilles compétitions** (`CompetitionType`) : admin + coach + gest. compétitions.
> - `/settings` accessible aux trois ; `SettingsTabs` masque l'onglet non autorisé
>   (et la barre d'onglets entière si un seul est permis, cf. gest. compétitions qui
>   n'a que l'onglet compétitions) ; nav (`nav-links.ts`, sidebar + bottom sheet
>   mobile) mise à jour pour afficher "Paramètres" aux trois rôles.
> - Vérifié en Playwright avec des comptes de test à rôle unique (le seed
>   `coach@trackflow.app` a Admin+Coach cumulés, donc insuffisant pour tester les
>   restrictions du coach seul).

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
- **Transitions de tabs :** slide horizontal (voir pattern exact ci-dessous)
- **Pastilles calendrier :** pop au hover (`scale: 1.15`)
- Pas d'animations > 0.4s — fluidité avant tout, jamais de lourdeur

### Composants UI standards — à réutiliser tel quel

> Ces patterns sont apparus indépendamment sur plusieurs pages (calendrier, profil
> athlète, détail compétition) avec des variantes légèrement différentes, ce qui casse
> l'homogénéité visuelle. **Règle : ne jamais réinventer un pattern ci-dessous —
> copier la structure et les classes exactement, seuls le contenu et les
> `layoutId`/valeurs de state changent.** Si un nouveau composant a besoin d'un
> pattern proche d'un de ceux-ci, partir de l'implémentation existante plutôt que
> d'en écrire une variante.

**Switcher à onglets (pill bar avec indicateur animé)** — utilisé pour tout choix
binaire ou multiple entre vues (onglets calendrier Entraînements/Compétitions,
onglets profil athlète, onglets détail compétition Infos pratiques/Inscriptions) :

- Conteneur : `flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm`
  (si le switcher partage sa ligne avec d'autres contrôles — ex. nav mois du calendrier
  — utiliser `inline-flex` au lieu de `flex` pour ne pas s'étirer en pleine largeur)
- Chaque bouton : `relative z-10 flex flex-1 items-center justify-center gap-1.5
  rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors`,
  texte `text-primary-foreground` si actif sinon `text-muted-foreground
  hover:text-foreground`
- Indicateur actif : `<motion.span layoutId="<nom-unique>" className="absolute inset-0
  -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm
  shadow-primary/30" transition={{ duration: 0.25, ease: 'easeOut' }} />` — un
  `layoutId` différent par instance de switcher sur la page pour éviter les
  collisions d'animation partagée
- Badge de compteur optionnel : `rounded-full px-1.5 text-[10px] font-bold`,
  `bg-white/20` si l'onglet est actif sinon `bg-muted`
- Contenu associé : `<AnimatePresence mode="wait" custom={direction} initial={false}>`
  avec un `motion.div` keyé sur l'onglet actif, `initial={{ x: direction * 16, opacity:
  0 }}`, `animate={{ x: 0, opacity: 1 }}`, `exit={{ x: direction * -16, opacity: 0 }}`,
  `transition={{ duration: 0.22, ease: 'easeOut' }}` — `direction` calculée en
  comparant l'index de l'onglet précédent et du nouveau (1 si on avance, -1 si on
  recule) pour que le slide aille dans le bon sens
- Ne pas utiliser le composant `Tabs`/`TabsList`/`TabsTrigger` de `components/ui/tabs.tsx`
  pour ce pattern : son `TabsTrigger` a `flex-1` par défaut, ce qui étire chaque
  onglet en blocs égaux dès qu'il y en a peu (2-3) — correct visuellement avec
  beaucoup d'onglets, moche avec deux. Le pattern ci-dessus (boutons + state manuel)
  donne un résultat identique quel que soit le nombre d'onglets.

**Bouton "Modifier" en pill sur les fiches détail** — norme validée sur la fiche
athlète (`components/athletes/profile-header.tsx`), à reprendre tel quel sur toute
nouvelle fiche détail (équipe, compétition...) plutôt que d'improviser un style de
bouton différent :

- Position : coin haut-droit du bandeau/header de la fiche, à côté des autres
  actions contextuelles (ex: Podiums, Sync FFA)
- Forme : pill `rounded-full`, icône `Pencil` (lucide) + libellé "Modifier"
- Style **si le bouton est posé sur une bannière/photo** (donc le fond derrière
  n'est pas prévisible) : verre dépoli neutre en blanc, indépendant du thème —
  `inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10
  px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors
  hover:bg-white/20`
- Style **si le bouton est posé sur un fond de card normal** (pas de photo derrière,
  ex: fiche équipe) : mêmes proportions mais sur les tokens de thème —
  `inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50
  px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted`
- Sur une fiche qui bascule "vue / édition" (ex: équipe) : le bouton devient un
  toggle plein (`bg-primary text-primary-foreground`) avec icône `Check` et
  libellé "Terminé" tant que l'édition est active, plutôt que de garder l'icône
  crayon — signale clairement l'état actif.

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

## 12bis. Environnement de dev local (Windows / OneDrive)

> Le repo local vit sous `OneDrive\Bureau\Trackflow`. OneDrive resynchronise en continu
> tout ce qui change dans ce dossier — y compris `node_modules/` et `.next/`, qui sont
> réécrits en permanence pendant `npm run dev`. Ça provoque des verrous de fichiers
> Windows et corrompt le cache webpack : le serveur dev se met à 404/500 sur des routes
> après une simple sauvegarde de fichier, sans rapport avec le code changé.

**Fix en place :** `node_modules/` et `.next/` sont des **jonctions NTFS** (`mklink /J`)
qui pointent vers `C:\Users\<user>\.trackflow-cache\` (hors OneDrive). Le chemin du
projet ne change pas — `ls`/`git status` les voient comme des dossiers normaux — mais
leur contenu réel n'est jamais synchronisé par OneDrive, donc plus de corruption.

- Ne jamais `rm -rf node_modules` en pensant réinstaller proprement sans vérifier que la
  jonction reste intacte ensuite (`npm install` réécrit à travers la jonction sans
  problème, mais un outil qui *supprime puis recrée* le dossier peut casser le lien —
  dans ce cas, recréer la jonction avec `mklink /J`).
- Si le serveur dev déraille quand même après une modif : d'abord vérifier qu'aucun
  ancien process `node.exe` ne traîne (`tasklist`), sinon `.next`/le client Prisma
  peuvent rester verrouillés. Toujours arrêter le serveur dev avant `prisma migrate`/
  `prisma generate` (Windows ne permet pas de réécrire un `.dll` en cours d'utilisation).
- Ce setup est spécifique à cette machine — rien à committer, `next.config.mjs` ne doit
  pas repartir sur un `distDir` custom (testé : ça casse la résolution de `node_modules`
  depuis les fichiers compilés, car Node résout les paquets en remontant l'arborescence
  depuis l'emplacement du fichier compilé).
- **Plusieurs fenêtres Claude en parallèle sur ce repo** (ex: une sur les droits, une
  sur une autre feature) : `DATABASE_URL` pointe vers le même `dev.db` partagé pour
  toutes, donc si l'une des deux lance `prisma migrate dev` pendant que le serveur dev
  de l'autre tourne déjà, ce serveur garde un **Prisma Client périmé** en mémoire —
  symptôme observé : `Unknown field 'xxx' for select statement` sur un champ/relation
  qui existe pourtant bien dans `schema.prisma` et dans la DB (`prisma migrate status`
  dit "up to date"). Le fix est juste de redémarrer son propre `npm run dev`, rien de
  cassé côté schéma/données.

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
- [x] Design final + animations (cards arrondies, jauges RPE colorées, dialog de
      création/édition unifié)
- [x] Glisser-déposer des séances et compétitions dans la grille mensuelle (souris :
      drag classique ; tactile : appui long) pour changer leur date en un geste
- [x] Nav renommée "Calendriers" (pluriel) ; l'entrée "Compétitions" retirée de la
      nav (tout passe par l'onglet Compétitions du calendrier désormais)

> **Notes techniques / écarts assumés :**
> - **Un seul `/calendar`** avec onglets animés Entraînements/Compétitions, plutôt que
>   deux routes distinctes — plus cohérent avec la nav à une seule entrée "Calendriers"
>   et évite de dupliquer la logique de grille mensuelle (`lib/calendar-grid.ts`).
> - **Export PDF retiré** — jugé non utile à l'usage, retiré de `/sessions/[id]`
>   (composant `PdfButton` supprimé). Les classes `print:hidden` restent sur la nav
>   par précaution (impression navigateur manuelle), sans bouton dédié.
> - **RPE "non effectuée"** : un athlète peut marquer une séance comme non faite
>   (`skipped: true`, `difficulty: null`) plutôt que de laisser un ressenti — géré côté
>   `RpeLogForm` par une checkbox qui masque le slider.
> - **Création/édition de compétition** : d'abord un `CompetitionFormDialog` compact
>   dans le calendrier (Session 4), puis remplacé en Session 5 par un formulaire pleine
>   page (`/competitions/new`, `/competitions/[id]/edit`) une fois les champs Session 5
>   ajoutés (ressources, disciplines, performances attendues) — trop riche pour un
>   dialog, même pattern que `/athletes/new`. Le composant `CompetitionFormDialog` a
>   été supprimé.

**Session 5 — Compétitions**
- [x] API routes competitions (CRUD complet : titre/date/lieu/type/site/circulaire/
      horaires/notes/disciplines disponibles/performances attendues)
- [x] API routes inscriptions (`POST` upsert, `PATCH`, `DELETE` sur
      `/api/competitions/[id]/registrations`), FFA réservé coach/admin/gest. compét.
- [x] `/competitions/[id]` — header (type + statut + nb disciplines) + bandeau 4 stats
      (inscrits/date/lieu/statut) + onglet Infos pratiques (ressources : site officiel,
      circulaire, horaires, notes) + onglet Inscriptions (liste avec FFA✓, badge Toi,
      disciplines + perf attendue, actions modifier/retirer)
- [x] `/competitions/new` et `/competitions/[id]/edit` — formulaire complet (type en
      pastilles, upload circulaire/horaires en data URL, toggle "Performances
      attendues", sélecteur de disciplines "Toutes" / "Sélection manuelle" avec
      épreuves personnalisées)
- [x] Design final + animations

> **Notes techniques / écarts assumés :**
> - **Logique métier portée du Symfony d'origine** (`Competition`,
>   `CompetitionRegistration`, `CompetitionController`) : `availableDisciplines` vide =
>   toutes les disciplines ; épreuves hors référentiel standard regroupées sous
>   "Personnalisées" ; auto-inscription par l'athlète lié, upsert idempotent ; badge FFA
>   réservé au coach/admin ; statut passé/à venir en comparaison de date seule (un jour
>   J n'est jamais "passé" avant le lendemain).
> - **Fichiers (circulaire/horaires) en data URL** dans `documentUrl`/`schedulesUrl`,
>   même précédent que les photos/bannières athlète (Session 3) — à migrer vers Vercel
>   Blob avant la prod. Garde-fou côté formulaire : 8 Mo max par fichier.

**Session 5bis — Debriefs + refonte design profil athlète (hors plan initial)**
- [x] Debrief séances : ouverture 20h30 le soir même, auto-passage en "non faite"
      après 3 jours sans debrief (`lib/session-debrief.ts`, `computeDebriefStatus`
      réutilisable séances/compétitions), fiche de ressenti (slider difficulté coloré
      vert→rouge, commentaire) via `session-debrief-dialog.tsx`
- [x] Onglet Séances du profil athlète : filtres À débriefer / Faites / Non faites +
      sous-filtre par type de séance (pastille), cards couleur selon difficulté RPE
- [x] Debrief compétitions : même logique que les séances (`CompetitionDebrief`,
      fenêtre 3 jours, ressenti général + commentaire libre, résultat laissé vide en
      attendant le scraping FFA) via `competition-debrief-dialog.tsx`
- [x] Onglet Compétitions du profil athlète : filtres Non débriefée / Débriefée +
      sous-filtre par type de compétition
- [x] Refonte onglets profil athlète (Performances/Séances/Compétitions/Objectifs/
      Vidéos/Notes) : pill bar pleine largeur + indicateur animé + transitions slide
      (pattern standardisé, voir §7)
- [x] Refonte onglet Notes : création/édition en pop-up (taille carte), grid 4
      colonnes, épingle en gold/jaune (max 2), clic sur une carte pour voir/modifier
      le contenu complet
- [x] Aperçu au survol du calendrier repensé : positionné au-dessus/en-dessous de la
      pastille survolée, couleur reprise du type de séance/compétition

**Session 7 — Scraping FFA**
- [x] `lib/ffa-scraper.ts` (Cheerio) — port fidèle de `FfaSync.php` : patterns de
      disciplines, seuils de temps minimum plausibles, parsing profil (nom, date de
      naissance, genre, licence via JSON-LD/regex), parsing résultats AJAX par année
      avec gestion cookie de session, affinage poids/disque/javelot/marteau/haies par
      catégorie d'âge FFA, recalcul des records personnels
- [x] `POST /api/ffa/lookup` (lookup profil par URL, utilisé sur `/athletes/new`)
- [x] `POST /api/athletes/[id]/sync-ffa` (cache 5 min sauf `force`, même logique que
      le contrôleur Symfony d'origine)
- [x] `POST /api/athletes/[id]/full-resync-ffa` (admin uniquement — supprime les
      performances FFA existantes et réimporte tout)
- [x] Boutons Sync FFA + Resync complet sur la page athlète (bandeau photo, visibles
      uniquement si `ffaProfileUrl` renseignée ; Resync réservé admin) + date/heure de
      dernière sync affichée à côté du lien "Profil athle.fr"
- [x] Mode import FFA sur `/athletes/new` : écran de choix (Avec profil athle.fr /
      Manuellement) → recherche par URL → formulaire prérempli (badge "Prérempli via
      athle.fr"), éditable avant création
- [x] Vérifié en conditions réelles (Playwright + requêtes live vers athle.fr) :
      gestion d'URL invalide, profil introuvable, et parsing réel (genre + licence
      correctement extraits d'une page athle.fr existante)

> **Notes techniques / écarts assumés :**
> - **Endpoints de debug Symfony non portés** (`debug-ffa`, `debug-birthdate`,
>   `diagnose-ffa`) — utiles uniquement en développement pour inspecter le HTML brut
>   d'athle.fr, pas nécessaires en usage normal.
> - **Badge FFA✓ sur les inscriptions compétitions** : déjà implémenté en Session 5
>   (champ `ffaRegistered` sur `CompetitionRegistration`) — sans lien avec la sync de
>   performances portée ici, qui opère au niveau de l'athlète (`Athlete.ffaProfileUrl`).
> - **`tsconfig.json`** : ajout de `"target": "es2020"` (absent auparavant, donc ES3
>   par défaut) — nécessaire pour les regex `u` et `matchAll`/itérations `Map` utilisées
>   dans le scraper ; sans impact sur le build (Next.js compile via SWC, pas `tsc`).

**Session 6 — Notifications + WebPush** (avancée avant la Session 8/9 — décision
explicite du propriétaire du projet le 2026-08-14, "faire les droits" en parallèle
dans une autre fenêtre)
- [x] `lib/notifications.ts` — port fidèle de `NotificationService.php` : `notify`
      générique avec dédoublonnage (pas de doublon non-lu même type/URL),
      `feedbackUpdated`, `ffaConfirmed`, `athleteRegistered`, `competitionSoon`, +
      flux "séance à débriefer" calculé à la volée (fusionné avec les notifications
      stockées) sur notre propre règle de debrief plutôt que celle du Symfony
      d'origine (cf. `lib/session-debrief.ts`)
- [x] `lib/push.ts` — envoi WebPush via `web-push`, VAPID déjà en `.env`, suppression
      auto des abonnements expirés (404/410)
- [x] API : `GET /api/notifications/feed`, `POST /api/notifications/[id]/read`,
      `DELETE /api/notifications/[id]`, `POST /api/notifications/read-all`,
      `POST /api/push/subscribe`, `POST /api/push/unsubscribe`
- [x] Notifications câblées sur les événements existants : inscription compétition
      (notifie coach/admin, sauf l'auteur) et confirmation badge FFA (notifie
      l'athlète) dans les routes `registrations` déjà en place
- [x] `NotificationBell` (polling 30s) : badge non-lus, panneau avec icône par type,
      marquer lu/tout lu, suppression, bouton "Activer les notifications push" —
      intégré dans `Sidebar` (desktop) et `MobileNav` (mobile, bottom nav)
- [x] Service worker : `public/push-sw.js` (handlers `push`/`notificationclick`)
      importé dans le `sw.js` généré via `next.config.mjs` (`importScripts`), pour ne
      pas être écrasé au build

> **Notes techniques / écarts assumés :**
> - **Bug pré-existant corrigé** : `next-pwa` v5 cible le Pages Router pour
>   l'auto-injection du script d'enregistrement du service worker — avec l'App
>   Router de ce projet, `/sw.js` était généré et servi mais **jamais enregistré
>   côté client**, silencieusement (PWA/push cassés depuis la Session 1, jamais
>   détecté faute de test en build production). Corrigé avec un enregistrement
>   manuel (`components/sw-register.tsx`, monté dans `Providers`, actif uniquement
>   en production).
> - **Vérifié en build production réel** (`next build && next start`) : le service
>   worker s'enregistre et s'active correctement. L'appel `pushManager.subscribe()`
>   lui-même n'a pas pu être vérifié par Playwright — Chrome désactive
>   délibérément la Push API en mode incognito, et Playwright lance toujours un
>   contexte incognito ; limitation de l'outil de test, pas du code. Le
>   round-trip serveur (create/notify/dédoublonnage/suppression des abonnements
>   expirés) est lui vérifié par appels directs aux endpoints.
> - **Rappels J-2 compétition** (`competitionSoon`, `CheckCompetitionNotificationsCommand`
>   côté Symfony) : logique portée dans `lib/notifications.ts` mais pas encore
>   câblée sur un cron — nécessite Vercel Cron (Session 9, déploiement) pour être
>   déclenchée automatiquement.
> - **SSE non implémenté** — polling 30s choisi à la place (plus simple, cohérent
>   avec le choix déjà entériné au §11 du CLAUDE.md).

**Session 8 — Admin** (gestion utilisateurs/rôles avancée avant les feedbacks —
décision explicite du propriétaire du projet le 2026-08-14, périmètre restreint à
"le côté droits" pour cette passe)
- [x] `/admin/users` — grid utilisateurs (avatar initiales, rôles en pills, badge
      "Vous"), redirection de `/admin` vers `/admin/users`
- [x] `/admin/users/[id]` — édition identité (prénom/nom/email) + panneau rôles +
      lien profil athlète (`PATCH /api/users/[id]`)
- [x] Redesign panneau rôle + sélecteur "Profil athlète lié" : cartes avec icône par
      rôle, sélection exclusive façon radio (indicateur rond + check), Select du
      profil lié avec icône ; `BackButton` ajouté en haut de la page (pattern §7)
- [x] 2ᵉ passe redesign (2026-08-17) : couleur distincte par rôle (`ROLE_COLORS` dans
      `lib/roles.ts`, réutilisée sur les cards `/admin/users` et le panneau rôle),
      cards de rôle compactées, barre Annuler/Enregistrer déplacée en haut de page
      (visible sans scroll), bug de position du menu déroulant "Profil athlète lié"
      corrigé (le wrapper `<span>` custom autour de `SelectValue` cassait le calcul
      de position `alignItemWithTrigger` de base-ui — retour à un trigger simple)
- [x] Nouveaux champs admin sur `/admin/users/[id]` : réinitialisation du mot de
      passe (dialog dédié, `POST /api/users/[id]/reset-password`), infos lecture
      seule (créé le / dernière connexion — nouveau champ `User.lastLoginAt`, mis à
      jour dans `lib/auth.ts` à chaque connexion réussie), désactivation de compte
      (`User.disabled`, bloque la connexion dans `authorize()`, non retirable sur
      soi-même comme la protection sur le rôle Admin)
- [x] Toggle "Onglet Vidéos" par athlète (`Athlete.videosEnabled`, `@default(true)`),
      onglet Vidéos masqué dans `ProfileTabs` si désactivé
- [x] 3ᵉ passe (2026-08-17) : le panneau "infos athlète + toggle Vidéos" a été
      **déplacé** de `/athletes/[id]/edit` (accessible aussi aux coachs) vers
      `/admin/users/[id]` (strictement admin), affiché uniquement si l'utilisateur a
      un profil athlète lié — nouvelle section "Athlète lié" dans `UserEditForm`
      (`components/admin/user-edit-form.tsx`), toujours via
      `PATCH /api/athletes/[id]` (admin-only sur `videosEnabled`), déclenché en même
      temps que le PATCH utilisateur au clic sur le même bouton "Enregistrer"
- [x] "Historique FFA à synchroniser" (champ `ffaSyncSinceYear`, ajouté par ailleurs
      dans cette session) : la liste déroulante proposait toutes les saisons depuis
      1990 (~37 options) — changée pour ne proposer que les saisons depuis la
      performance la plus ancienne de l'athlète (calculé dans
      `/athletes/[id]/edit/page.tsx`, passé en prop `earliestSeasonStart`)
- [x] Bouton feedback flottant discret (bas droite, toutes les pages authentifiées,
      `components/feedback/feedback-widget.tsx` monté dans `app/(app)/layout.tsx`) →
      panneau latéral (`Sheet` `side="right"`) avec sélecteur Bug/Suggestion + zone de
      texte + compteur de caractères + état de succès auto-fermant, `POST /api/feedbacks`
      (description min. 5 caractères, `page` capturée via le pathname courant, snapshot
      `authorName`/`authorEmail` au moment de l'envoi)
- [x] `/admin/feedbacks` — filtres combinables Tous/Bugs/Suggestions × Nouveaux/En
      cours/Résolus (`components/admin/feedbacks-panel.tsx`), recherche full-text
      client (description + auteur + email), badge type + statut + auteur + date +
      page d'origine par ticket, note interne éditable (`+ Ajouter une note`), actions
      de statut inline Nouveau→En cours→Résolu, suppression ; `GET`/`PATCH`/`DELETE
      /api/feedbacks[/[id]]` (admin uniquement)
- [x] Sous-navigation admin (`components/admin/admin-sub-nav.tsx`, pill bar animée
      façon §7) entre Utilisateurs et Feedbacks, dans un `app/(app)/admin/layout.tsx`
      partagé (gate `isAdmin` + padding commun) — badge du nombre de tickets non
      résolus sur l'onglet Feedbacks ; visible uniquement sur les pages index, masquée
      sur `/admin/users/[id]` (page de détail avec son propre `BackButton`)
- [x] Changement de statut → `notifyFeedbackUpdated` (déjà présent dans
      `lib/notifications.ts` depuis la Session 6) notifie l'auteur du ticket, in-app +
      WebPush, sur transition vers En cours/Résolu uniquement (pas sur Nouveau, fidèle
      au contrôleur Symfony d'origine)
- [x] Design final + animations
- [x] Vérifié en conditions réelles (Playwright) : soumission d'un ticket, apparition
      immédiate côté admin, filtres type/statut, recherche, transition de statut +
      persistance après rechargement, note interne + persistance, notification reçue
      par l'auteur, suppression, accès mobile via Système → Admin → onglet Feedbacks

> **Notes techniques / écarts assumés :**
> - **Logique portée du contrôleur/entité Symfony d'origine** (`FeedbackController.php`,
>   `Feedback.php`) : type par défaut `bug`, validation description ≥ 5 caractères
>   (client + serveur), snapshot `authorName`/`authorEmail` au moment de la création
>   (pas de jointure live sur `User`), passage automatique de `resolvedAt` à la date du
>   jour au premier passage en `done`, notification uniquement sur transition vers
>   `in_progress`/`done`. Le schéma Prisma `Feedback` existait déjà à l'identique
>   (ajouté anticipativement en Session 6) — aucune migration nécessaire.
> - **URL de la notification de changement de statut** : le Symfony d'origine pointait
>   vers `/feedback#{id}` (une page "mes feedbacks" côté utilisateur). Cette route n'a
>   pas d'équivalent dans ce rewrite (hors périmètre de la demande, qui ne prévoit que
>   le widget de soumission côté utilisateur, pas de liste consultable). L'URL a été
>   changée en `/dashboard?feedback={id}` — sert uniquement de clé de dédoublonnage
>   stable par ticket dans `notifyFeedbackUpdated`, le clic ramène au dashboard plutôt
>   que vers une route inexistante.
> - **Pas de notification aux admins à la création d'un ticket** — fidèle à l'origine
>   (`FeedbackController::report()` ne notifie personne), seule la mise à jour de
>   statut notifie l'auteur.
> - **Rôle exclusif (un seul actif à la fois)**, choix inversé le 2026-08-14 par
>   rapport à la première passe de cette session (qui avait opté pour des checkboxes
>   multi-rôles en citant le §5). Le propriétaire du projet a confirmé vouloir un
>   choix radio strict : sélectionner un rôle désélectionne l'ancien
>   (`components/admin/user-edit-form.tsx`, `roles` reste un tableau côté schéma
>   mais toujours de longueur 1 depuis l'UI). Le §5 a été mis à jour en conséquence.
>   La protection serveur contre l'auto-retrait du rôle Admin (voir ci-dessous)
>   continue de fonctionner à l'identique avec un tableau à un seul élément.
> - **Désactivation de compte** bloque uniquement les *nouvelles* connexions
>   (vérifié dans `authorize()`). Une session JWT déjà active pour ce compte n'est
>   pas invalidée immédiatement — l'utilisateur reste connecté jusqu'à expiration
>   ou reconnexion. Pas de logique Symfony équivalente à porter (feature absente de
>   l'app d'origine) ; invalidation immédiate hors scope de cette passe.
> - **Logique portée du contrôleur Symfony d'origine** (`UserAdminController.php`) :
>   protection contre l'auto-retrait de son propre rôle Admin, et double-flush pour
>   délier un athlète déjà lié à un autre compte avant de créer le nouveau lien.
>   L'édition d'identité (prénom/nom/email) n'existe pas dans le Symfony d'origine
>   (qui ne gérait que rôle + lien athlète) — ajoutée ici pour suivre le §10 du
>   CLAUDE.md, sur le même schéma que `PATCH /api/athletes/[id]`.
> - **Suppression de compte non portée** dans cette passe (route existait côté
>   Symfony) — hors du périmètre "gestion utilisateurs + rôles" demandé, à ajouter
>   si besoin plus tard.

### 🔄 En cours
- [ ] ...

### ⏳ À faire

**Session 1 — Fondations**
- [ ] Vercel Postgres connecté (reste en SQLite local jusqu'au déploiement)

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
| 05 | 2026-08-12 | Compétitions | ✅ |
| 05bis | 2026-08-13 | Debriefs séances/compétitions + refonte profil athlète | ✅ |
| 07 | 2026-08-13 | Scraping FFA | ✅ |
| 06 | 2026-08-14 | Notifications + WebPush | ✅ |
| 08 | 2026-08-17 | Admin + Feedback | ✅ |
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
