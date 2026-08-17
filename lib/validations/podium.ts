import { z } from 'zod'

export const podiumInputSchema = z.object({
  year: z.number().int().min(1950).max(2100),
  rank: z.number().int().min(1).max(3),
  level: z.string().min(1, 'Niveau requis'),
  discipline: z.string().min(1, 'Discipline requise'),
  performance: z.string().optional().nullable(),
  recordedAt: z.string().min(1, 'Date requise'),
  venue: z.string().optional().nullable(),
})

export type PodiumInput = z.infer<typeof podiumInputSchema>
