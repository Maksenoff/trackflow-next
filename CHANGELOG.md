# Changelog

Toutes les nouveautés et corrections notables de TrackFlow sont documentées dans ce
fichier, du point de vue de l'utilisateur (coach/athlète) — pas un historique de
commits techniques.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).
Chaque version regroupe ses changements sous **Ajouté**, **Modifié**, **Corrigé**
(une sous-section vide est omise à la publication).

## [Non publié]

### Ajouté

### Modifié

### Corrigé

## [3.1.0] - 2026-09-19

### Ajouté

- **Nouvelle interface** : devient l'interface par défaut de toute l'application
  (navigation, tableau de bord et notifications repensés) ; l'ancienne reste
  accessible aux seuls comptes admin depuis les paramètres, pour comparer/dépanner.
- **Apparence** : choix de la couleur d'accent dans les paramètres, ouvert à tous
  les comptes (bleu, rouge, vert, orange, bleu ciel, cyan, blanc/noir adaptatif au
  thème, bordeaux/pourpre, violet foncé, vert/bleu).
- **Nouveau logo** (icône "TF" en relief), y compris l'icône de l'application sur
  l'écran d'accueil (PWA) et le favicon.
- **Calculateur d'allure** sur les séances : à partir d'un temps connu sur une
  distance repère, calcule le temps cible sur la distance de la séance à un %
  d'allure donné ; les temps repère saisis sont mémorisés d'une séance à l'autre.
- **Calendrier** : nouvelle vue semaine mobile en carrousel (un jour à la fois,
  glissement tactile) ; météo affichée sur les jours où une séance est prévue, à
  l'heure de la séance ; anniversaires des athlètes affichés directement dans la
  grille.

### Modifié

- Panneau de notifications réorganisé par jour, avec une icône propre à chaque
  type d'événement.

### Corrigé

- Le panneau Feedbacks (admin) s'ouvre désormais directement sur les tickets
  "Nouveaux" au lieu de tout afficher par défaut.
- Correction de l'affichage des noms, tantôt en majuscules tantôt non, dans le
  détail d'un vote et ailleurs dans l'application.
- Correction d'un affichage cassé sur iPhone : le bouton et le lien "Créer un vote"
  passaient sous la barre de statut et devenaient inaccessibles.

## [3.0.0] - 2026-09-01

### Ajouté

- **Une nouvelle application** : réécriture complète de TrackFlow — nouveau design,
  plus rapide, installable comme une application sur mobile (PWA), thème clair et
  sombre adapté mobile en priorité.
- **Tableau de bord** : vue coach et vue athlète avec bascule rapide entre les
  deux ; widgets séances du jour, compétitions à venir et dernières performances.
- **Athlètes** : profil complet (performances, séances, compétitions, objectifs,
  vidéos, notes du coach) ; import automatique depuis athle.fr (profil + historique
  de performances) ; spécialités personnalisables avec couleur par discipline ;
  photo de profil et bannière personnalisables.
- **Calendriers** : calendrier entraînements et calendrier compétitions, glisser-
  déposer pour changer une date ; séances personnelles ajoutées par l'athlète, en
  plus du programme du coach.
- **Débriefs** : ressenti (difficulté + commentaire) après chaque séance et chaque
  compétition ; rappel automatique si le debrief n'a pas été fait.
- **Compétitions** : inscriptions avec disciplines et performances attendues ;
  ressources pratiques centralisées (site officiel, circulaire, horaires).
- **Objectifs** : suivi de progression par discipline, validation automatique dès
  qu'une performance FFA les atteint.
- **Équipes de relais** : création d'une équipe, ordre des coureurs et marques de
  passation ; historique des chronos en compétition ; n'importe quel athlète peut
  créer sa propre équipe, pas seulement le coach.
- **Votes de la communauté** : duels de suggestions proposées par les athlètes, à
  confronter deux par deux ; création d'un vote personnalisé ouverte à tous,
  modification par l'auteur ou l'admin ; détail de qui a voté pour quoi ;
  épinglage par l'admin des votes à mettre en avant.
- **Notifications** : rappel avant une séance, confirmation de synchronisation FFA,
  inscription à une compétition ; notifications sur le téléphone (push), même
  application fermée.
- **Administration** : gestion des comptes, des rôles et des feedbacks/bugs
  remontés par les utilisateurs ; personnalisation des couleurs de types de
  séances et de compétitions.
