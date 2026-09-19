'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Home, Settings, ShieldCheck, Users, Moon, Sun, type LucideIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { MobileAccountSheet } from '@/components/nav/mobile-account-sheet'
import { NewNotificationBell } from '@/components/new-ui/new-notification-bell'
import { TfSplitMark } from '@/components/new-ui/tf-split-mark'
import { TfWordmark } from '@/components/new-ui/tf-wordmark'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { ROLE_LABELS, primaryRole, type Role } from '@/lib/roles'
import type { LinkedAthleteInfo } from '@/lib/athlete'

/**
 * Tuile d'onglet partagée (lien de route ou bouton ouvrant un sheet) — un
 * seul endroit pour le design/l'animation plutôt que 4 blocs JSX
 * quasi-identiques copiés-collés (retour Maksen 2026-09-18, "retravailler un
 * peu le design et l'animation" des onglets bas de nav). Pastille active
 * resserrée autour de l'icône (pas toute la hauteur de la tuile) avec une
 * légère lueur teintée accent, icône qui grossit + s'épaissit (strokeWidth)
 * à l'activation — et un `whileTap` sur chaque tuile (active ou non) pour un
 * retour tactile au tap, ce qui manquait totalement avant.
 *
 * Libellé retiré visuellement (retour Maksen 2026-09-19, "enlève le nom des
 * onglets en bas") — icônes seules, plus grandes (size-6 au lieu de size-5)
 * pour compenser visuellement l'absence de texte. Le libellé reste en
 * `sr-only` : ne retire l'info qu'à l'écran, pas de l'accessibilité, et sert
 * aussi de `aria-label` sur le lien/bouton lui-même. Les sous-onglets (feuille
 * Communauté/Système plus bas) gardent leurs libellés visibles, non concernés
 * par cette demande.
 */
