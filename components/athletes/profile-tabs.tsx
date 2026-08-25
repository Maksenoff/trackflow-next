'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TrendingUp, Dumbbell, Trophy, Target, Video, StickyNote } from 'lucide-react'
import { PerformancesTab } from '@/components/athletes/tabs/performances-tab'
import { SessionsTab } from '@/components/athletes/tabs/sessions-tab'
import { CompetitionsTab } from '@/components/athletes/tabs/competitions-tab'
import { GoalsTab } from '@/components/athletes/tabs/goals-tab'
import { VideosTab } from '@/components/athletes/tabs/videos-tab'
import { NotesTab } from '@/components/athletes/tabs/notes-tab'
import { cn } from '@/lib/utils'
import type { AthleteDetail } from '@/lib/athletes-data'

type TabKey = 'performances' | 'sessions' | 'competitions' | 'goals' | 'videos' | 'notes'

export function ProfileTabs({ athlete, canEdit }: { athlete: AthleteDetail; canEdit: boolean }) {
  const tabs = [
    { key: 'performances' as const, label: 'Performances', icon: TrendingUp },
    { key: 'sessions' as const, label: 'Séances', icon: Dumbbell },
    { key: 'competitions' as const, label: 'Compétitions', icon: Trophy },
    { key: 'goals' as const, label: 'Objectifs', icon: Target },
    ...(athlete.videosEnabled ? [{ key: 'videos' as const, label: 'Vidéos', icon: Video }] : []),
    {
      key: 'notes' as const,
      label: 'Notes',
      icon: StickyNote,
      badge: athlete.notesList.length || undefined,
    },
  ]

  const [active, setActive] = useState<TabKey>('performances')
  const [direction, setDirection] = useState(1)

  function switchTo(key: TabKey) {
    if (key === active) return
    const from = tabs.findIndex((t) => t.key === active)
    const to = tabs.findIndex((t) => t.key === key)
    setDirection(to > from ? 1 : -1)
    setActive(key)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-sm">
        {tabs.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTo(tab.key)}
              aria-current={isActive}
              aria-label={tab.label}
              title={tab.label}
              className={cn(
                'relative z-10 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:px-4',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="profile-tab-active"
                  className="absolute inset-0 -z-10 rounded-lg bg-gradient-selected shadow-sm shadow-primary/25"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              )}
              <tab.icon className="size-4 sm:size-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] font-bold',
                    isActive ? 'bg-white/25' : 'bg-muted'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={active}
            custom={direction}
            initial={{ x: direction * 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {active === 'performances' && (
              <PerformancesTab
                performances={athlete.performances}
                birthDate={athlete.birthDate}
                disciplineColors={athlete.disciplineColors}
                disciplineOrder={athlete.disciplines}
              />
            )}
            {active === 'sessions' && (
              <SessionsTab
                athleteId={athlete.id}
                sessionsWindow={athlete.sessionsWindow}
                customSessions={athlete.customSessions}
                canEdit={canEdit}
              />
            )}
            {active === 'competitions' && (
              <CompetitionsTab registrations={athlete.competitionRegistrations} canEdit={canEdit} />
            )}
            {active === 'goals' && (
              <GoalsTab athleteId={athlete.id} goals={athlete.goals} canEdit={canEdit} />
            )}
            {active === 'videos' && <VideosTab videos={athlete.videos} />}
            {active === 'notes' && (
              <NotesTab athleteId={athlete.id} notes={athlete.notesList} canEdit={canEdit} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
