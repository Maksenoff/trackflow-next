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
}

export type ChangelogEntry = {
  version: string
  date: string // format libre affiché tel quel, ex: "Août 2026"
  sections: ChangelogSection[]
}

export const CHANGELOG: ChangelogEntry[] = [
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
