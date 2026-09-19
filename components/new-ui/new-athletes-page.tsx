'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Search, Users } from 'lucide-react'
import { calcAge, fullName, initials, GENDER_LABELS } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { CountUp } from '@/components/new-ui/count-up'
import type { AthleteCardData } from '@/components/athletes/athlete-card'

/** Halo qui suit le curseur — même pattern que new-hero.tsx, dupliqué ici
 *  plutôt que partagé (petit hook, pas de logique métier commune). */
function onCardMouseMove(e: React.MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--nu-mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--nu-my', `${e.clientY - r.top}px`)
}

function RestDisciplines({ labels }: { labels: string[] }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          // Le badge vit dans le <Link> de la card : sans ça un tap navigue
          // vers la fiche au lieu d'ouvrir la liste des disciplines restantes.
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap"
        style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
      >
        +{labels.length}
      </span>
      {open && (
        <span
          className="absolute top-full left-0 z-[4] mt-1.5 flex max-w-[220px] flex-wrap gap-1 rounded-[10px] p-2 shadow-lg"
          style={{ background: 'var(--nu-surf2)', border: '1px solid var(--nu-line)' }}
        >
          {labels.map((label) => (
            <span
              key={label}
              className="rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap"
              style={{ background: 'var(--nu-bg)', color: 'var(--nu-txt)' }}
            >
              {label}
            </span>
          ))}
        </span>
      )}
    </span>
  )
}

function AthleteTile({ athlete, index }: { athlete: AthleteCardData; index: number }) {
  const age = calcAge(athlete.birthDate)
  const shown = athlete.disciplines.slice(0, 2)
  const restLabels = athlete.disciplines.slice(2).map((d) => DISCIPLINE_LABELS[d] ?? d)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.975 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.2, 0.9, 0.25, 1], delay: Math.min(index, 12) * 0.045 }}
    >
      <Link
        href={`/athletes/${athlete.id}`}
        onMouseMove={onCardMouseMove}
        className="group relative flex h-[196px] overflow-hidden rounded-[18px]"
        style={{
          background: 'var(--nu-surf)',
          border: '1px solid var(--nu-line)',
          boxShadow: 'inset 0 1px 0 var(--nu-rim)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(300px circle at var(--nu-mx, 50%) var(--nu-my, 50%), color-mix(in srgb, var(--nu-acc) 16%, transparent), transparent 66%)',
          }}
        />

        <div
          className="relative z-[2] w-[96px] shrink-0 overflow-hidden sm:w-[114px]"
          style={{ background: 'var(--nu-surf2)' }}
        >
          {athlete.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={athlete.photoUrl}
              alt=""
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
              style={{
                objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
              }}
            />
          ) : (
            <div
              className="flex size-full items-center justify-center text-[32px] opacity-55 transition-[opacity,transform] duration-300 group-hover:scale-[1.06] group-hover:opacity-100"
              style={{ color: 'var(--nu-acc)' }}
            >
              <span className="nu-it">{initials(athlete.firstName, athlete.lastName)}</span>
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.14] transition-opacity duration-300 group-hover:opacity-[0.24]"
            style={{ background: `linear-gradient(180deg, transparent 40%, var(--nu-acc))` }}
          />
        </div>

        <ArrowRight
          className="absolute top-[17px] right-[17px] z-[3] size-4 -translate-x-1.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
          style={{ color: 'var(--nu-acc)' }}
        />

        <div className="relative z-[2] flex min-w-0 flex-1 flex-col px-[19px] py-[17px]">
          <div
            className="truncate text-[17px] font-semibold tracking-[-0.015em]"
            style={{ color: 'var(--nu-txt)' }}
          >
            {fullName(athlete.firstName, athlete.lastName)}
          </div>
          <div className="mt-1 text-xs" style={{ color: 'var(--nu-dim)' }}>
            {age !== null ? `${age} ans` : 'Âge inconnu'}
            {athlete.gender && ` · ${GENDER_LABELS[athlete.gender] ?? athlete.gender}`}
          </div>

          {shown.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {shown.map((d) => (
                <span
                  key={d}
                  className="rounded-full px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors"
                  style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
                >
                  {DISCIPLINE_LABELS[d] ?? d}
                </span>
              ))}
              {restLabels.length > 0 && <RestDisciplines labels={restLabels} />}
            </div>
          )}

          <div
            className="mt-4 flex items-end gap-[22px] pt-[15px]"
            style={{ borderTop: '1px solid var(--nu-line)' }}
          >
            <Stat value={athlete.performancesCount} label="Perfs" big />
            <Stat value={athlete.sessionsCount} label="Séances" />
            <Stat value={athlete.goalsCount} label="Objectifs" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function Stat({ value, label, big }: { value: number; label: string; big?: boolean }) {
  return (
    <div>
      <CountUp
        value={value}
        className="nu-num block leading-[0.9] font-bold"
        style={{
          fontSize: big ? 27 : 17,
          color: big ? 'var(--nu-acc)' : 'var(--nu-txt)',
          opacity: !big && value === 0 ? 0.55 : 1,
        }}
      />
      <span
        className="mt-1 block text-[9.5px] font-semibold tracking-[0.11em] uppercase"
        style={{ color: 'var(--nu-dim)' }}
      >
        {label}
      </span>
    </div>
  )
}

