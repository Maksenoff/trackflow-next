'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { formatDuration, formatTime, relativeDayLabel } from '@/lib/date'
import type { CompetitionWidgetItem, SessionWidgetItem } from '@/lib/dashboard'
import { TrackBendArt, TrackOvalArt } from '@/components/new-ui/track-art'
import { CountUp } from '@/components/new-ui/count-up'

/** Halo qui suit le curseur (repris de `.hero .halo` / `.side .halo` du
 *  mockup) — les coordonnées sont posées sur l'élément survolé via
 *  onMouseMove, l'opacité gérée en CSS par `group-hover`. */
function useGlow() {
  return {
    onMouseMove(e: React.MouseEvent<HTMLElement>) {
      const r = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty('--nu-mx', `${e.clientX - r.left}px`)
      e.currentTarget.style.setProperty('--nu-my', `${e.clientY - r.top}px`)
    },
  }
}

function Halo({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background: `radial-gradient(${size}px circle at var(--nu-mx, 50%) var(--nu-my, 50%), color-mix(in srgb, var(--nu-acc) 16%, transparent), transparent 62%)`,
      }}
    />
  )
}

export type HeroData =
  | {
      kind: 'session-progress'
      session: SessionWidgetItem
      progressPct: number
      minutesLeft: number
    }
  | { kind: 'session-next'; session: SessionWidgetItem }
  | { kind: 'competition'; competition: CompetitionWidgetItem; daysLeft: number }
  | { kind: 'empty' }

