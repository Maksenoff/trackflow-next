import { ROLE_LABELS, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

const ROLE_STYLES: Record<Role, string> = {
  ROLE_ADMIN: 'from-primary/12 to-primary/2 text-primary border-primary/20',
  ROLE_COACH: 'from-cyan-400/12 to-cyan-400/2 text-cyan-600 dark:text-cyan-400 border-cyan-400/20',
  ROLE_COMPETITION_MANAGER:
    'from-amber-400/12 to-amber-400/2 text-amber-600 dark:text-amber-400 border-amber-400/20',
  ROLE_ATHLETE:
    'from-violet-400/12 to-violet-400/2 text-violet-600 dark:text-violet-400 border-violet-400/20',
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
