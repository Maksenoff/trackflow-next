'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Pencil, UsersRound, Hash, Route, History } from 'lucide-react'
import { fullName } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { AthleteAvatar } from './athlete-avatar'
import { DeleteTeamButton } from './delete-team-button'
import { RelayBuilder, type RelaySlot } from './relay-builder'
import { TeamTabs } from './team-tabs'
import { TeamHistoryTab } from './team-history-tab'
import type { TeamDetail } from '@/lib/teams-data'

/**
 * Fiche en lecture seule (/teams/[id]) — aucune mutation possible ici. Toute
 * modification (relais, marques, historique, photo, couleur, membres) se fait
 * sur une page dédiée (/teams/[id]/edit), ouverte via le bouton "Modifier"
 * ci-dessous — jamais en place sur cette page.
 */
export function TeamDetailView({
  team,
  canManage,
  isTeamMember,
  canDelete,
  clubCode,
}: {
  team: TeamDetail
  canManage: boolean
  isTeamMember: boolean
  /** Staff, ou l'auteur de la création de l'équipe (lui seul). */
  canDelete: boolean
  clubCode: string | null
}) {
  const canEditData = canManage || isTeamMember
  const [activeTab, setActiveTab] = useState('relay')

  const slots = useMemo<RelaySlot[]>(
    () =>
      team.members
        .filter((m) => m.relayOrder != null)
        .sort((a, b) => (a.relayOrder ?? 0) - (b.relayOrder ?? 0))
        .map((m) => ({ athlete: m, handoffMark: m.handoffMark })),
    [team.members]
  )
  const bench = team.members.filter((m) => m.relayOrder == null)
  const accent = team.color ?? 'var(--primary)'

  const relayContent = (
    <div className="space-y-6">
      <div className="space-y-3">
        {slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-12 text-center">
            <UsersRound className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucun athlète positionné.</p>
          </div>
        ) : (
          <RelayBuilder slots={slots} onChange={() => {}} readOnly showLicense />
        )}
      </div>

      {bench.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Remplaçants
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bench.map((m) => (
              <Link
                key={m.id}
                href={`/athletes/${m.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition-colors hover:bg-primary/[0.03]"
              >
                <AthleteAvatar athlete={m} className="size-10" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {fullName(m.firstName, m.lastName)}
                  </div>
                  {m.licenseNumber && (
                    <div className="truncate text-xs text-muted-foreground">
                      Licence <span className="font-mono font-bold">{m.licenseNumber}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-4">
          {team.photoUrl ? (
            <div className="size-36 shrink-0 overflow-hidden rounded-2xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.photoUrl}
                alt=""
                className="size-full object-cover"
                style={{
                  objectPosition: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
                  transform: `scale(${team.photoConfig.zoom ?? 1})`,
                  transformOrigin: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
                }}
              />
            </div>
          ) : (
            <div
              className="flex size-36 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, black))`,
              }}
            >
              <UsersRound className="size-12" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
            {team.discipline && (
              <span
                className="mt-1.5 mr-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
                  borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
                  color: accent,
                }}
              >
                {DISCIPLINE_LABELS[team.discipline] ?? team.discipline}
              </span>
            )}
            {clubCode && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1">
                <Hash className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">Club</span>
                <span className="font-mono text-sm font-extrabold text-primary">{clubCode}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canEditData && (
            <Link
              href={`/teams/${team.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
            >
              <Pencil className="size-3.5" />
              Modifier
            </Link>
          )}
          {canDelete && <DeleteTeamButton teamId={team.id} />}
        </div>
      </div>

      <TeamTabs
        active={activeTab}
        onActiveChange={setActiveTab}
        tabs={[
          { key: 'relay', label: 'Relais', icon: Route, content: relayContent },
          {
            key: 'history',
            label: 'Historique',
            icon: History,
            count: team.performances.length,
            content: (
              <TeamHistoryTab
                teamId={team.id}
                performances={team.performances}
                canManage={canEditData}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
