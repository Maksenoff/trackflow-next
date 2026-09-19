'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BarChart3, Check, Copy, ExternalLink, MoreHorizontal, Pencil, Trophy } from 'lucide-react'
import { calcAge, ffaCategory, GENDER_LABELS, initials } from '@/lib/athlete'
import { DISCIPLINE_LABELS, defaultDisciplineColor } from '@/lib/disciplines'
import { FfaSyncButtons } from '@/components/athletes/ffa-sync-buttons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CountUp } from '@/components/new-ui/count-up'
import type { AthleteDetail } from '@/lib/athletes-data'

function formatSyncDateTime(date: Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Tool({
  href,
  onClick,
  icon: Icon,
  label,
  index,
}: {
  href?: string
  onClick?: () => void
  icon: React.ElementType
  label: string
  index: number
}) {
  const content = (
    <>
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </>
  )
  const className =
    'nu-tool inline-flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[12.5px] transition-colors'
  const style = { border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }
  const anim = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.2, 0.9, 0.25, 1] as const, delay: 0.5 + index * 0.07 },
  }
  if (href) {
    return (
      <motion.div {...anim}>
        <Link href={href} className={className} style={style}>
          {content}
        </Link>
      </motion.div>
    )
  }
  return (
    <motion.button type="button" onClick={onClick} className={className} style={style} {...anim}>
      {content}
    </motion.button>
  )
}

function LicenseButton({ license }: { license: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(license)
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission
      // refusée...) — le numéro reste visible à l'écran, pas grave.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copier le numéro de licence"
      className="nu-tool inline-flex items-center gap-2 rounded-[9px] px-2.5 py-1.5 text-xs transition-colors"
      style={{
        border: '1px solid var(--nu-line)',
        color: copied ? 'var(--nu-ok)' : 'var(--nu-dim)',
        borderColor: copied
          ? 'color-mix(in srgb, var(--nu-ok) 40%, transparent)'
          : 'var(--nu-line)',
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ background: 'var(--nu-ok)' }} />
      Licence {license}
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function StripCell({
  index,
  label,
  children,
  className,
}: {
  index: number
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.25, 1], delay: 0.65 + index * 0.06 }}
      className={`relative px-4 py-3.5 sm:px-5 ${className ?? ''}`}
      style={index > 0 ? { borderLeft: '1px solid var(--nu-line)' } : undefined}
    >
      <span
        className="block text-[9.5px] font-semibold tracking-[0.13em] uppercase"
        style={{ color: 'var(--nu-dim)' }}
      >
        {label}
      </span>
      {children}
    </motion.div>
  )
}

/** Version mobile de StripCell, sans animation d'entrée — les blocs mobiles
 *  sont séparés par un trait horizontal simple posé entre eux (voir plus
 *  bas), et par un trait vertical simple entre cellules d'un même bloc via
 *  `bordered` (retour Maksen 2026-09-19 : Catégorie/Profil et
 *  Séances/Performances/Objectifs doivent aussi être séparés entre eux). */
function MobileStripCell({
  label,
  bordered,
  children,
}: {
  label: string
  bordered?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={bordered ? 'pl-4' : undefined}
      style={bordered ? { borderLeft: '1px solid var(--nu-line)' } : undefined}
    >
      <span
        className="block text-[9.5px] font-semibold tracking-[0.13em] uppercase"
        style={{ color: 'var(--nu-dim)' }}
      >
        {label}
      </span>
      {children}
    </div>
  )
}

