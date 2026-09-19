import { z } from 'zod'

export const appearanceUpdateSchema = z.object({
  newUiEnabled: z.boolean().optional(),
  // null = revient à la couleur par défaut (#8A6BFF, violet de marque).
  // "auto" = swatch Blanc/Noir, résolu selon le thème par new-ui-root.tsx.
  accentColor: z
    .string()
    .refine((v) => v === 'auto' || /^#[0-9a-fA-F]{6}$/.test(v), 'Couleur invalide')
    .nullable()
    .optional(),
})
