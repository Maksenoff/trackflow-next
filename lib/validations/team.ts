import { z } from 'zod'

export const teamCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis'),
})

export const teamUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis'),
})

export const teamMemberAddSchema = z.object({
  athleteId: z.string().min(1),
})
