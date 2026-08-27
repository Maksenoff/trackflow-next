'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TeamTabDef = {
  key: string
  label: string
  icon: LucideIcon
  count?: number | null
  content: React.ReactNode
}

// Switcher à pill bar avec indicateur animé — pattern standard CLAUDE.md §7,
// même structure que SettingsTabs/ProfileTabs. Contrôlé par le parent (active/
// onActiveChange) pour permettre de piloter l'onglet actif depuis l'extérieur.
export function TeamTabs({
  tabs,
  active,
  onActiveChange,
}: {
  tabs: TeamTabDef[]
  active: string
  onActiveChange: (key: string) => void
}) {
  const [direction, setDirection] = useState(1)

  function switchTo(key: string) {
    if (key === active) return
    const from = tabs.findIndex((t) => t.key === active)
    const to = tabs.findIndex((t) => t.key === key)
    setDirection(to > from ? 1 : -1)
    onActiveChange(key)
  }

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm">
        {tabs.map((t) => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTo(t.key)}
              aria-current={isActive}
              className={cn(
                'relative z-10 flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="team-tab-active"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              )}
              <t.icon className="size-3.5" />
              {t.label}
              {t.count != null && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] font-bold',
                    isActive ? 'bg-white/20' : 'bg-muted'
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={activeTab.key}
            custom={direction}
            initial={{ x: direction * 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -16, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeTab.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