function HeroShell({
  href,
  tag,
  title,
  sub,
  foot,
  corner,
  art,
  progressPct,
}: {
  href: string
  tag: React.ReactNode
  title: string
  sub?: string | null
  foot: React.ReactNode
  corner: React.ReactNode
  art: React.ReactNode
  progressPct?: number
}) {
  const glow = useGlow()
  return (
    <Link
      href={href}
      onMouseMove={glow.onMouseMove}
      className="group relative grid min-h-full grid-cols-1 gap-8 overflow-hidden rounded-[22px] p-8 sm:grid-cols-[minmax(0,1fr)_auto]"
      style={{
        background: 'var(--nu-surf)',
        border: '1px solid var(--nu-line)',
        boxShadow: 'inset 0 1px 0 var(--nu-rim)',
      }}
    >
      <Halo size={340} />
      {art}
      <ArrowRight
        className="absolute top-8 right-8 size-[18px] -translate-x-1.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        style={{ color: 'var(--nu-acc)' }}
      />
      <div className="relative z-10 flex min-w-0 flex-col">
        <span
          className="inline-flex items-center gap-2 text-[11.5px] font-bold tracking-wide uppercase"
          style={{ color: 'var(--nu-acc)' }}
        >
          <span className="relative flex size-2">
            <span
              className="absolute inline-flex size-full animate-ping rounded-full opacity-75"
              style={{ background: 'var(--nu-acc)' }}
            />
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{ background: 'var(--nu-acc)' }}
            />
          </span>
          {tag}
        </span>
        <h2
          className="nu-it mt-4 max-w-[15ch] text-[clamp(28px,3.9vw,44px)]"
          style={{ color: 'var(--nu-txt)' }}
        >
          {title}
        </h2>
        {sub && (
          <p
            className="mt-4 max-w-[58ch] text-[14.5px] leading-[1.7]"
            style={{ color: 'var(--nu-dim)' }}
          >
            {sub}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end gap-8 pt-7">{foot}</div>
      </div>
      <div className="relative z-10 flex flex-col items-start text-left sm:items-end sm:text-right">
        {corner}
      </div>
      {progressPct !== undefined && (
        <div
          className="absolute inset-x-0 bottom-0 z-10 h-[3px]"
          style={{ background: 'var(--nu-line)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'var(--nu-acc)' }}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: [0.2, 0.9, 0.25, 1] }}
          />
        </div>
      )}
    </Link>
  )
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="nu-num text-xl font-bold" style={{ color: 'var(--nu-txt)' }}>
        {value}
      </div>
      <div
        className="mt-1 text-[10.5px] font-semibold tracking-[0.1em] uppercase"
        style={{ color: 'var(--nu-dim)' }}
      >
        {label}
      </div>
    </div>
  )
}

function TypeChip({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-[7px] rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span className="size-[7px] shrink-0 rounded-full" style={{ background: color }} />
      {name}
    </span>
  )
}

export function NewHero({ data }: { data: HeroData }) {
  if (data.kind === 'session-progress') {
    const { session, progressPct, minutesLeft } = data
    return (
      <HeroShell
        href={`/sessions/${session.id}`}
        tag="Séance en cours"
        title={session.title}
        sub={session.description}
        art={
          <TrackBendArt
            className="-right-2 -bottom-4 h-[150px] w-[205px] sm:-right-6 sm:-bottom-12 sm:h-[440px] sm:w-[600px]"
            runner={{ path: 'M0 230 H520 A210 210 0 0 0 310 440', durationSeconds: 9 }}
          />
        }
        progressPct={progressPct}
        foot={
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-8">
            {session.startTime && session.durationMinutes && (
              <Kpi
                value={`${formatTime(session.startTime)} – ${formatTime(new Date(session.startTime.getTime() + session.durationMinutes * 60000))}`}
                label="Créneau"
              />
            )}
            {session.trainingType && (
              <TypeChip name={session.trainingType.name} color={session.trainingType.color} />
            )}
          </div>
        }
        corner={
          <>
            <CountUp
              value={minutesLeft}
              className="nu-num text-[clamp(38px,5.6vw,64px)] leading-[0.85]"
              style={{ color: 'var(--nu-txt)' }}
            />
            <div
              className="mt-2 text-[10.5px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: 'var(--nu-dim)' }}
            >
              Minutes restantes
            </div>
          </>
        }
      />
    )
  }

  if (data.kind === 'session-next') {
    const { session } = data
    return (
      <HeroShell
        href={`/sessions/${session.id}`}
        tag={`Prochaine séance · ${relativeDayLabel(session.date).label.toLowerCase()}`}
        title={session.title}
        sub={session.description}
        art={
          <TrackBendArt
            className="-right-2 -bottom-4 h-[150px] w-[205px] sm:-right-6 sm:-bottom-12 sm:h-[440px] sm:w-[600px]"
            runner={{ path: 'M0 230 H520 A210 210 0 0 0 310 440', durationSeconds: 15 }}
          />
        }
        foot={
          <>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-8">
              {session.durationMinutes && (
                <Kpi value={formatDuration(session.durationMinutes)} label="Durée" />
              )}
              {session.trainingType && (
                <TypeChip name={session.trainingType.name} color={session.trainingType.color} />
              )}
            </div>
            {session.coach && (
              <div className="self-start sm:self-auto">
                <Kpi value={session.coach.firstName} label="Créée par" />
              </div>
            )}
          </>
        }
        corner={
          session.startTime ? (
            <>
              <div
                className="nu-num text-[clamp(34px,5.2vw,58px)] leading-[0.85]"
                style={{ color: 'var(--nu-txt)' }}
              >
                {formatTime(session.startTime)}
              </div>
              <div
                className="mt-2 text-[10.5px] font-semibold tracking-[0.1em] uppercase"
                style={{ color: 'var(--nu-dim)' }}
              >
                Début
              </div>
            </>
          ) : null
        }
      />
    )
  }

  if (data.kind === 'competition') {
    const { competition, daysLeft } = data
    return (
      <HeroShell
        href="/calendar?tab=competitions"
        tag={`Prochaine compétition · ${competition.typeLabel}`}
        title={competition.title}
        sub={`${competition.location ?? '—'} · ${competition.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}. ${competition.registrationCount} inscrit${competition.registrationCount > 1 ? 's' : ''} pour le moment.`}
        art={
          <TrackOvalArt
            className="-right-14 -bottom-14 h-[310px] w-[440px]"
            runner={{
              path: 'M138 83 H302 A72 72 0 0 1 302 227 H138 A72 72 0 0 1 138 83 Z',
              durationSeconds: 14,
              fade: false,
              opacity: 0.85,
            }}
          />
        }
        foot={
          <>
            {competition.location && <Kpi value={competition.location} label="Lieu" />}
            <Kpi value={String(competition.registrationCount)} label="Inscrits" />
            <TypeChip name={competition.typeLabel} color={competition.colorBg} />
          </>
        }
        corner={
          <>
            <CountUp
              value={daysLeft}
              className="nu-num text-[clamp(38px,5.6vw,64px)] leading-[0.85]"
              style={{ color: 'var(--nu-txt)' }}
            />
            <div
              className="mt-2 text-[10.5px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: 'var(--nu-dim)' }}
            >
              Jours restants
            </div>
          </>
        }
      />
    )
  }

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-3 rounded-[22px] p-10 text-center"
      style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
    >
      <p className="text-sm" style={{ color: 'var(--nu-dim)' }}>
        Rien de prévu pour l&apos;instant.
      </p>
      <Link
        href="/calendar"
        className="nu-sheen rounded-full px-4 py-2 text-xs font-semibold"
        style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
      >
        Ouvrir le calendrier
      </Link>
    </div>
  )
}

export function NewSideCard({
  competition,
  daysLeft,
}: {
  competition: CompetitionWidgetItem
  daysLeft: number
}) {
  const glow = useGlow()
  return (
    <Link
      href="/calendar?tab=competitions"
      onMouseMove={glow.onMouseMove}
      className="group relative flex min-h-full flex-col overflow-hidden rounded-[22px] p-7"
      style={{
        background: 'var(--nu-surf)',
        border: '1px solid var(--nu-line)',
        boxShadow: 'inset 0 1px 0 var(--nu-rim)',
      }}
    >
      <Halo size={260} />
      <TrackOvalArt className="-right-16 -bottom-12 h-[240px] w-[340px]" />
      <ArrowRight
        className="absolute top-7 right-7 size-4 -translate-x-1.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        style={{ color: 'var(--nu-acc)' }}
      />
      <div className="relative z-10 min-w-0">
        <span
          className="inline-flex items-center gap-2 text-[11px] font-bold tracking-wide uppercase"
          style={{ color: 'var(--nu-acc)' }}
        >
          <span
            className="size-[7px] shrink-0 rounded-full"
            style={{ background: 'var(--nu-acc)' }}
          />
          À venir · Compétition
        </span>
        <h3 className="nu-it mt-3 text-[22px] leading-[1.1]" style={{ color: 'var(--nu-txt)' }}>
          {competition.title}
        </h3>
        <div className="mt-2 text-[13px] leading-[1.6]" style={{ color: 'var(--nu-dim)' }}>
          {competition.location} ·{' '}
          {competition.date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </div>
        <div className="mt-3">
          <TypeChip name={competition.typeLabel} color={competition.colorBg} />
        </div>
      </div>
      <div className="relative z-10 mt-auto flex items-end justify-between gap-4 pt-7">
        <div>
          <span className="nu-num text-xl font-bold" style={{ color: 'var(--nu-txt)' }}>
            <CountUp value={daysLeft} /> j
          </span>
          <div
            className="mt-1 text-[10.5px] font-semibold tracking-[0.1em] uppercase"
            style={{ color: 'var(--nu-dim)' }}
          >
            Restants
          </div>
        </div>
        <div className="text-right text-[12.5px]" style={{ color: 'var(--nu-dim)' }}>
          {competition.registrationCount} inscrit{competition.registrationCount > 1 ? 's' : ''}
        </div>
      </div>
    </Link>
  )
}
