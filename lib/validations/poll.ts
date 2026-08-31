import { z } from 'zod'

export const pollCreateSchema = z
  .object({
    startsAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
    // feedbackId présent sur les deux options -> duel "suggestions" (admin
    // uniquement, depuis /admin/feedbacks). Absent sur les deux -> duel libre
    // créé par n'importe quel utilisateur, options en texte libre. Un mélange
    // des deux est rejeté dans la route (POST /api/polls).
    options: z
      .array(
        z.object({
          feedbackId: z.string().min(1).optional(),
          label: z.string().trim().min(3, 'Reformulation trop courte.'),
        })
      )
      .length(2, 'Il faut exactement deux options à confronter.'),
  })
  .refine((data) => data.expiresAt.getTime() > data.startsAt.getTime(), {
    message: 'La date de fin doit être après la date de début.',
    path: ['expiresAt'],
  })
  .refine(
    (data) =>
      data.options[0].feedbackId || data.options[1].feedbackId
        ? data.options[0].feedbackId !== data.options[1].feedbackId
        : true,
    { message: 'Les deux suggestions doivent être différentes.', path: ['options'] }
  )

export const pollVoteSchema = z.object({
  optionId: z.string().min(1),
})

export const pollUpdateSchema = z
  .object({
    startsAt: z.coerce.date().optional(),
    expiresAt: z.coerce.date().optional(),
    options: z
      .array(z.object({ id: z.string().min(1), label: z.string().trim().min(3) }))
      .length(2)
      .optional(),
  })
  .refine(
    (data) =>
      !data.startsAt || !data.expiresAt || data.expiresAt.getTime() > data.startsAt.getTime(),
    { message: 'La date de fin doit être après la date de début.', path: ['expiresAt'] }
  )
