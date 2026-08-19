'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { KeyRound, Loader2, Mail, User, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AuthField } from '@/components/auth/auth-field'

const forgotSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis'),
  lastName: z.string().trim().min(1, 'Nom requis'),
  email: z.string().trim().email('Email invalide'),
})

type ForgotValues = z.infer<typeof forgotSchema>

export function ForgotPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { firstName: '', lastName: '', email: '' },
  })

  async function onSubmit(values: ForgotValues) {
    setLoading(true)
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setLoading(false)

    if (!res.ok) {
      toast.error('Impossible d’envoyer ta demande. Réessaie plus tard.')
      return
    }
    setSent(true)
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        setSent(false)
        reset()
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-7" />
            </span>
            <DialogTitle className="text-lg">Demande envoyée</DialogTitle>
            <DialogDescription>
              Un administrateur de ton club a été prévenu et réinitialisera ton mot de passe
              manuellement. Il te recontactera directement.
            </DialogDescription>
            <Button className="mt-2 w-full" onClick={() => handleOpenChange(false)}>
              Compris
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="size-4.5 text-primary" />
                Mot de passe oublié
              </DialogTitle>
              <DialogDescription>
                Aucune réinitialisation automatique par email pour l’instant — indique tes
                informations, un admin de ton club s’en chargera manuellement.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <AuthField
                  id="forgot-firstName"
                  label="Prénom"
                  icon={User}
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <AuthField
                  id="forgot-lastName"
                  label="Nom"
                  icon={User}
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>
              <AuthField
                id="forgot-email"
                label="Email"
                icon={Mail}
                type="email"
                placeholder="vous@club.fr"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />}
                Envoyer la demande
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
