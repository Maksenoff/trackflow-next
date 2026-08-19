'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AuthField } from '@/components/auth/auth-field'
import { ForgotPasswordDialog } from '@/components/auth/forgot-password-dialog'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  remember: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  async function onSubmit(values: LoginValues) {
    setLoading(true)
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    setLoading(false)

    if (res?.error) {
      toast.error('Email ou mot de passe incorrect.')
      return
    }

    router.push(searchParams.get('callbackUrl') || '/dashboard')
    router.refresh()
  }

  return (
    <>
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
          <h1 className="text-2xl font-extrabold tracking-tight">Connexion</h1>
          <p className="text-sm text-muted-foreground">Accède à ton espace TrackFlow.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-4">
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
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={watch('remember')}
                onCheckedChange={(checked) => setValue('remember', checked === true)}
                className="data-checked:border-violet-800 data-checked:bg-violet-800 dark:data-checked:bg-violet-800"
              />
              <Label
                htmlFor="remember"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Se souvenir de moi
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm font-medium text-violet-800 hover:underline dark:text-violet-400"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-xl border-0 bg-gradient-to-r from-violet-900 to-fuchsia-900 text-base font-semibold text-white shadow-lg shadow-violet-950/40 hover:from-violet-800 hover:to-fuchsia-800"
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Se connecter
          </Button>
        </form>

        <p className="relative mt-7 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link
            href="/register"
            className="font-semibold text-violet-800 hover:underline dark:text-violet-400"
          >
            Créer un compte
          </Link>
        </p>
      </motion.div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </>
  )
}
