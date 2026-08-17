import { z } from 'zod'

export const competitionDebriefInputSchema = z.object({
  feeling: z.number().int().min(0).max(10).optional().nullable(),
  notes: z.string().optional().nullable(),
  skipped: z.boolean().default(false),
})

export type CompetitionDebriefInput = z.infer<typeof competitionDebriefInputSchema>
