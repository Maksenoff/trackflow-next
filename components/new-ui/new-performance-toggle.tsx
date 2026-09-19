'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PerformanceWidgetItem } from '@/lib/dashboard'
import { PerfGrid } from '@/components/new-ui/new-performance-cards'

/** Texte du pied de grille — diffère de ce qui est réellement visible entre
 * mobile (4 tuiles) et desktop (3, cf. `desktopLimit` sur `PerfGrid`) : deux
 * variantes basculées en CSS plutôt qu'un seul nombre qui ne collerait pas
 * à l'un des deux affichages. */
function desktopFooter(mobileCount: number, desktopCount: number) {
  return (
    <>
      <span className="sm:hidden">Tes {mobileCount} dernières performances</span>
      <span className="hidden sm:inline">Tes {desktopCount} dernières performances</span>
    </>
  )
}

type Performances =
  | { view: 'athlete'; hasLinkedAthlete: boolean; recentPerformances: PerformanceWidgetItem[] }
  | {
      view: 'coach'
      hasLinkedAthlete: boolean
      allPerformances: PerformanceWidgetItem[]
      myPerformances: PerformanceWidgetItem[]
    }

/** En-tête (label + switcher "Vue coach"/"Vue athlète" façon mockup) + grille
 *  de tuiles de performances — un seul composant client car le switcher pilote
 *  à la fois son propre libellé de section et le contenu affiché dessous. */
export function NewPerformancesSection({ performances }: { performances: Performances }) {
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const isCoach = performances.view === 'coach'
  const mode = isCoach && tab === 'all' ? 'coach' : 'athlete'
  // Vue coach : 3 colonnes de tuiles compactes, 6 perfs. Vue athlète : mêmes
  // 3 colonnes mais tuiles hautes (date, pas d'avatar) — fidèle au mockup
  // (grille toujours 3 colonnes à partir de `sm:`, seule la taille des
  // tuiles change entre les deux vues). En dessous de `sm:` (mobile), une
  // 4e perf s'affiche en plus (la grille passe à 1-2 colonnes, une ligne
  // de plus ne casse rien) — desktop reste strictement à 3 (retour Maksen).
  const athleteMobileLimit = 4
  const athleteDesktopLimit = 3
  const limit = mode === 'coach' ? 6 : athleteMobileLimit
  const source = isCoach
    ? tab === 'all'
      ? performances.allPerformances
      : performances.myPerformances
    : performances.recentPerformances
  const items = source.slice(0, limit)
  const desktopLimit = mode === 'coach' ? undefined : athleteDesktopLimit
  const footer = isCoach
    ? tab === 'all'
      ? `${items.length} dernières performances du club`
      : desktopFooter(items.length, athleteDesktopLimit)
    : desktopFooter(items.length, athleteDesktopLimit)

  return (
    <div className="flex flex-1 flex-col">
      <div
        className="flex min-h-[46px] items-center justify-between gap-3 border-b pb-3.5"
        style={{ borderColor: 'var(--nu-line)' }}
      >
        <span
          className="text-[10.5px] font-semibold tracking-[0.1em] uppercase"
          style={{ color: 'var(--nu-dim)' }}
        >
          Performances récentes
        </span>
        {isCoach && performances.hasLinkedAthlete && (
          <div
            className="relative inline-flex items-center gap-0.5 rounded-[11px] p-0.5"
            style={{ background: 'var(--nu-bg)', border: '1px solid var(--nu-line)' }}
          >
            {(['all', 'mine'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="relative z-10 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap"
                style={{ color: tab === key ? 'var(--nu-onacc)' : 'var(--nu-dim)' }}
              >
                {tab === key && (
                  <motion.span
                    layoutId="new-perf-toggle"
                    className="absolute inset-0 -z-10 rounded-[8px]"
                    style={{ background: 'var(--nu-acc)' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  />
                )}
                {key === 'all' ? 'Vue coach' : 'Vue athlète'}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode + tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18 }}
          className="flex flex-1 flex-col"
        >
          <PerfGrid
            items={items}
            mode={mode}
            footer={items.length > 0 ? footer : undefined}
            desktopLimit={desktopLimit}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
