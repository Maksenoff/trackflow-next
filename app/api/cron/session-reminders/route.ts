import { NextResponse } from 'next/server'
import { runSessionReminders } from '@/lib/notifications'

// Appelé toutes les ~15 min par .github/workflows/session-reminders.yml (même
// principe que /api/keep-alive, mais celui-ci envoie de vraies notifications
// push à tout le club — protégé par un secret partagé pour ne pas être
// déclenchable publiquement, contrairement au keep-alive qui est un simple
// SELECT 1 sans conséquence.
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const result = await runSessionReminders()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
