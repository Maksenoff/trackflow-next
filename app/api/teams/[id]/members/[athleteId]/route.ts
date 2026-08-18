import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; athleteId: string } }
) {
  const session = await auth()
  if (!session || (!isAdmin(session.user.roles) && !isCoach(session.user.roles))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.teamMember.delete({
    where: { teamId_athleteId: { teamId: params.id, athleteId: params.athleteId } },
  })

  return NextResponse.json({ ok: true })
}
