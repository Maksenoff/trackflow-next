'use client'

import { UsersRound } from 'lucide-react'
import { AddButton } from '@/components/ui/add-button'
import { TeamCard, type TeamCardData } from './team-card'

export function TeamsView({ teams, canManage }: { teams: TeamCardData[]; canManage: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Équipes</h1>
          <p className="text-sm text-muted-foreground">
            {teams.length} équipe{teams.length > 1 ? 's' : ''}
          </p>
        </div>
        {canManage && <AddButton label="Créer son équipe" href="/teams/new" />}
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
          <UsersRound className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune équipe pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((team, index) => (
            <TeamCard key={team.id} team={team} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
