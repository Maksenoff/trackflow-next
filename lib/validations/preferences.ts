import { z } from 'zod'

export const preferencesUpdateSchema = z.object({
  // Vue calendrier mémorisée par profil (voir app/(app)/calendar/page.tsx) —
  // ouvert à tout utilisateur connecté, contrairement à appearanceUpdateSchema
  // (réservé admin car lié à la nouvelle interface bêta) : ce n'est qu'une
  // préférence d'affichage, pas un réglage lié au beta toggle.
  calendarView: z.enum(['month', 'week']).optional(),
})
