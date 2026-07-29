import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Users, CalendarDays, Trophy, ShieldCheck } from 'lucide-react'
import { ROLES, type Role } from '@/lib/roles'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  roles?: Role[]
}

export const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/athletes', label: 'Athlètes', icon: Users },
  { href: '/calendar', label: 'Calendrier', icon: CalendarDays },
  { href: '/competitions', label: 'Compétitions', icon: Trophy },
  {
    href: '/admin',
    label: 'Admin',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
  },
]
