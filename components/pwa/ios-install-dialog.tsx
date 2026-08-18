'use client'

import { Share, SquarePlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function IosInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Installer TrackFlow</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 text-sm">
          <p className="text-muted-foreground">
            Sur iPhone/iPad, l&apos;installation se fait depuis Safari en 2 étapes :
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Share className="size-4" />
            </span>
            <span>
              Touche <strong className="text-foreground">Partager</strong> dans la barre
              d&apos;outils Safari
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SquarePlus className="size-4" />
            </span>
            <span>
              Choisis <strong className="text-foreground">Sur l&apos;écran d&apos;accueil</strong>
            </span>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Fermer</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
