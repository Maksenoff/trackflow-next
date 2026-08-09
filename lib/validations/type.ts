import { z } from 'zod'

export const typeInputSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  color: z.string().min(1, 'Couleur requise'),
})

export type TypeInput = z.infer<typeof typeInputSchema>
