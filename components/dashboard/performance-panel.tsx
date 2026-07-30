'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PerformanceList } from '@/components/dashboard/performance-list'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { cn } from '@/lib/utils'

export function PerformancePanel({
  allPerformances,
  myPerformances,
  hasLinkedAthlete,
}: {
  allPerformances: PerformanceWidgetItem[]
  myPerformances: PerformanceWidgetItem[]
  hasLinkedAthlete: boolean
}) {
  const [mode, setMode] = useState<'all' | 'mine'>('all')
  const performances = mode === 'mine' ? myPerformances : allPerformances

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          Performances récentes
          {mode === 'mine' && <Badge variant="secondary">Moi</Badge>}
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative flex rounded-lg border bg-muted/50 p-0.5 text-xs">
            {(['all', 'mine'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  'relative z-10 flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
                  mode === value
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode === value && (
                  <motion.span
                    layoutId="dashboard-perf-mode"
                    className="absolute inset-0 rounded-md bg-primary -z-10"
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                )}
                {value === 'all' ? <Users className="size-3.5" /> : <User className="size-3.5" />}
                {value === 'all' ? 'Vue coach' : 'Vue athlète'}
              </button>
            ))}
          </div>
          <Link
            href="/athletes"
            className="text-sm text-primary font-medium hover:underline hidden sm:flex items-center gap-1"
          >
            Athlètes <ArrowRight className="size-3.5" />
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
