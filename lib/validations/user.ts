import { z } from 'zod'
import { ALL_ROLES } from '@/lib/roles'

export const userUpdateSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  roles: z.array(z.enum(ALL_ROLES as [string, ...string[]])).min(1, 'Au moins un rôle est requis'),
  linkedAthleteId: z.string().nullable(),
})

export type UserUpdateInput = z.infer<typeof userUpdateSchema>
