import { z } from 'zod'

export const feedbackCreateSchema = z.object({
  type: z.enum(['bug', 'suggestion']).default('bug'),
  description: z.string().trim().min(5, 'Description trop courte.'),
  page: z.string().trim().nullable().optional(),
})

export const feedbackStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'done']),
})

export const feedbackNoteSchema = z.object({
  adminNote: z.string().trim().nullable(),
})

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>
