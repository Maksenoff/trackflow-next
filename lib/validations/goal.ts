import { z } from 'zod'

export const goalInputSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  discipline: z.string().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  status: z.enum(['in_progress', 'achieved', 'abandoned']).default('in_progress'),
  autoValidateFfa: z.boolean().default(false),
  notes: z.string().optional().nullable(),
})

export type GoalInput = z.infer<typeof goalInputSchema>
