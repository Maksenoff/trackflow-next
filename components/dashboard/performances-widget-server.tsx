import { TrendingUp } from 'lucide-react'
import { getPerformancesWidgetData } from '@/lib/dashboard'
import { PerformanceList } from '@/components/dashboard/performance-list'
import { PerformancePanel } from '@/components/dashboard/performance-panel'
import type { Role } from '@/lib/roles'

export async function PerformancesWidgetServer({
  userId,
  roles,
  canCreateAthlete,
}: {
  userId: string
  roles: Role[]
  canCreateAthlete: boolean
}) {
  const data = await getPerformancesWidgetData(userId, roles)

  if (data.view === 'coach') {
    return (
      <PerformancePanel
        allPerformances={data.allPerformances}
        myPerformances={data.myPerformances}
        hasLinkedAthlete={data.hasLinkedAthlete}
        canCreateAthlete={canCreateAthlete}
      />
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          <TrendingUp className="size-3.5 text-primary" />
          Performances récentes
        </h2>
      </div>
      <PerformanceList
        performances={data.recentPerformances}
        emptyMessage="Aucune performance enregistrée."
      />
    </div>
  )
}
