import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/roles'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { notifyPasswordResetRequested } from '@/lib/notifications'

// Pas de réinitialisation en libre-service (pas d'infra email dans ce rewrite) : la
// demande est simplement transmise aux admins, qui réinitialisent manuellement le
// mot de passe via /admin/users/[id]. Toujours une réponse générique, pour ne pas
// laisser deviner si un email existe en base.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 }
    )
  }
  const { firstName, lastName, email } = parsed.data

  const users = await prisma.user.findMany({ select: { id: true, roles: true } })
  const admins = users.filter((u) => isAdmin(JSON.parse(u.roles) as string[]))

  await Promise.all(
    admins.map((admin) => notifyPasswordResetRequested(admin.id, `${firstName} ${lastName}`, email))
  )

  return NextResponse.json({ ok: true })
}
