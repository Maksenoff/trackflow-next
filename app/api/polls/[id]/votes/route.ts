import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Détail des votes (qui a voté pour quoi) — accessible à tout utilisateur
// connecté, comme le reste de la page /votes (déjà consultable par tous),
// affiché dans le popup ouvert au clic sur le total de votes (demande
// explicite de Maksen le 2026-08-29).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const poll = await prisma.poll.findUnique({
    where: { id: params.id },
    include: {
      options: {
        include: {
          votes: {
            include: { user: { select: { firstName: true, lastName: true } } },
            orderBy: { votedAt: 'asc' },
          },
        },
      },
    },
  })
  if (!poll) {
    return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  }

  return NextResponse.json({
    options: poll.options.map((o) => ({
      id: o.id,
      label: o.label,
      voters: o.votes.map((v) => `${v.user.firstName} ${v.user.lastName}`),
    })),
  })
}
