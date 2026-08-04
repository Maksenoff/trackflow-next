import { ROLE_LABELS, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

const ROLE_STYLES: Record<Role, string> = {
  ROLE_ADMIN:
    'from-primary/35 to-primary/10 text-primary border-primary/45 dark:from-primary/20 dark:to-primary/5 dark:border-primary/30',
  ROLE_COACH:
    'from-cyan-400/35 to-cyan-400/10 text-cyan-700 dark:text-cyan-400 border-cyan-400/45 dark:from-cyan-400/20 dark:to-cyan-400/5 dark:border-cyan-400/30',
  ROLE_COMPETITION_MANAGER:
    'from-amber-400/35 to-amber-400/10 text-amber-700 dark:text-amber-400 border-amber-400/45 dark:from-amber-400/20 dark:to-amber-400/5 dark:border-amber-400/30',
  ROLE_ATHLETE:
    'from-violet-400/35 to-violet-400/10 text-violet-700 dark:text-violet-400 border-violet-400/45 dark:from-violet-400/20 dark:to-violet-400/5 dark:border-violet-400/30',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border bg-gradient-to-br px-2 py-0.5 text-[10px] font-semibold tracking-wide',
        ROLE_STYLES[role]
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}
