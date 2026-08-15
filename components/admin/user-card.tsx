'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { initials } from '@/lib/athlete'
import { ROLE_LABELS, type Role } from '@/lib/roles'

export type UserCardData = {
  id: string
  firstName: string
  lastName: string
  email: string
  roles: Role[]
}

export function UserCard({
  user,
  isSelf,
  index = 0,
}: {
  user: UserCardData
  isSelf: boolean
  index?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.04, ease: 'easeOut' }}
    >
      <Link
        href={`/admin/users/${user.id}`}
        className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
      >
        {isSelf && (
          <span className="absolute top-3 right-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            Vous
          </span>
        )}

        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground">
            {initials(user.firstName, user.lastName)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-bold">
              {user.firstName} {user.lastName}
            </div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {user.roles.length === 0 && (
            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Aucun rôle
            </span>
          )}
          {user.roles.map((role) => (
            <span
              key={role}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              {ROLE_LABELS[role]}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  )
}
