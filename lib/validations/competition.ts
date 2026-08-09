import { z } from 'zod'

export const competitionInputSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  date: z.string().min(1, 'Date requise'),
  location: z.string().optional().nullable(),
  competitionTypeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export type CompetitionInput = z.infer<typeof competitionInputSchema>
