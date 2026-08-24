'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ClubConfigPanel({ initialClubCode }: { initialClubCode: string | null }) {
  const [clubCode, setClubCode] = useState(initialClubCode ?? '')
  const [saving, setSaving] = useState(false)

  const dirty = clubCode.trim() !== (initialClubCode ?? '')

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings/club', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubCode: clubCode.trim() || null }),
    })
    setSaving(false)
    if (!res.ok) {
      toast.error('Impossible d’enregistrer.')
      return
    }
    toast.success('Configuration enregistrée.')
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Hash className="size-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-bold">Numéro de club</h3>
          <p className="text-xs text-muted-foreground">
            Affiché sur les fiches relais générées pour les équipes.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="club-code">Code club</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="club-code"
            value={clubCode}
            onChange={(e) => setClubCode(e.target.value)}
            placeholder="Ex : 0620123"
            className="sm:max-w-xs"
          />
          <Button onClick={handleSave} disabled={saving || !dirty} className="shrink-0">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  )
}