export function NewAthletesPage({
  athletes,
  canManage,
  roleLabel,
}: {
  athletes: AthleteCardData[]
  canManage: boolean
  roleLabel: string | null
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return athletes
    return athletes.filter((a) => fullName(a.firstName, a.lastName).toLowerCase().includes(q))
  }, [athletes, query])

  return (
    <div>
      <div className="mb-[26px] flex flex-wrap items-end justify-between gap-[26px]">
        {/* Masqué sur mobile : redondant avec la nav (déjà sur "Athlètes"),
            même traitement que le reste de l'app classique (retour Maksen
            2026-09-18). */}
        <div className="hidden sm:block">
          <h1 className="nu-it text-[40px]" style={{ color: 'var(--nu-txt)' }}>
            Athlètes
          </h1>
          <div
            className="mt-3 flex flex-wrap items-center gap-3 text-sm"
            style={{ color: 'var(--nu-dim)' }}
          >
            <span>
              <CountUp value={athletes.length} className="nu-num" /> athlète
              {athletes.length > 1 ? 's' : ''} suivi
              {athletes.length > 1 ? 's' : ''}
            </span>
            {roleLabel && (
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] uppercase"
                style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
              >
                {roleLabel}
              </span>
            )}
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <label
            className="nu-search flex h-[42px] min-w-0 items-center gap-[9px] rounded-[11px] px-[13px] transition-[border-color,box-shadow] sm:min-w-[280px]"
            style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
          >
            <Search
              className="nu-search-icon size-[15px] shrink-0"
              style={{ color: 'var(--nu-dim)' }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un athlète..."
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none"
              style={{ color: 'var(--nu-txt)' }}
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-2xl py-20 text-center"
          style={{ background: 'var(--nu-surf)', border: '1px solid var(--nu-line)' }}
        >
          <Users className="size-8" style={{ color: 'var(--nu-dim)' }} />
          <p className="text-sm" style={{ color: 'var(--nu-dim)' }}>
            {query
              ? `Aucun athlète ne correspond à « ${query} ».`
              : 'Aucun athlète pour le moment.'}
          </p>
          {canManage && !query && (
            <Link
              href="/athletes/new"
              className="nu-sheen mt-1 rounded-full px-4 py-2 text-xs font-semibold"
              style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
            >
              + Nouvel athlète
            </Link>
          )}
        </div>
      ) : (
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))' }}
        >
          {filtered.map((athlete, i) => (
            <AthleteTile key={athlete.id} athlete={athlete} index={i} />
          ))}
          {canManage && !query && (
            <Link
              href="/athletes/new"
              className="nu-add-tile grid h-[196px] place-items-center rounded-[18px] text-[13.5px] font-semibold"
            >
              + Nouvel athlète
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
