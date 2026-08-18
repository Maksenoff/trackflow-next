import { z } from 'zod'

export const bannerConfigSchema = z.object({
  mode: z.enum(['pattern', 'photo']).default('pattern'),
  pattern: z.string().optional(),
  color: z.string().optional(),
  zoom: z.number().min(1).max(2.5).optional(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
})

export const photoConfigSchema = z.object({
  zoom: z.number().min(1).max(2.5).optional(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
})

export const athleteInputSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['M', 'F', 'X']).optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  ffaProfileUrl: z.string().optional().nullable(),
  ffaSyncSinceYear: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
  disciplines: z.array(z.string()).default([]),
  disciplineColors: z.record(z.string(), z.string()).default({}),
  photoUrl: z.string().optional().nullable(),
  photoConfig: photoConfigSchema.default({}),
  bannerUrl: z.string().optional().nullable(),
  bannerConfig: bannerConfigSchema.default({ mode: 'pattern' }),
  videosEnabled: z.boolean().default(false),
})

export type AthleteInput = z.infer<typeof athleteInputSchema>
