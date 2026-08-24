import { z } from 'zod'
import { photoConfigSchema } from '@/lib/validations/athlete'

const relayMemberSchema = z.object({
  athleteId: z.string().min(1),
  relayOrder: z.number().int().min(1).max(4).nullable().optional(),
  handoffMark: z.string().trim().max(60).nullable().optional(),
})

// Le plafond de 4 s'applique aux positions du relais (relayOrder non nul), pas
// au nombre total de membres — une équipe peut avoir des remplaçants au-delà.
const relayMembersSchema = z
  .array(relayMemberSchema)
  .refine((members) => members.filter((m) => m.relayOrder != null).length <= 4, {
    message: 'Maximum 4 athlètes positionnés dans le relais',
  })

export const teamCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis'),
  color: z.string().trim().nullable().optional(),
  photoUrl: z.string().trim().nullable().optional(),
  photoConfig: photoConfigSchema.optional(),
  members: relayMembersSchema.optional(),
})

export const teamUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').optional(),
  color: z.string().trim().nullable().optional(),
  photoUrl: z.string().trim().nullable().optional(),
  photoConfig: photoConfigSchema.optional(),
  members: relayMembersSchema.optional(),
})

export const teamPerformanceCreateSchema = z.object({
  time: z.string().trim().min(1, 'Temps requis').max(20),
  location: z.string().trim().max(120).nullable().optional(),
  date: z.coerce.date(),
  place: z.number().int().min(1).max(999).nullable().optional(),
})

export const teamPerformanceUpdateSchema = teamPerformanceCreateSchema

export const clubSettingsSchema = z.object({
  clubCode: z.string().trim().max(40).nullable().optional(),
})
