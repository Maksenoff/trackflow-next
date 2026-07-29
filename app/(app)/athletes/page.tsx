import { Users } from 'lucide-react'
import { ComingSoon } from '@/components/coming-soon'

export default function AthletesPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Athlètes"
      description="La liste des athlètes arrive à la session 3 (profils, spécialités, performances)."
    />
  )
}
