'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, TrendingUp, Users, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PerformanceList } from '@/components/dashboard/performance-list'
import { MotionCta } from '@/components/dashboard/motion-cta'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

export function PerformancePanel({
  allPerformances,
  myPerformances,
  hasLinkedAthlete,
  canCreateAthlete,
}: {
  allPerformances: PerformanceWidgetItem[]
  myPerformances: PerformanceWidgetItem[]
  hasLinkedAthlete: boolean
  canCreateAthlete: boolean
}) {
  const [mode, setMode] = useState<'all' | 'mine'>('all')
  const performances = mode === 'mine' ? myPerformances : allPerformances

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-primary" />
          Performances récentes
          {mode === 'mine' && <Badge variant="secondary">Moi</Badge>}
        </h2>
        <div className="flex items-center gap-1.5">
          {canCreateAthlete && (
            <MotionCta>
              <Link
                href="/athletes/new"
                title="Nouvel athlète"
                aria-label="Nouvel athlète"
                className="group inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition-shadow duration-300 hover:bg-primary-hover hover:shadow-md hover:shadow-primary/35"
              >
                <Plus className="size-3.5 transition-transform duration-300 group-hover:rotate-90" />
              </Link>
            </MotionCta>
          )}
          {/* Le switch Vue coach/athlète n'a de sens que si ce compte a un profil
              athlète lié — sinon "Vue athlète" ne mène qu'à un état vide, ce qui
              donnait l'impression fausse d'avoir "les deux vues" (ex: gest.
              compétitions, qui n'a normalement pas de profil athlète). */}
          {hasLinkedAthlete && (
            <div className="relative flex rounded-full border border-border bg-card p-0.5 text-xs shadow-sm">
              {(['all', 'mine'] as const).map((value) => (
                <motion.button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    'relative z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-medium transition-colors duration-200',
                    mode === value
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {mode === value && (
                    <motion.span
                      layoutId="dashboard-perf-mode"
                      className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm shadow-primary/30"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  )}
                  {value === 'all' ? <Users className="size-3.5" /> : <User className="size-3.5" />}
                  <span className="hidden md:inline">
                    {value === 'all' ? 'Vue coach' : 'Vue athlète'}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
          <Link
            href="/athletes"
            title="Athlètes"
            aria-label="Athlètes"
            className="group hidden size-7 shrink-0 items-center justify-center rounded-full text-primary transition-all duration-200 hover:bg-primary/10 active:scale-90 sm:inline-flex"
          >
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <PerformanceList
        key={mode}
        performances={performances}
        emptyMessage={
          mode === 'mine'
            ? hasLinkedAthlete
              ? 'Aucune performance enregistrée pour toi.'
              : 'Aucun profil athlète lié à ton compte.'
            : 'Aucune performance enregistrée.'
        }
      />
    </div>
  )
}
