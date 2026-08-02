import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin, isCoach, type Role } from '@/lib/roles'
import { getAthleteDetail } from '@/lib/athletes-data'
import { PageTransition } from '@/components/motion/page-transition'
import { AthleteForm } from '@/components/athletes/athlete-form'
import { DeleteAthleteButton } from '@/components/athletes/delete-athlete-button'

export default async function EditAthletePage({ params }: { params: { id: string } }) {
  const athlete = await getAthleteDetail(params.id)
  if (!athlete) notFound()

  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const isManager = isAdmin(roles) || isCoach(roles)

  let canEdit = isManager
  if (!canEdit && session) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    canEdit = user?.linkedAthleteId === athlete.id
  }
  if (!canEdit) redirect(`/athletes/${athlete.id}`)

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8 xl:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Modifier {athlete.firstName} {athlete.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Mets à jour le profil de l&apos;athlète.
            </p>
          </div>
          {isAdmin(roles) && <DeleteAthleteButton athleteId={athlete.id} />}
        </div>

        <AthleteForm
          mode="edit"
          athleteId={athlete.id}
          initialData={{
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            birthDate: athlete.birthDate ? athlete.birthDate.toISOString().slice(0, 10) : '',
            gender: (athlete.gender as 'M' | 'F' | 'X' | null) ?? undefined,
            licenseNumber: athlete.licenseNumber ?? '',
            ffaProfileUrl: athlete.ffaProfileUrl ?? '',
            notes: athlete.notes ?? '',
            disciplines: athlete.disciplines,
            disciplineColors: athlete.disciplineColors,
            photoUrl: athlete.photoUrl,
            bannerUrl: athlete.bannerUrl,
            bannerConfig: {
              mode: athlete.bannerConfig.mode ?? 'pattern',
              pattern: athlete.bannerConfig.pattern,
              color: athlete.bannerConfig.color ?? '#6366f1',
              zoom: athlete.bannerConfig.zoom ?? 1,
            },
          }}
        />
      </div>
    </PageTransition>
  )
}