export function NewProfileHeader({
  athlete,
  canEdit,
  canEditProfile,
  isAdmin,
}: {
  athlete: AthleteDetail
  canEdit: boolean
  canEditProfile: boolean
  isAdmin: boolean
}) {
  const age = calcAge(athlete.birthDate)
  const category = ffaCategory(athlete.birthDate)
  const sessionsCount = athlete.athleteSessions.filter((s) => !s.skipped).length
  const hasFfa = canEdit && !!athlete.ffaProfileUrl
  const hasPerformances = athlete.performances.length > 0

  return (
    <div
      className="grid overflow-hidden rounded-[22px] sm:grid-cols-[206px_minmax(0,1fr)]"
      style={{
        background: 'var(--nu-surf)',
        border: '1px solid var(--nu-line)',
        boxShadow: 'inset 0 1px 0 var(--nu-rim)',
      }}
    >
      <div
        className="relative min-h-[128px] overflow-hidden sm:min-h-[214px]"
        style={{ background: 'var(--nu-surf2)', borderRight: '1px solid var(--nu-line)' }}
      >
        {athlete.photoUrl ? (
          <motion.img
            src={athlete.photoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            style={{
              objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
            }}
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 1, ease: [0.2, 0.9, 0.25, 1], delay: 0.15 }}
          />
        ) : (
          <div
            className="flex size-full items-center justify-center text-[42px]"
            style={{ color: 'var(--nu-acc)' }}
          >
            <span className="nu-it">{initials(athlete.firstName, athlete.lastName)}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-1 flex-col items-start justify-between gap-5 px-5 py-6 sm:flex-row sm:px-6.5 sm:py-6.5">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.9, 0.25, 1], delay: 0.28 }}
              className="text-[clamp(26px,3.4vw,40px)] leading-[1.05] font-extrabold tracking-[-0.02em]"
              style={{ color: 'var(--nu-txt)' }}
            >
              {athlete.firstName} {athlete.lastName}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.2, 0.9, 0.25, 1], delay: 0.5 }}
              className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[12.5px]"
              style={{ color: 'var(--nu-dim)' }}
            >
              {athlete.licenseNumber && <LicenseButton license={athlete.licenseNumber} />}
              {athlete.ffaProfileUrl && (
                <a
                  href={athlete.ffaProfileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5"
                  style={{ color: 'var(--nu-acc)' }}
                >
                  Profil FFA
                  <ExternalLink className="size-2.5" />
                </a>
              )}
              {athlete.lastSyncedAt && (
                <span>Synchronisé le {formatSyncDateTime(athlete.lastSyncedAt)}</span>
              )}
            </motion.div>
          </div>

          <div className="flex flex-wrap justify-end gap-[7px]">
            {hasPerformances && (
              <Tool
                href={`/athletes/${athlete.id}/stats`}
                icon={BarChart3}
                label="Stats avancées"
                index={0}
              />
            )}
            <Tool
              href={`/athletes/${athlete.id}/podiums`}
              icon={Trophy}
              label="Podiums"
              index={1}
            />
            {canEditProfile && (
              <Tool
                href={`/athletes/${athlete.id}/edit`}
                icon={Pencil}
                label="Modifier"
                index={2}
              />
            )}
            {hasFfa && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <motion.button
                      type="button"
                      aria-label="Plus d'actions"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: [0.2, 0.9, 0.25, 1], delay: 0.71 }}
                      className="nu-tool inline-flex items-center justify-center rounded-[10px] px-2.5 py-2 transition-colors"
                      style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
                    >
                      <MoreHorizontal className="size-4" />
                    </motion.button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-48">
                  <FfaSyncButtons athleteId={athlete.id} showFullResync={isAdmin} />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile : blocs empilés séparés par un simple trait gris (retour
            Maksen 2026-09-19), plutôt que la grille 2 colonnes précédente qui
            laissait "Objectifs" tout seul sur sa ligne. Desktop (`sm:` et
            plus) : grille à 6 colonnes inchangée, avec ses traits verticaux. */}
        <div
          className="sm:hidden"
          style={{ borderTop: '1px solid var(--nu-line)', background: 'var(--nu-bg)' }}
        >
          <div className="grid grid-cols-2 px-5 py-3.5">
            <MobileStripCell label="Catégorie">
              <b
                className="mt-[7px] block text-[14.5px] whitespace-nowrap"
                style={{ color: 'var(--nu-txt)' }}
              >
                {category ?? '—'}
              </b>
            </MobileStripCell>
            <MobileStripCell label="Profil" bordered>
              <b
                className="mt-[7px] block text-[14.5px] whitespace-nowrap"
                style={{ color: 'var(--nu-txt)' }}
              >
                {age !== null ? `${age} ans` : 'Âge inconnu'}
                {athlete.gender ? ` · ${GENDER_LABELS[athlete.gender] ?? athlete.gender}` : ''}
              </b>
            </MobileStripCell>
          </div>
          <div style={{ borderTop: '1px solid var(--nu-line)' }} />
          <div className="px-5 py-3.5">
            <MobileStripCell label="Disciplines">
              <div className="mt-[9px] flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                {athlete.disciplines.length === 0 && (
                  <span className="text-[13px]" style={{ color: 'var(--nu-dim)' }}>
                    —
                  </span>
                )}
                {athlete.disciplines.map((d, i) => {
                  const color = athlete.disciplineColors[d] ?? defaultDisciplineColor(i)
                  return (
                    <span
                      key={d}
                      className="inline-flex items-center gap-[7px] text-[13px]"
                      style={{ color: 'var(--nu-dim)' }}
                    >
                      <span
                        className="size-[7px] shrink-0 rounded-full"
                        style={{ background: color }}
                      />
                      {DISCIPLINE_LABELS[d] ?? d}
                    </span>
                  )
                })}
              </div>
            </MobileStripCell>
          </div>
          <div style={{ borderTop: '1px solid var(--nu-line)' }} />
          <div className="grid grid-cols-3 px-5 py-3.5">
            <MobileStripCell label="Séances">
              <CountUp
                value={sessionsCount}
                className="nu-num mt-[5px] block text-[22px] font-bold"
                style={{ color: 'var(--nu-txt)' }}
              />
            </MobileStripCell>
            <MobileStripCell label="Performances" bordered>
              <CountUp
                value={athlete.performances.length}
                className="nu-num mt-[5px] block text-[22px] font-bold"
                style={{ color: 'var(--nu-txt)' }}
              />
            </MobileStripCell>
            <MobileStripCell label="Objectifs" bordered>
              <CountUp
                value={athlete.goals.length}
                className="nu-num mt-[5px] block text-[22px] font-bold"
                style={{ color: 'var(--nu-txt)' }}
              />
            </MobileStripCell>
          </div>
        </div>

        <div
          className="hidden sm:grid sm:[grid-template-columns:auto_auto_minmax(0,1fr)_auto_auto_auto]"
          style={{ borderTop: '1px solid var(--nu-line)', background: 'var(--nu-bg)' }}
        >
          <StripCell index={0} label="Catégorie">
            <b
              className="mt-[7px] block text-[14.5px] whitespace-nowrap"
              style={{ color: 'var(--nu-txt)' }}
            >
              {category ?? '—'}
            </b>
          </StripCell>
          <StripCell index={1} label="Profil">
            <b
              className="mt-[7px] block text-[14.5px] whitespace-nowrap"
              style={{ color: 'var(--nu-txt)' }}
            >
              {age !== null ? `${age} ans` : 'Âge inconnu'}
              {athlete.gender ? ` · ${GENDER_LABELS[athlete.gender] ?? athlete.gender}` : ''}
            </b>
          </StripCell>
          <StripCell index={2} label="Disciplines">
            <div className="mt-[9px] flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
              {athlete.disciplines.length === 0 && (
                <span className="text-[13px]" style={{ color: 'var(--nu-dim)' }}>
                  —
                </span>
              )}
              {athlete.disciplines.map((d, i) => {
                const color = athlete.disciplineColors[d] ?? defaultDisciplineColor(i)
                return (
                  <span
                    key={d}
                    className="inline-flex items-center gap-[7px] text-[13px]"
                    style={{ color: 'var(--nu-dim)' }}
                  >
                    <span
                      className="size-[7px] shrink-0 rounded-full"
                      style={{ background: color }}
                    />
                    {DISCIPLINE_LABELS[d] ?? d}
                  </span>
                )
              })}
            </div>
          </StripCell>
          <StripCell index={3} label="Séances">
            <CountUp
              value={sessionsCount}
              className="nu-num mt-[5px] block text-[22px] font-bold"
              style={{ color: 'var(--nu-txt)' }}
            />
          </StripCell>
          <StripCell index={4} label="Performances">
            <CountUp
              value={athlete.performances.length}
              className="nu-num mt-[5px] block text-[22px] font-bold"
              style={{ color: 'var(--nu-txt)' }}
            />
          </StripCell>
          <StripCell index={5} label="Objectifs">
            <CountUp
              value={athlete.goals.length}
              className="nu-num mt-[5px] block text-[22px] font-bold"
              style={{ color: 'var(--nu-txt)' }}
            />
          </StripCell>
        </div>
      </div>
    </div>
  )
}
