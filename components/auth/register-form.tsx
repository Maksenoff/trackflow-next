'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Loader2, Lock, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AuthField } from '@/components/auth/auth-field'

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
  })

  async function onSubmit(values: RegisterValues) {
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? 'Impossible de créer le compte.')
      setLoading(false)
      return
    }

    const signInRes = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    setLoading(false)

    if (signInRes?.error) {
      toast.success('Compte créé. Vous pouvez maintenant vous connecter.')
      router.push('/login')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-xl shadow-black/[0.06] backdrop-blur-sm sm:p-8 dark:shadow-[0_0_80px_-24px_rgba(124,58,237,0.4)]"
    >
      {/* Bandeau "ligne d'arrivée" — écho du panneau de marque (violet, pas le bleu de --primary) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-800 via-fuchsia-800 to-violet-900"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-violet-600/10 blur-3xl dark:bg-violet-600/15"
      />

      <div className="relative mb-7 space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">Rejoins ton club sur TrackFlow.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            id="firstName"
            label="Prénom"
            icon={User}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <AuthField
            id="lastName"
            label="Nom"
            icon={User}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <AuthField
          id="email"
          label="Email"
          icon={Mail}
          type="email"
          placeholder="vous@club.fr"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          id="password"
          label="Mot de passe"
          icon={Lock}
          type="password"
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <AuthField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-violet-900 to-fuchsia-900 text-base font-semibold text-white shadow-lg shadow-violet-950/40 hover:from-violet-800 hover:to-fuchsia-800"
          disabled={loading}
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Créer mon compte
        </Button>
      </form>

      <p className="relative mt-7 text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link
          href="/login"
          className="font-semibold text-violet-800 hover:underline dark:text-violet-400"
        >
          Se connecter
        </Link>
      </p>
    </motion.div>
  )
}
