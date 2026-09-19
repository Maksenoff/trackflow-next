'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Home, LogOut, Moon, Sun, Download } from 'lucide-react'
import { NAV_LINKS } from '@/components/nav/nav-links'
import { NewNotificationBell } from '@/components/new-ui/new-notification-bell'
import { TfSplitMark } from '@/components/new-ui/tf-split-mark'
import { TfWordmark } from '@/components/new-ui/tf-wordmark'
import { AppVersion } from '@/components/ui/AppVersion'
import { IosInstallDialog } from '@/components/pwa/ios-install-dialog'
import { useInstallPrompt } from '@/lib/use-install-prompt'
import type { Role } from '@/lib/roles'
import { cn } from '@/lib/utils'
import type { LinkedAthleteInfo } from '@/lib/athlete'

/**
 * Rail desktop de la nouvelle interface (bêta) — visible à partir de `lg:`,
 * même seuil que la sidebar classique (components/nav/sidebar.tsx). En
 * dessous, `NewMobileNav` prend le relais (pas de palier tablette
 * intermédiaire en icônes seules comme dans le mockup d'origine — on garde
 * les deux paliers déjà établis dans le reste de l'app plutôt que d'en
 * ajouter un troisième).
 */
export function NewSidebar({
  roles,
  name,
  linkedAthlete,
  accentColor,
}: {
  roles: Role[]
  name: string
  linkedAthlete: LinkedAthleteInfo | null
  accentColor?: string | null
}) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt()
  const [iosDialogOpen, setIosDialogOpen] = useState(false)
  // `resolvedTheme` est `undefined` côté serveur (lu depuis localStorage,
  // seulement disponible côté client) — l'utiliser directement pour choisir
  // Sun/Moon faisait diverger le HTML serveur du premier rendu client (icône
  // différente), ce qui déclenchait une hydration mismatch React qui
  // repassait TOUTE la page en rendu client (symptôme observé : 2e carte du
  // dashboard disparue, tailles de cartes athlètes incohérentes — rien à
  // voir avec ces pages elles-mêmes). Même garde-fou "mounted" que le
  // sélecteur de thème classique (components/theme-toggle.tsx).
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.some((r) => roles.includes(r)))
  const isDark = mounted && resolvedTheme === 'dark'
  const showInstall = !isStandalone && (canInstall || isIOS)

  async function handleInstall() {
    if (canInstall) await promptInstall()
    else if (isIOS) setIosDialogOpen(true)
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--nu-line)] lg:flex">
      <div className="nu-brand flex h-16 shrink-0 items-center gap-2 px-4">
        <TfSplitMark className="flex size-11 shrink-0 items-center justify-center rounded-xl" />
        {/* SVG à viewBox fixe (voir tf-wordmark.tsx), pas un <div> + `truncate`
            CSS — ne peut structurellement pas se faire couper. Taille agrandie
            (retour Maksen 2026-09-19, "agrandi le trackflow sans le rogner") —
            gap/padding resserrés à côté pour lui faire de la place sans
            pousser la cloche hors de la sidebar (w-60 fixe, pas de wrap
            possible ici contrairement au mobile). */}
        <TfWordmark className="h-[18px] w-auto shrink-0" style={{ color: 'var(--nu-txt)' }} />
        <span className="min-w-0 flex-1" />
        <NewNotificationBell className="nu-bell size-8" accentColor={accentColor} />
      </div>

      <nav className="relative flex flex-1 flex-col gap-0.5 overflow-y-auto px-3.5">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
          // "Dashboard" affiche une maison ici aussi (retour Maksen
          // 2026-09-19, "l'icone dashboard desktop correspond pas a celle du
          // mobile") — même substitution locale que NewMobileNav, NAV_LINKS
          // reste inchangé (partagé avec la nav classique).
          const Icon = link.href === '/dashboard' ? Home : link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative flex items-center gap-3.5 rounded-[11px] px-3.5 py-3 text-[14.5px] transition-colors',
                isActive
                  ? 'font-bold text-[var(--nu-txt)]'
                  : 'text-[var(--nu-dim)] hover:text-[var(--nu-txt)]'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="new-nav-marker"
                  className="absolute inset-0 -z-10 rounded-[11px]"
                  style={{
                    background: 'var(--nu-surf)',
                    boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--nu-acc) 16%, transparent)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                >
                  <span
                    className="absolute top-1/2 -left-[8px] h-4.5 w-[3px] -translate-y-1/2 rounded-[3px]"
                    style={{ background: 'var(--nu-acc)' }}
                  />
                </motion.span>
              )}
              <Icon
                className="size-[19px] shrink-0"
                style={isActive ? { color: 'var(--nu-acc)' } : undefined}
              />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-2 px-4 opacity-70">
        <AppVersion />
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--nu-line)] p-3.5">
        {(() => {
          const avatar = linkedAthlete?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={linkedAthlete.photoUrl}
              alt=""
              className="size-8.5 shrink-0 rounded-full object-cover"
              style={{
                objectPosition: `${linkedAthlete.photoConfig.x ?? 50}% ${linkedAthlete.photoConfig.y ?? 50}%`,
                transform: `scale(${linkedAthlete.photoConfig.zoom ?? 1})`,
                transformOrigin: `${linkedAthlete.photoConfig.x ?? 50}% ${linkedAthlete.photoConfig.y ?? 50}%`,
              }}
            />
          ) : (
            <span
              className="flex size-8.5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )
          const firstName = name.split(' ')[0] || name
          // Troncature par nombre de caractères plutôt que juste CSS
          // `truncate` (qui dépend de la largeur dispo, imprévisible) — même
          // convention que la plupart des apps pour un prénom court affiché
          // à côté d'un avatar (retour Maksen 2026-09-21).
          const MAX_FIRST_NAME_CHARS = 8
          const displayName =
            firstName.length > MAX_FIRST_NAME_CHARS
              ? `${firstName.slice(0, MAX_FIRST_NAME_CHARS)}…`
              : firstName
          const label = (
            <span
              // Largeur fixe en px (pas `ch` — trop dépendant des métriques
              // de la police, un 1er essai à 8.5ch retronquait le texte via
              // l'ellipse CSS avant même 8 caractères) et pas de largeur
              // naturelle non plus (un 2e essai sans aucune limite faisait
              // déborder toute la ligne hors de la sidebar, bouton
              // déconnexion coupé — retour Maksen 2026-09-21, testé 2x). 84px
              // tient les 9 caractères max de `displayName` en 13.5px
              // semibold avec de la marge ; `overflow-hidden`/ellipsis reste
              // en filet de sécurité si jamais une police rend plus large.
              className="shrink-0 overflow-hidden text-[13.5px] font-semibold text-ellipsis whitespace-nowrap"
              style={{ color: 'var(--nu-txt)', maxWidth: 84 }}
              title={firstName.length > MAX_FIRST_NAME_CHARS ? firstName : undefined}
            >
              {displayName}
            </span>
          )
          // Cliquable vers le profil athlète lié uniquement — même règle que
          // la sidebar classique (components/nav/account-menu.tsx) : un
          // compte coach/admin sans profil lié n'a nulle part où aller ici.
          // Le rôle (ex: "Administrateur") a été retiré, jugé inutile
          // (retour Maksen 2026-09-21).
          return linkedAthlete ? (
            <Link
              href={`/athletes/${linkedAthlete.id}`}
              className="flex shrink-0 items-center gap-2.5 rounded-[9px] p-1 transition-colors hover:bg-[var(--nu-surf)]"
            >
              {avatar}
              {label}
            </Link>
          ) : (
            <div className="flex shrink-0 items-center gap-2.5 p-1">
              {avatar}
              {label}
            </div>
          )
        })()}
        <button
          type="button"
          aria-label="Thème"
          title="Thème"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="nu-theme-btn flex size-7.5 shrink-0 items-center justify-center rounded-[9px] hover:bg-[var(--nu-surf)]"
          style={{ color: 'var(--nu-dim)' }}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
        {showInstall && (
          <button
            type="button"
            aria-label="Installer l'application"
            title="Installer l'application"
            onClick={handleInstall}
            className="flex size-7.5 shrink-0 items-center justify-center rounded-[9px] transition-colors hover:bg-[var(--nu-surf)]"
            style={{ color: 'var(--nu-dim)' }}
          >
            <Download className="size-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Déconnexion"
          title="Déconnexion"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex size-7.5 shrink-0 items-center justify-center rounded-[9px] transition-colors hover:bg-[var(--nu-surf)]"
          style={{ color: 'var(--nu-dim)' }}
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <IosInstallDialog open={iosDialogOpen} onOpenChange={setIosDialogOpen} />
    </aside>
  )
}
