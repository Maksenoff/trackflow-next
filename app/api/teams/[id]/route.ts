import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach } from '@/lib/roles'
import { isTeamMember } from '@/lib/team-permissions'
import { teamUpdateSchema } from '@/lib/validations/team'

// Un seul PATCH bundle tout ce que le formulaire d'équipe modifie (identité,
// photo, couleur, ordre du relais + marques, remplaçants) — la page d'édition
// n'a qu'un unique bouton "Enregistrer", pas d'auto-save au fil de l'eau.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const staff = !!session && (isAdmin(session.user.roles) || isCoach(session.user.roles))
  const member = !staff && !!session && (await isTeamMember(session.user.id, params.id))
  if (!staff && !member) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = teamUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { name, discipline, color, photoUrl, photoConfig, members } = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.team.update({
      where: { id: params.id },
      data: {
        // Renommer reste réservé à coach/admin — un membre peut modifier les
        // données du relais (couleur, photo) mais pas l'identité de l'équipe.
        ...(staff && name !== undefined && { name }),
        ...(staff && discipline !== undefined && { discipline }),
        ...(color !== undefined && { color }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(photoConfig !== undefined && { photoConfig: JSON.stringify(photoConfig) }),
      },
    })

    if (members) {
      const existing = await tx.teamMember.findMany({ where: { teamId: params.id } })
      const existingAthleteIds = new Set(
        existing.map((m) => m.athleteId).filter((id): id is string => !!id)
      )
      // Un "invité" (pas de compte athlète) est retrouvé par l'id de sa ligne
      // TeamMember plutôt que par athleteId, qui n'existe pas pour lui.
      const existingGuestIds = new Set(existing.filter((m) => !m.athleteId).map((m) => m.id))
      // Un simple membre (pas staff) ne peut pas ajouter/retirer d'athlètes ou
      // d'invités de l'équipe — seulement réordonner/repositionner ceux déjà
      // présents.
      const incoming = staff
        ? members
        : members.filter((m) =>
            m.athleteId
              ? existingAthleteIds.has(m.athleteId)
              : !!m.guestId && existingGuestIds.has(m.guestId)
          )

      const keptIds = new Set<string>()

      for (const m of incoming) {
        if (m.athleteId) {
          const row = await tx.teamMember.upsert({
            where: { teamId_athleteId: { teamId: params.id, athleteId: m.athleteId } },
            update: { relayOrder: m.relayOrder ?? null, handoffMark: m.handoffMark ?? null },
            create: {
              teamId: params.id,
              athleteId: m.athleteId,
              relayOrder: m.relayOrder ?? null,
              handoffMark: m.handoffMark ?? null,
            },
          })
          keptIds.add(row.id)
        } else if (m.guestId && existingGuestIds.has(m.guestId)) {
          const row = await tx.teamMember.update({
            where: { id: m.guestId },
            data: {
              guestFirstName: m.guestFirstName ?? null,
              guestLastName: m.guestLastName ?? null,
              relayOrder: m.relayOrder ?? null,
              handoffMark: m.handoffMark ?? null,
            },
          })
          keptIds.add(row.id)
        } else if (m.guestFirstName && m.guestLastName) {
          const row = await tx.teamMember.create({
            data: {
              teamId: params.id,
              guestFirstName: m.guestFirstName,
              guestLastName: m.guestLastName,
              relayOrder: m.relayOrder ?? null,
              handoffMark: m.handoffMark ?? null,
            },
          })
          keptIds.add(row.id)
        }
      }

      if (staff) {
        const toRemove = existing.filter((m) => !keptIds.has(m.id))
        if (toRemove.length > 0) {
          await tx.teamMember.deleteMany({ where: { id: { in: toRemove.map((m) => m.id) } } })
        }
      }
    }
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const staff = isAdmin(session.user.roles) || isCoach(session.user.roles)
  if (!staff) {
    // Un utilisateur non-staff ne peut supprimer que l'équipe qu'il a lui-même
    // créée — pas les autres, même s'il en est membre.
    const team = await prisma.team.findUnique({
      where: { id: params.id },
      select: { createdByUserId: true },
    })
    if (!team || team.createdByUserId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
  }

  await prisma.team.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
