import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { lookupFfaProfile } from '@/lib/ffa-scraper'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const body = await request.json()
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) {
    return NextResponse.json({ error: 'URL invalide.' }, { status: 400 })
  }

  const result = await lookupFfaProfile(url)
  return NextResponse.json(result)
}
