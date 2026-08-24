import { getSessionsWidgetData } from '@/lib/dashboard'
import { SessionWidget } from '@/components/dashboard/session-widget'

export async function SessionsWidgetServer() {
  const { nextSession, upcomingSessions } = await getSessionsWidgetData()
  return <SessionWidget nextSession={nextSession} upcomingSessions={upcomingSessions} />
}
