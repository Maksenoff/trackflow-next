import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, Users, CalendarDays, Settings, ShieldCheck } from 'lucide-react'
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
  { href: '/calendar', label: 'Calendriers', icon: CalendarDays },
  {
    href: '/settings',
    label: 'Paramètres',
    icon: Settings,
    roles: [ROLES.ADMIN],
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: ShieldCheck,
    roles: [ROLES.ADMIN],
  },
]
