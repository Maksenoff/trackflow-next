'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/feedbacks', label: 'Feedbacks', icon: MessageSquare },
] as const

export function AdminSubNav({ unresolvedFeedbacks }: { unresolvedFeedbacks: number }) {
  const pathname = usePathname()
  const isIndexPage = TABS.some((t) => t.href === pathname)
  if (!isIndexPage) return null

  return (
    <div className="inline-flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
      {TABS.map((tab) => {
        const isActive = tab.href === pathname
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.span
                layoutId="admin-subnav-active"
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
            )}
            <tab.icon className="size-4" />
            {tab.label}
            {tab.href === '/admin/feedbacks' && unresolvedFeedbacks > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] font-bold',
                  isActive ? 'bg-white/20' : 'bg-muted'
                )}
              >
                {unresolvedFeedbacks}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
