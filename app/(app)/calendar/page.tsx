import { CalendarDays } from 'lucide-react'
import { ComingSoon } from '@/components/coming-soon'

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={CalendarDays}
      title="Calendrier"
      description="Le calendrier des entraînements et compétitions arrive à la session 4."
    />
  )
}
