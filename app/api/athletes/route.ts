import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCoach, isAdmin } from '@/lib/roles'
import { athleteInputSchema } from '@/lib/validations/athlete'
import { reconcileDisciplineColors } from '@/lib/disciplines'
import { syncAthleteFfa, type FfaSyncResult } from '@/lib/ffa-scraper'

// Création d'athlète : deux chemins distincts.
// 1. Coach/admin : crée un profil pour un athlète qu'il encadre (comportement
//    d'origine, jamais lié automatiquement à son propre compte).
// 2. Libre-service : un utilisateur sans rôle coach/admin et sans profil athlète
//    déjà lié à son compte crée SON PROPRE profil — il est alors automatiquement
//    lié (User.linkedAthleteId), sans passer par un admin. Non porté depuis le
//    Symfony d'origine (AthleteController::new() y est strictement ROLE_COACH,
//    aucune notion de libre-service) — fonctionnalité ajoutée à la demande
//    explicite du propriétaire du projet le 2026-08-19. Le rôle seul détermine
//    l'intention : un coach/admin ne se fait jamais auto-lier par ce chemin, donc
//    aucun flag client n'est nécessaire (et aucun risque de contournement).
export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const roles = session.user.roles ?? []
  const isStaff = isCoach(roles) || isAdmin(roles)
  const selfService = !isStaff && !user.linkedAthleteId

  if (!isStaff && !selfService) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = athleteInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const athlete = await prisma.$transaction(async (tx) => {
    const created = await tx.athlete.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender ?? null,
        licenseNumber: data.licenseNumber ?? null,
        ffaProfileUrl: data.ffaProfileUrl ?? null,
        ffaSyncSinceYear: data.ffaSyncSinceYear ?? null,
        notes: data.notes ?? null,
        disciplines: JSON.stringify(data.disciplines),
        disciplineColors: JSON.stringify(
          reconcileDisciplineColors(data.disciplines, data.disciplineColors)
        ),
        photoUrl: data.photoUrl ?? null,
        photoConfig: JSON.stringify(data.photoConfig),
        bannerUrl: data.bannerUrl ?? null,
        bannerConfig: JSON.stringify(data.bannerConfig),
      },
    })

    if (selfService) {
      await tx.user.update({
        where: { id: user.id },
        data: { linkedAthleteId: created.id },
      })
    }

    return created
  })

  // Sync FFA automatique à la création : pas de bouton manuel à cliquer si le profil
  // athle.fr est déjà connu (licence renseignée via l'import FFA sur /athletes/new).
  // La logique Symfony d'origine (AthleteController) ne fait ce sync qu'à la demande —
  // écart assumé pour ce rewrite. syncAthleteFfa ne peut résoudre qu'une ffaProfileUrl
  // (pas un simple numéro de licence saisi à la main sans URL associée), donc c'est la
  // seule condition de déclenchement possible ici.
  let ffaSync: FfaSyncResult | null = null
  if (athlete.ffaProfileUrl) {
    try {
      ffaSync = await syncAthleteFfa(athlete.id)
    } catch (error) {
      ffaSync = {
        imported: 0,
        skipped: 0,
        podiumsImported: 0,
        error: error instanceof Error ? error.message : 'Sync FFA impossible.',
      }
    }
  }

  return NextResponse.json({ id: athlete.id, ffaSync }, { status: 201 })
}
