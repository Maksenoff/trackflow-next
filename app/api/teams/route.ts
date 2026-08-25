import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { teamCreateSchema } from '@/lib/validations/team'

export async function POST(request: Request) {
  const session = await auth()
  if (!session || (!isAdmin(session.user.roles) && !isCoach(session.user.roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = teamCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, discipline, color, photoUrl, photoConfig, members } = parsed.data

  const team = await prisma.team.create({
    data: {
      name,
      discipline,
      createdByUserId: session.user.id,
      color: color ?? null,
      photoUrl: photoUrl ?? null,
      ...(photoConfig !== undefined && { photoConfig: JSON.stringify(photoConfig) }),
      members: members?.length
        ? {
            create: members.map((m) => ({
              athleteId: m.athleteId,
              relayOrder: m.relayOrder ?? null,
              handoffMark: m.handoffMark ?? null,
            })),
          }
        : undefined,
    },
  })

  return NextResponse.json({ id: team.id }, { status: 201 })
}
