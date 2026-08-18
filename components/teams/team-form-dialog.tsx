'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TeamFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error("Impossible de créer l'équipe.")
      return
    }
    const { id } = await res.json()
    toast.success('Équipe créée.')
    onOpenChange(false)
    router.push(`/teams/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouvelle équipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5 py-1">
          <Label htmlFor="team-name">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="team-name"
            autoFocus
            placeholder="Ex : 4x100m Hommes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Annuler</Button>} />
          <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
