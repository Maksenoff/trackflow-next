import { z } from 'zod'

/** Création/édition des infos de la séance (titre/date/heure/durée/programme) — l'athlète uniquement. */
export const customSessionInputSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  date: z.string().min(1, 'Date requise'),
  startTime: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
})
export type CustomSessionInput = z.infer<typeof customSessionInputSchema>

/** Ressenti après-coup (difficulté/commentaire/non effectuée) — même schéma que les séances coach. */
export const customSessionRpeInputSchema = z.object({
  difficulty: z.number().int().min(0).max(10).optional().nullable(),
  comment: z.string().optional().nullable(),
  skipped: z.boolean().optional(),
})
export type CustomSessionRpeInput = z.infer<typeof customSessionRpeInputSchema>
