'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, TrendingUp, Users, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PerformanceList } from '@/components/dashboard/performance-list'
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
            <Link
              href="/athletes/new"
              title="Nouvel athlète"
              aria-label="Nouvel athlète"
              className="group inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/25 transition-all duration-300 hover:shadow-md hover:shadow-primary/35"
            >
              <Plus className="size-3.5 transition-transform duration-300 group-hover:rotate-90" />
            </Link>
          )}
          <div className="relative flex rounded-full border border-border bg-card p-0.5 text-xs shadow-sm">
            {(['all', 'mine'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  'relative z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-medium transition-colors',
                  mode === value
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === value && (
                  <motion.span
                    layoutId="dashboard-perf-mode"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30 -z-10"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                )}
                {value === 'all' ? <Users className="size-3.5" /> : <User className="size-3.5" />}
                <span className="hidden md:inline">
                  {value === 'all' ? 'Vue coach' : 'Vue athlète'}
                </span>
              </button>
            ))}
          </div>
          <Link
            href="/athletes"
            title="Athlètes"
            aria-label="Athlètes"
            className="group hidden size-7 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 sm:inline-flex"
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
