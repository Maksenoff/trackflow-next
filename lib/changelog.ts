// Historique des nouveautés/corrections, affiché sur /changelog (lien depuis
// AppVersion, cf. components/ui/AppVersion.tsx). Contenu pensé pour les
// utilisateurs (coachs/athlètes), pas un changelog technique — pas de jargon
// Next.js/Prisma/API.
//
// À MAINTENIR À CHAQUE SESSION : quand un commit feat:/fix: livre quelque
// chose de visible pour l'utilisateur, ajouter une entrée ici (nouvelle
// version en tête de liste, ou compléter la version en cours si elle n'a pas
// encore été taguée). Ne pas attendre qu'on te le demande — c'est une
// consigne permanente (voir CLAUDE.md §18bis).

export type ChangelogSection = {
  title: string
  items: string[]
  // 'feature' (défaut) pour une nouveauté, 'fix' pour une correction — affichés
  // avec un accent visuel différent sur /changelog pour que les corrections
  // ne se noient pas au milieu des nouveautés (utile surtout à partir des
  // versions patch, ex: 3.0.1, qui ne contiendront souvent que des fix).
  kind?: 'feature' | 'fix'
}

export type ChangelogEntry = {
  version: string
  date: string // format libre affiché tel quel, ex: "Août 2026"
  sections: ChangelogSection[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '3.1',
    date: 'Septembre 2026',
    sections: [
      {
        title: 'Nouvelle interface',
        items: [
          "Nouveau design pour toute l'application : navigation, tableau de bord et notifications repensés",
          "Choix de la couleur d'accent dans les paramètres (Apparence)",
          "Nouveau logo, y compris l'icône de l'application sur l'écran d'accueil",
        ],
      },
      {
        title: 'Notifications',
        items: [
          "Panneau de notifications repensé, organisé par jour, avec une icône propre à chaque type d'événement",
        ],
      },
      {
        title: 'Séances',
        items: [
          "Calculateur d'allure : à partir d'un temps connu sur une distance repère, calcule le temps cible sur la distance de la séance à un % d'allure donné — les temps repère saisis sont mémorisés d'une séance à l'autre",
        ],
      },
      {
        title: 'Calendrier',
        items: [
          'Nouvelle vue semaine mobile en carrousel, un jour à la fois (glissement tactile)',
          "Météo affichée sur les jours où une séance est prévue, à l'heure de la séance",
          'Anniversaires des athlètes affichés directement dans le calendrier',
        ],
      },
      {
        title: 'Corrections',
        kind: 'fix',
        items: [
          'Le panneau Feedbacks (admin) s’ouvre désormais directement sur les tickets "Nouveaux" au lieu de tout afficher par défaut',
          "Correction de l'affichage des noms, tantôt en majuscules tantôt non, dans le détail d'un vote et ailleurs dans l'application",
          "Correction d'un affichage cassé sur iPhone : le bouton et le lien « Créer un vote » passaient sous la barre de statut et devenaient inaccessibles",
          'Sur le tableau de bord, la prochaine séance affiche maintenant le prénom du coach avec un point vert (présent) ou rouge (absent) plutôt que "créée par"',
        ],
      },
    ],
  },
  {
    version: '3.0',
    date: 'Août 2026',
    sections: [
      {
        title: 'Une nouvelle application',
        items: [
          'Réécriture complète de TrackFlow : nouveau design, plus rapide, installable comme une application sur mobile (PWA)',
          'Thème clair et sombre, adapté mobile en priorité',
        ],
      },
      {
        title: 'Tableau de bord',
        items: [
          'Vue coach et vue athlète, avec bascule rapide entre les deux',
          'Widgets séances du jour, compétitions à venir et dernières performances',
        ],
      },
      {
        title: 'Athlètes',
        items: [
          'Profil complet : performances, séances, compétitions, objectifs, vidéos, notes du coach',
          'Import automatique depuis athle.fr (profil + historique de performances)',
          'Spécialités personnalisables avec couleur par discipline',
          'Photo de profil et bannière personnalisables',
        ],
      },
      {
        title: 'Calendriers',
        items: [
          'Calendrier entraînements et calendrier compétitions, glisser-déposer pour changer une date',
          "Séances personnelles ajoutées par l'athlète, en plus du programme du coach",
        ],
      },
      {
        title: 'Débriefs',
        items: [
          'Ressenti (difficulté + commentaire) après chaque séance et chaque compétition',
          "Rappel automatique si le debrief n'a pas été fait",
        ],
      },
      {
        title: 'Compétitions',
        items: [
          'Inscriptions avec disciplines et performances attendues',
          'Ressources pratiques centralisées : site officiel, circulaire, horaires',
        ],
      },
      {
        title: 'Objectifs',
        items: [
          "Suivi de progression par discipline, validation automatique dès qu'une performance FFA les atteint",
        ],
      },
      {
        title: 'Équipes de relais',
        items: [
          "Création d'une équipe de relais, ordre des coureurs et marques de passation",
          'Historique des chronos en compétition',
          "N'importe quel athlète peut créer sa propre équipe — pas seulement le coach",
        ],
      },
      {
        title: 'Votes de la communauté',
        items: [
          'Duels de suggestions proposées par les athlètes, à confronter deux par deux',
          "Création d'un vote personnalisé ouverte à tous, modification par l'auteur ou l'admin",
          'Détail de qui a voté pour quoi',
          "Épinglage par l'admin des votes à mettre en avant",
        ],
      },
      {
        title: 'Notifications',
        items: [
          'Rappel avant une séance, confirmation de synchronisation FFA, inscription à une compétition',
          'Notifications sur le téléphone (push), même application fermée',
        ],
      },
      {
        title: 'Administration',
        items: [
          'Gestion des comptes, des rôles et des feedbacks/bugs remontés par les utilisateurs',
          'Personnalisation des couleurs de types de séances et de compétitions',
        ],
      },
    ],
  },
]
