'use client'

import { useState } from 'react'
import { ArrowLeft, Link2, UserPlus, Loader2, BadgeCheck, ArrowRight, Search } from 'lucide-react'
import { AthleteForm, type AthleteFormValues } from '@/components/athletes/athlete-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Step = 'choose' | 'lookup' | 'form'

type LookupResult = {
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  gender: string | null
  discipline: string[]
  licenseNumber: string | null
  error: string | null
}

export function NewAthleteFlow() {
  const [step, setStep] = useState<Step>('choose')
  const [urlInput, setUrlInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)
  const [initialData, setInitialData] = useState<Partial<AthleteFormValues>>({})

  async function lookup() {
    const url = urlInput.trim()
    if (!url) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/ffa/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data: LookupResult = await res.json()
    setLoading(false)

    if (!res.ok || (data.error && !data.firstName && !data.lastName)) {
      setError(data.error ?? 'Impossible de récupérer ce profil.')
      return
    }

    setPrefilled(!!data.firstName)
    setInitialData({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      birthDate: data.birthDate ?? '',
      gender: (data.gender as 'M' | 'F') ?? undefined,
      licenseNumber: data.licenseNumber ?? '',
      ffaProfileUrl: url,
      disciplines: data.discipline,
    })
    setStep('form')
  }

  if (step === 'choose') {
    return (
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setStep('lookup')}
          className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
          />
          <div className="relative mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-lg shadow-primary/25">
            <Link2 className="size-6" />
          </div>
          <div className="relative mb-2 text-lg font-extrabold tracking-tight">
            Avec profil athle.fr
          </div>
          <p className="relative text-sm leading-relaxed text-muted-foreground">
            Colle l&apos;URL du profil athle.fr pour préremplir et synchroniser les résultats.
          </p>
          <div className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
            Continuer
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setInitialData({})
            setPrefilled(false)
            setStep('form')
          }}
          className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-muted blur-2xl transition-opacity duration-300 group-hover:opacity-80"
          />
          <div className="relative mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground shadow-lg shadow-black/5">
            <UserPlus className="size-6" />
          </div>
          <div className="relative mb-2 text-lg font-extrabold tracking-tight">Manuellement</div>
          <p className="relative text-sm leading-relaxed text-muted-foreground">
            Renseigne les informations toi-même, sans passer par athle.fr.
          </p>
          <div className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
            Continuer
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    )
  }

  if (step === 'lookup') {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-6 py-5">
            <button
              type="button"
              onClick={() => setStep('choose')}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Link2 className="size-4.5" />
            </div>
            <span className="text-base font-extrabold tracking-tight">Recherche via athle.fr</span>
          </div>

          <div className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Va sur <strong className="text-foreground">athle.fr</strong>, cherche l&apos;athlète,
              puis colle l&apos;URL de sa page de profil ci-dessous.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookup()}
                  placeholder="https://www.athle.fr/athletes/XXXXX/resultats"
                  className="h-11 pl-10"
                />
              </div>
              <Button
                type="button"
                onClick={lookup}
                disabled={loading || !urlInput.trim()}
                className={cn('h-11 shrink-0 px-5', (loading || !urlInput.trim()) && 'opacity-60')}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? 'Chargement...' : 'Importer'}
              </Button>
            </div>

            {error && (
              <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setStep('choose')}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-base font-extrabold tracking-tight">
          Informations de l&apos;athlète
        </span>
        {prefilled && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <BadgeCheck className="size-3.5" />
            Prérempli via athle.fr
          </span>
        )}
      </div>
      <AthleteForm mode="create" initialData={initialData} />
    </div>
  )
}
