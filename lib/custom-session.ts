/**
 * Couleur unique des séances personnelles athlète — volontairement hors de la
 * palette des 16 couleurs proposées pour les types de séance/compétition
 * (components/admin/type-manager.tsx), pour qu'une séance perso ne puisse
 * jamais se confondre avec un vrai type choisi par un coach. Rendue en plus
 * avec un style de pastille différent (pointillé) dans le calendrier, la
 * couleur seule ne suffisant pas à garantir l'unicité visuelle.
 */
export const CUSTOM_SESSION_COLOR = '#d946ef'
