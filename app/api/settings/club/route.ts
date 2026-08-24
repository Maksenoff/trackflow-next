import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { setClubCode } from '@/lib/club-settings'
import { clubSettingsSchema } from '@/lib/validations/team'

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session || !isAdmin(session.user.roles)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = clubSettingsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await setClubCode(parsed.data.clubCode?.trim() || null)
  return NextResponse.json({ ok: true })
}
