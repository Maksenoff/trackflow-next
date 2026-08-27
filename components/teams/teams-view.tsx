'use client'

import { UsersRound } from 'lucide-react'
import { AddTile } from '@/components/ui/add-tile'
import { TeamCard, type TeamCardData } from './team-card'

export function TeamsView({ teams, canCreate }: { teams: TeamCardData[]; canCreate: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Équipes</h1>
        <p className="text-sm text-muted-foreground">
          {teams.length} équipe{teams.length > 1 ? 's' : ''}
        </p>
      </div>

      {teams.length === 0 && !canCreate ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
          <UsersRound className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune équipe pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teams.map((team, index) => (
            <TeamCard key={team.id} team={team} index={index} />
          ))}
          {canCreate && (
            <AddTile label="+ Créer son équipe" href="/teams/new" className="min-h-40" />
          )}
        </div>
      )}
    </div>
  )
}
