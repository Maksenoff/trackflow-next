'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, UserPlus, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { AthleteCard, type AthleteCardData } from '@/components/athletes/athlete-card'

const SEARCH_DEBOUNCE_MS = 300
const SKELETON_COUNT = 8

export function AthletesGrid({
  athletes,
  canManage,
  query,
}: {
  athletes: AthleteCardData[]
  canManage: boolean
  query: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(query)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setValue(query), [query])
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    },
    []
  )

  function handleChange(next: string) {
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('q', next)
      else params.delete('q')
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    }, SEARCH_DEBOUNCE_MS)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Athlètes</h1>
          <p className="text-sm text-muted-foreground">
            {athletes.length} athlète{athletes.length > 1 ? 's' : ''} suivi
            {athletes.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Rechercher un athlète..."
              type="search"
              autoComplete="off"
              name="athlete-search"
              className="h-11 rounded-full border-border bg-input pl-10 shadow-sm transition-all focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/18"
            />
          </div>
          {canManage && (
            <Link
              href="/athletes/new"
              className="group hidden shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/35 lg:inline-flex"
            >
              <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
              Nouvel athlète
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </motion.div>
        ) : athletes.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-20 text-center shadow-card"
          >
            <Users className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {query
                ? 'Aucun athlète ne correspond à cette recherche.'
                : 'Aucun athlète pour le moment.'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={query || 'all'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {athletes.map((athlete, index) => (
              <AthleteCard key={athlete.id} athlete={athlete} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {canManage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
          className="fixed right-4 z-30 lg:hidden"
          // Décalé plus haut que le FAB "dashboard" (5rem) : le widget de feedback
          // (fixed, right-4, bottom 5.5rem) est monté globalement après tout le
          // reste dans app/(app)/layout.tsx et peint donc par-dessus au même
          // z-30, masquant complètement un FAB à 5rem — on passe au-dessus des
          // deux (widget + sa bulle) plutôt que de se superposer.
          style={{ bottom: 'calc(9.5rem + env(safe-area-inset-bottom))' }}
        >
          <Link
            href="/athletes/new"
            aria-label="Nouvel athlète"
            className="flex size-14 touch-target items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground shadow-xl shadow-primary/35"
          >
            <UserPlus className="size-6" />
          </Link>
        </motion.div>
      )}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="animate-shimmer h-[100px] shrink-0 sm:h-24" />
      <div className="flex flex-1 flex-col gap-3 px-4 pt-0 pb-4 sm:px-5 sm:pb-5">
        <div className="-mt-7 sm:-mt-8">
          <div className="animate-shimmer size-14 rounded-full ring-4 ring-card sm:size-16" />
        </div>
        <div className="space-y-1.5">
          <div className="animate-shimmer h-4 w-2/3 rounded-md" />
          <div className="animate-shimmer h-3 w-1/3 rounded-md" />
        </div>
        <div className="flex gap-1.5">
          <div className="animate-shimmer h-5 w-14 rounded-full" />
          <div className="animate-shimmer h-5 w-16 rounded-full" />
        </div>
        <div className="mt-auto flex gap-2 border-t border-border pt-3">
          <div className="animate-shimmer h-8 flex-1 rounded-md" />
          <div className="animate-shimmer h-8 flex-1 rounded-md" />
          <div className="animate-shimmer h-8 flex-1 rounded-md" />
        </div>
      </div>
    </div>
  )
}
