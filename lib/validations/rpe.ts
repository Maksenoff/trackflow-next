import { z } from 'zod'

export const rpeInputSchema = z.object({
  athleteId: z.string().min(1),
  difficulty: z.number().int().min(0).max(10).optional().nullable(),
  comment: z.string().optional().nullable(),
  skipped: z.boolean().default(false),
})

export type RpeInput = z.infer<typeof rpeInputSchema>
