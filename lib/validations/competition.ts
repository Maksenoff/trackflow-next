import { z } from 'zod'

export const competitionInputSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  date: z.string().min(1, 'Date requise'),
  location: z.string().optional().nullable(),
  competitionTypeId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  schedulesUrl: z.string().optional().nullable(),
  availableDisciplines: z.array(z.string()).optional(),
  requestExpectedPerf: z.boolean().optional(),
})

export type CompetitionInput = z.infer<typeof competitionInputSchema>

export const competitionRegistrationInputSchema = z.object({
  athleteId: z.string().min(1),
  disciplines: z.array(z.string()).min(1, 'Au moins une discipline requise'),
  ffaRegistered: z.boolean().optional(),
  expectedPerformances: z.record(z.string(), z.string()).optional().nullable(),
})

export type CompetitionRegistrationInput = z.infer<typeof competitionRegistrationInputSchema>