function NavTile({
  active,
  icon: Icon,
  label,
  href,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  href?: string
  onClick?: () => void
}) {
  const inner = (
    <motion.span
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      className="relative flex w-full items-center justify-center py-2.5"
    >
      {active && (
        <motion.span
          layoutId="new-mobile-nav-active"
          className="absolute size-11 rounded-full"
          style={{
            background: 'var(--nu-acc)',
            boxShadow: '0 6px 18px -4px color-mix(in srgb, var(--nu-acc) 65%, transparent)',
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        />
      )}
      <motion.span
        animate={{ scale: active ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        className="relative z-10 flex items-center justify-center transition-colors duration-150"
        style={{ color: active ? 'var(--nu-onacc)' : 'var(--nu-dim)' }}
      >
        <Icon className="size-6" strokeWidth={active ? 2.3 : 1.9} />
      </motion.span>
    </motion.span>
  )

  return (
    <li className="flex-1">
      {href ? (
        <Link href={href} className="block" aria-label={label}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="block w-full" aria-label={label}>
          {inner}
        </button>
      )}
    </li>
  )
}

/**
 * Nav mobile de la nouvelle interface (bêta). Reprend le regroupement
 * Communauté/Système de components/nav/mobile-nav.tsx — le mockup masque les
 * libellés sous le seuil mobile (font-size:0), mais la consigne explicite est
 * de toujours nommer les onglets pour s'y repérer, donc les libellés restent
 * affichés ici comme dans la version classique.
 */
export function NewMobileNav({
  roles,
  name,
  email,
  linkedAthlete,
  accentColor,
}: {
  roles: Role[]
  name: string
  email: string
  linkedAthlete: LinkedAthleteInfo | null
  accentColor?: string | null
}) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  // `resolvedTheme` est `undefined` côté serveur — l'utiliser directement pour
  // choisir Sun/Moon fait diverger le HTML serveur du premier rendu client
  // (hydration mismatch React, cf. le même correctif sur NewSidebar). Même
  // garde-fou "mounted" que le sélecteur de thème classique
  // (components/theme-toggle.tsx).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [systemOpen, setSystemOpen] = useState(false)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const allowed = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
  const COMMUNITY_HREFS = ['/athletes', '/teams', '/votes']
  const communityLinks = allowed.filter((l) => COMMUNITY_HREFS.includes(l.href))
  const communityActive = COMMUNITY_HREFS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  )

  type RowItem = { kind: 'link'; link: (typeof allowed)[number] } | { kind: 'community' }
  const rowItems: RowItem[] = []
  let communityInserted = false
  for (const link of allowed) {
    if (link.href === '/settings' || link.href === '/admin') continue
    if (COMMUNITY_HREFS.includes(link.href)) {
      if (!communityInserted) {
        rowItems.push({ kind: 'community' })
        communityInserted = true
      }
      continue
    }
    rowItems.push({ kind: 'link', link })
  }
  const hasSystem = allowed.some((l) => l.href === '/settings' || l.href === '/admin')
  const systemActive =
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  const isDark = mounted && resolvedTheme === 'dark'
  const role = primaryRole(roles)

  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] lg:hidden"
        style={{ background: 'var(--nu-bg)', borderBottom: '1px solid var(--nu-line)' }}
      >
        <TfSplitMark className="flex size-10 shrink-0 items-center justify-center rounded-[11px]" />
        {/* SVG à viewBox fixe (voir tf-wordmark.tsx) : ne peut structurellement
            pas se faire tronquer, contrairement à l'ancien <div> + `truncate`
            CSS qui coupait "Trackflow" en dur sur les écrans étroits. Agrandi
            (retour Maksen 2026-09-19, "ya plus de marge pour agrandir un
            peu") — largement de marge même sur un petit écran (320px) une
            fois le budget des éléments fixes du bandeau recalculé. */}
        <TfWordmark className="h-[18px] w-auto shrink-0" style={{ color: 'var(--nu-txt)' }} />
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label="Thème"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="nu-theme-btn flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ color: 'var(--nu-dim)' }}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
        <NewNotificationBell variant="sheet" className="nu-bell size-8" accentColor={accentColor} />
      </div>

      <nav
        className="fixed inset-x-3 z-40 rounded-[22px] shadow-lg print:hidden lg:hidden"
        style={{
          bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          background: 'var(--nu-surf)',
          border: '1px solid var(--nu-line)',
        }}
      >
        <ul className="flex items-stretch gap-1 px-1 py-1.5">
          {rowItems.map((item) =>
            item.kind === 'community' ? (
              <NavTile
                key="community"
                active={communityActive}
                icon={Users}
                label="Communauté"
                onClick={() => setCommunityOpen(true)}
              />
            ) : (
              <NavTile
                key={item.link.href}
                active={pathname === item.link.href || pathname.startsWith(`${item.link.href}/`)}
                // "Dashboard" affiche une maison ici (retour Maksen
                // 2026-09-19) — NAV_LINKS reste inchangé (partagé avec la nav
                // classique et le rail desktop), remplacement local à cette
                // nav mobile uniquement.
                icon={item.link.href === '/dashboard' ? Home : item.link.icon}
                label={item.link.label}
                href={item.link.href}
              />
            )
          )}
          {hasSystem && (
            <NavTile
              active={systemActive}
              icon={Settings}
              label="Système"
              onClick={() => setSystemOpen(true)}
            />
          )}
          <li className="flex-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 500, damping: 24 }}
              onClick={() => setAccountOpen(true)}
              aria-label={role ? ROLE_LABELS[role] : 'Profil'}
              className="flex w-full items-center justify-center py-3"
              style={{ color: 'var(--nu-dim)' }}
            >
              <span
                className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
              >
                {name.slice(0, 1).toUpperCase()}
              </span>
            </motion.button>
          </li>
        </ul>
      </nav>

      <MobileAccountSheet
        open={accountOpen}
        onOpenChange={setAccountOpen}
        name={name}
        email={email}
        primaryRole={role}
        linkedAthlete={linkedAthlete}
        hideTheme
      />

      <Sheet open={communityOpen} onOpenChange={setCommunityOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] pb-[max(1rem,env(safe-area-inset-bottom))]"
          style={{ background: 'var(--nu-bg)', borderColor: 'var(--nu-line)' }}
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Communauté</SheetTitle>
          <div
            className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full"
            style={{ background: 'var(--nu-line)' }}
          />
          <div className="grid grid-cols-3 gap-3 px-4 pt-3 pb-4">
            {communityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setCommunityOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 text-center transition-colors"
                style={{ border: '1px solid var(--nu-line)', background: 'var(--nu-surf)' }}
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--nu-acc) 14%, transparent)',
                    color: 'var(--nu-acc)',
                  }}
                >
                  <link.icon className="size-5" />
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--nu-txt)' }}>
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={systemOpen} onOpenChange={setSystemOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] pb-[max(1rem,env(safe-area-inset-bottom))]"
          style={{ background: 'var(--nu-bg)', borderColor: 'var(--nu-line)' }}
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Système</SheetTitle>
          <div
            className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full"
            style={{ background: 'var(--nu-line)' }}
          />
          <div className="grid grid-cols-2 gap-3 px-4 pt-3 pb-4">
            {allowed.some((l) => l.href === '/settings') && (
              <Link
                href="/settings"
                onClick={() => setSystemOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 text-center transition-colors"
                style={{ border: '1px solid var(--nu-line)', background: 'var(--nu-surf)' }}
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--nu-acc) 14%, transparent)',
                    color: 'var(--nu-acc)',
                  }}
                >
                  <Settings className="size-5" />
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--nu-txt)' }}>
                  Paramètres
                </span>
              </Link>
            )}
            {allowed.some((l) => l.href === '/admin') && (
              <Link
                href="/admin"
                onClick={() => setSystemOpen(false)}
                className="flex flex-col items-center gap-2 rounded-2xl py-4 text-center transition-colors"
                style={{ border: '1px solid var(--nu-line)', background: 'var(--nu-surf)' }}
              >
                <span
                  className="flex size-11 items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--nu-acc) 14%, transparent)',
                    color: 'var(--nu-acc)',
                  }}
                >
                  <ShieldCheck className="size-5" />
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--nu-txt)' }}>
                  Admin
                </span>
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
