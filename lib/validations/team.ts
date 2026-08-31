import { z } from 'zod'
import { photoConfigSchema } from '@/lib/validations/athlete'

// Membre lié à un compte athlète (athleteId) OU invité externe à l'appli
// (guestFirstName + guestLastName, pas de compte) — jamais les deux. guestId
// identifie un invité déjà en base (pour le mettre à jour au lieu d'en
// recréer un doublon) ; absent pour un invité tout juste ajouté côté client.
const relayMemberSchema = z
  .object({
    athleteId: z.string().min(1).optional(),
    guestId: z.string().min(1).optional(),
    guestFirstName: z.string().trim().min(1).max(60).optional(),
    guestLastName: z.string().trim().min(1).max(60).optional(),
    relayOrder: z.number().int().min(1).max(4).nullable().optional(),
    handoffMark: z.string().trim().max(60).nullable().optional(),
  })
  .refine((m) => !!m.athleteId || (!!m.guestFirstName && !!m.guestLastName), {
    message: 'Athlète ou nom/prénom invité requis',
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
  discipline: z.string().trim().min(1, 'Discipline requise'),
  color: z.string().trim().nullable().optional(),
  photoUrl: z.string().trim().nullable().optional(),
  photoConfig: photoConfigSchema.optional(),
  members: relayMembersSchema.optional(),
})

export const teamUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').optional(),
  discipline: z.string().trim().min(1, 'Discipline requise').optional(),
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
