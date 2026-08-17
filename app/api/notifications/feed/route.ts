import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { buildNotificationFeed } from '@/lib/notifications'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const payload = await buildNotificationFeed(session.user.id)
  const response = NextResponse.json(payload)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return response
}
