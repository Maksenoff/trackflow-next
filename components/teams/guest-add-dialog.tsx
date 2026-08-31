'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/**
 * Ajout d'un coureur externe à l'appli (pas de compte athlète) dans un relais —
 * juste nom + prénom, comme AthleteSelectDialog mais sans recherche puisqu'il
 * n'y a rien à chercher. Même pattern : aucun appel réseau ici, l'ajout est
 * local (bench) et part avec le submit global du formulaire équipe.
 */
export function GuestAddDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (firstName: string, lastName: string) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  function reset() {
    setFirstName('')
    setLastName('')
  }

  function handleAdd() {
    if (!firstName.trim() || !lastName.trim()) return
    onAdd(firstName.trim(), lastName.trim())
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter un invité</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">
          Un coureur sans compte sur l&apos;appli (autre club, prêté pour la course…).
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="guest-first-name">Prénom</Label>
            <Input
              id="guest-first-name"
              autoFocus
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="guest-last-name">Nom</Label>
            <Input
              id="guest-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={!firstName.trim() || !lastName.trim()}>
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
