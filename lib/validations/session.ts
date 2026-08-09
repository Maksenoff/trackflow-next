import { z } from 'zod'

export const sessionInputSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  date: z.string().min(1, 'Date requise'),
  startTime: z.string().optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  trainingTypeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export type SessionInput = z.infer<typeof sessionInputSchema>
