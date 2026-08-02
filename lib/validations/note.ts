import { z } from 'zod'

export const noteInputSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().min(1, 'Le contenu ne peut pas être vide'),
  pinned: z.boolean().default(false),
  color: z.string().default(''),
})

export type NoteInput = z.infer<typeof noteInputSchema>
