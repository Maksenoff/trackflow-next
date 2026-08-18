'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, UsersRound, X } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fullName } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { AthleteAvatar } from './athlete-avatar'
import { AthletePickerDialog, type PickableAthlete } from './athlete-picker-dialog'
import type { TeamDetail } from '@/lib/teams-data'

export function TeamDetailView({
  team,
  allAthletes,
  canManage,
}: {
  team: TeamDetail
  allAthletes: PickableAthlete[]
  canManage: boolean
}) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(team.name)
  const [savingName, setSavingName] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function saveName() {
    if (!name.trim() || name.trim() === team.name) {
      setName(team.name)
      setEditingName(false)
      return
    }
    setSavingName(true)
    const res = await fetch(`/api/teams/${team.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setSavingName(false)
    setEditingName(false)
    if (!res.ok) {
      toast.error('Impossible de renommer.')
      setName(team.name)
      return
    }
    router.refresh()
  }

  async function removeMember(athleteId: string) {
    setRemovingId(athleteId)
    const res = await fetch(`/api/teams/${team.id}/members/${athleteId}`, { method: 'DELETE' })
    setRemovingId(null)
    if (!res.ok) {
      toast.error('Impossible de retirer cet athlète.')
      return
    }
    router.refresh()
  }

  async function deleteTeam() {
    if (!window.confirm(`Supprimer l'équipe "${team.name}" ?`)) return
    const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error("Impossible de supprimer l'équipe.")
      return
    }
    toast.success('Équipe supprimée.')
    router.push('/teams')
  }

  return (
    <div className="space-y-6">
      <BackButton label="Équipes" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm shadow-primary/30">
            <UsersRound className="size-5" />
          </div>
          {editingName ? (
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              disabled={savingName}
              className="h-9 w-64 text-xl font-bold"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Renommer"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" />
              Ajouter un athlète
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={deleteTeam}
              aria-label="Supprimer l'équipe"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {team.members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <UsersRound className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun athlète dans cette équipe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              <Link href={`/athletes/${m.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <AthleteAvatar athlete={m} className="size-10" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {fullName(m.firstName, m.lastName)}
                  </div>
                  {m.disciplines.length > 0 && (
                    <div className="truncate text-xs text-muted-foreground">
                      {m.disciplines
                        .slice(0, 2)
                        .map((d) => DISCIPLINE_LABELS[d] ?? d)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </Link>
              {canManage && (
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  disabled={removingId === m.id}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Retirer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <AthletePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          teamId={team.id}
          allAthletes={allAthletes}
          currentMemberIds={team.members.map((m) => m.id)}
        />
      )}
    </div>
  )
}
