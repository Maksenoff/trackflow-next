'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  SessionFormDialog,
  type SessionFormInitial,
  type TrainingTypeOption,
} from '@/components/calendar/session-form-dialog'

export function SessionActions({
  sessionId,
  initialData,
  trainingTypes,
}: {
  sessionId: string
  initialData: SessionFormInitial
  trainingTypes: TrainingTypeOption[]
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      toast.error('Suppression impossible.')
      return
    }
    toast.success('Séance supprimée.')
    router.push('/calendar')
    router.refresh()
  }

  return (
    <div className="flex shrink-0 gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="size-3.5" />
        Modifier
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="destructive" size="sm">
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette séance ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera aussi les ressentis enregistrés par les
              athlètes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SessionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        date={initialData.date}
        trainingTypes={trainingTypes}
        sessionId={sessionId}
        initialData={initialData}
      />
    </div>
  )
}
