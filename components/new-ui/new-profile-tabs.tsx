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

/**
 * Onglets de la nouvelle interface (bêta) : seule la coquille (barre d'onglets
 * + effet d'encre glissante) est repensée façon mockup — le contenu de chaque
 * onglet réutilise tel quel les composants classiques (CRUD, dialogs,
 * optimistic updates déjà en place), pour la même raison que "Performances"
 * reste inchangé sur demande explicite : reskin risqué/coûteux pour un gain
 * visuel marginal sur des flux déjà fonctionnels.
 */
export function NewProfileTabs({
  athlete,
  canEdit,
  canSeeNotes,
}: {
  athlete: AthleteDetail
  canEdit: boolean
  canSeeNotes: boolean
}) {
  const tabs = [
    { key: 'performances' as const, label: 'Performances', icon: TrendingUp },
    { key: 'sessions' as const, label: 'Séances', icon: Dumbbell },
    { key: 'competitions' as const, label: 'Compétitions', icon: Trophy },
    { key: 'goals' as const, label: 'Objectifs', icon: Target },
    ...(athlete.videosEnabled ? [{ key: 'videos' as const, label: 'Vidéos', icon: Video }] : []),
    ...(canSeeNotes
      ? [
          {
            key: 'notes' as const,
            label: 'Notes',
            icon: StickyNote,
            badge: athlete.notesList.length || undefined,
          },
        ]
      : []),
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
    <div>
      <nav
        className="no-scrollbar mt-8 mb-5.5 flex gap-0.5 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--nu-line)' }}
      >
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
                'relative inline-flex shrink-0 items-center gap-2 py-3.5 text-[13.5px] whitespace-nowrap transition-colors',
                isActive ? 'px-4.5' : 'px-3 sm:px-4.5'
              )}
              style={{
                color: isActive ? 'var(--nu-txt)' : 'var(--nu-dim)',
                fontWeight: isActive ? 680 : 400,
              }}
            >
              <tab.icon
                className="size-[15px]"
                style={isActive ? { color: 'var(--nu-acc)' } : undefined}
              />
              {/* Mobile : seul l'onglet actif affiche son nom, les autres restent en
                  icône seule (nom réapparaît dynamiquement à chaque changement
                  d'onglet actif) — évite que la barre déborde et scrolle
                  latéralement dès qu'il y a 5-6 onglets (retour Maksen 2026-09-19).
                  Desktop (`sm:` et plus) : toujours icône + nom, inchangé. */}
              <span className={cn(!isActive && 'hidden sm:inline')}>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className="rounded-full px-[7px] py-0.5 text-[10.5px]"
                  style={{ background: 'var(--nu-surf)', color: 'var(--nu-dim)' }}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="new-profile-tab-ink"
                  className="absolute inset-x-4.5 -bottom-px h-[2px] rounded-[2px]"
                  style={{ background: 'var(--nu-acc)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          )
        })}
      </nav>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
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
            {active === 'notes' && canSeeNotes && (
              <NotesTab athleteId={athlete.id} notes={athlete.notesList} canEdit={canSeeNotes} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
