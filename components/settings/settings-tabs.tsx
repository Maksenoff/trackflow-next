'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Trophy, Zap } from 'lucide-react'
import { TypeManager, type ManagedType } from '@/components/admin/type-manager'
import { cn } from '@/lib/utils'

type TabKey = 'sessions' | 'competitions'

export function SettingsTabs({
  initialTab,
  sessionTypes,
  competitionTypes,
  showSessions = true,
  showCompetitions = true,
}: {
  initialTab: TabKey
  sessionTypes: ManagedType[]
  competitionTypes: ManagedType[]
  showSessions?: boolean
  showCompetitions?: boolean
}) {
  const router = useRouter()

  const tabs = [
    ...(showSessions
      ? [
          {
            key: 'sessions' as const,
            label: 'Types de séances',
            icon: Zap,
            count: sessionTypes.length,
          },
        ]
      : []),
    ...(showCompetitions
      ? [
          {
            key: 'competitions' as const,
            label: 'Types de compétitions',
            icon: Trophy,
            count: competitionTypes.length,
          },
        ]
      : []),
  ]

  const [active, setActive] = useState<TabKey>(initialTab)
  const [direction, setDirection] = useState(1)

  function switchTo(key: TabKey) {
    if (key === active) return
    const from = tabs.findIndex((t) => t.key === active)
    const to = tabs.findIndex((t) => t.key === key)
    setDirection(to > from ? 1 : -1)
    setActive(key)
    router.replace(`/settings?tab=${key}`, { scroll: false })
  }

  return (
    <div className="space-y-5">
      {tabs.length > 1 && (
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
          {tabs.map((t) => {
            const isActive = t.key === active
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTo(t.key)}
                aria-current={isActive}
                className={cn(
                  'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="settings-tab-active"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                )}
                <t.icon className="size-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">
                  {t.key === 'sessions' ? 'Séances' : 'Compétitions'}
                </span>
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] font-bold',
                    isActive ? 'bg-white/20' : 'bg-muted'
                  )}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={active}
          custom={direction}
          initial={{ x: direction * 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -16, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {active === 'sessions' ? (
            <TypeManager kind="session" initialTypes={sessionTypes} />
          ) : (
            <TypeManager kind="competition" initialTypes={competitionTypes} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
