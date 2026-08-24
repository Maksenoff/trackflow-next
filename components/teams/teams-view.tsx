'use client'

import Link from 'next/link'
import { Plus, UsersRound } from 'lucide-react'
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
        {canManage && (
          <Link
            href="/teams/new"
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/35"
          >
            <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
            Nouvelle équipe
          </Link>
        )}
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
