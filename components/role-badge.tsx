import { ROLE_LABELS, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

const ROLE_STYLES: Record<Role, string> = {
  ROLE_ADMIN: 'from-primary/25 to-primary/5 text-primary border-primary/30',
  ROLE_COACH: 'from-cyan-400/25 to-cyan-400/5 text-cyan-600 dark:text-cyan-400 border-cyan-400/30',
  ROLE_COMPETITION_MANAGER:
    'from-amber-400/25 to-amber-400/5 text-amber-600 dark:text-amber-400 border-amber-400/30',
  ROLE_ATHLETE:
    'from-violet-400/25 to-violet-400/5 text-violet-600 dark:text-violet-400 border-violet-400/30',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border bg-gradient-to-br px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm',
        ROLE_STYLES[role]
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}
