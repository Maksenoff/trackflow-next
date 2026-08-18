import { z } from 'zod'

export const pollCreateSchema = z
  .object({
    startsAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
    options: z
      .array(
        z.object({
          feedbackId: z.string().min(1),
          label: z.string().trim().min(3, 'Reformulation trop courte.'),
        })
      )
      .length(2, 'Sélectionne exactement deux suggestions à confronter.'),
  })
  .refine((data) => data.expiresAt.getTime() > data.startsAt.getTime(), {
    message: 'La date de fin doit être après la date de début.',
    path: ['expiresAt'],
  })
  .refine((data) => data.options[0].feedbackId !== data.options[1].feedbackId, {
    message: 'Les deux suggestions doivent être différentes.',
    path: ['options'],
  })

export const pollVoteSchema = z.object({
  optionId: z.string().min(1),
})
