'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, UsersRound, Hash, Route, History, MapPin, Medal, Timer } from 'lucide-react'
import { fullName } from '@/lib/athlete'
import { DISCIPLINE_LABELS } from '@/lib/disciplines'
import { legibleAccent } from '@/lib/color-contrast'
import { DeleteTeamButton } from '@/components/teams/delete-team-button'
import type { TeamDetail, TeamDetailMember } from '@/lib/teams-data'

const BATON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 18l12-12" />
    <path d="M4.5 19.5a2.2 2.2 0 0 1 0-3l1.5-1.5 3 3-1.5 1.5a2.2 2.2 0 0 1-3 0z" />
    <path d="M19.5 4.5a2.2 2.2 0 0 0-3 0L15 6l3 3 1.5-1.5a2.2 2.2 0 0 0 0-3z" />
  </svg>
)

function MemberAvatar({
  member,
  size = 46,
  radius = 15,
}: {
  member: TeamDetailMember
  size?: number
  radius?: number
}) {
  if (member.photoUrl) {
    return (
      <div
        className="shrink-0 overflow-hidden"
        style={{ width: size, height: size, borderRadius: radius, background: 'var(--nu-surf2)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.photoUrl}
          alt=""
          className="size-full object-cover"
          style={{
            objectPosition: `${member.photoConfig.x ?? 50}% ${member.photoConfig.y ?? 50}%`,
            transform: `scale(${member.photoConfig.zoom ?? 1})`,
          }}
        />
      </div>
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center text-[12px] font-bold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'var(--nu-surf2)',
        color: 'var(--nu-dim)',
      }}
    >
      {`${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase()}
    </div>
  )
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function NewTeamDetail({
  team,
  canManage,
  isTeamMember,
  canDelete,
  clubCode,
}: {
  team: TeamDetail
  canManage: boolean
  isTeamMember: boolean
  canDelete: boolean
  clubCode: string | null
}) {
  const canEditData = canManage || isTeamMember
  const [tab, setTab] = useState<'relay' | 'history'>('relay')
  const tone = team.color ?? 'var(--nu-acc)'

  const slots = team.members
    .filter((m) => m.relayOrder != null)
    .sort((a, b) => (a.relayOrder ?? 0) - (b.relayOrder ?? 0))
  const bench = team.members.filter((m) => m.relayOrder == null)
  const progress = Math.round((Math.min(slots.length, 4) / 4) * 100)

  return (
    <div>
      <header
        className="relative grid items-center gap-[22px] overflow-hidden rounded-[22px] p-[22px_24px] max-[900px]:grid-cols-[auto_1fr]"
        style={{
          gridTemplateColumns: 'auto minmax(0,1fr) auto',
          background: 'var(--nu-surf)',
          border: '1px solid var(--nu-line)',
          boxShadow: 'inset 0 1px 0 var(--nu-rim)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            color: tone,
            opacity: 0.1,
            background: 'radial-gradient(120% 130% at 0 0, currentColor, transparent 58%)',
          }}
        />

        <div
          className="relative z-[1] size-[82px] shrink-0 overflow-hidden rounded-[22px]"
          style={{ background: 'var(--nu-surf2)', border: '1px solid var(--nu-line)' }}
        >
          {team.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.photoUrl}
              alt=""
              className="size-full object-cover"
              style={{
                objectPosition: `${team.photoConfig.x ?? 50}% ${team.photoConfig.y ?? 50}%`,
                transform: `scale(${team.photoConfig.zoom ?? 1})`,
              }}
            />
          ) : (
            <div className="flex size-full items-center justify-center" style={{ color: tone }}>
              <UsersRound className="size-8" />
            </div>
          )}
        </div>

        <div className="relative z-[1] min-w-0">
          <h1
            className="text-[clamp(24px,2.6vw,32px)] font-extrabold tracking-[-0.03em]"
            style={{ color: 'var(--nu-txt)' }}
          >
            {team.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {team.discipline && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                style={{
                  color: legibleAccent(/^#[0-9a-fA-F]{6}$/.test(tone) ? tone : '#8E99A6'),
                  background: `color-mix(in srgb, ${tone} 16%, transparent)`,
                }}
              >
                {DISCIPLINE_LABELS[team.discipline] ?? team.discipline}
              </span>
            )}
            {clubCode && (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{
                  background: 'color-mix(in srgb, var(--nu-acc) 12%, transparent)',
                  color: 'var(--nu-acc)',
                }}
              >
                <Hash className="size-3.5" />
                Club <span className="font-mono font-extrabold">{clubCode}</span>
              </span>
            )}
          </div>
        </div>

        <div className="relative z-[1] flex shrink-0 items-center gap-2 max-[900px]:col-span-2 max-[900px]:justify-start">
          {canEditData && (
            <Link
              href={`/teams/${team.id}/edit`}
              className="nu-tool inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors"
              style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
            >
              <Pencil className="size-3.5" />
              Modifier
            </Link>
          )}
          {canDelete && <DeleteTeamButton teamId={team.id} />}
        </div>
      </header>

      <div className="my-[22px] flex flex-wrap items-center gap-4">
        <span className="text-[12.5px] whitespace-nowrap" style={{ color: 'var(--nu-dim)' }}>
          <b className="tabular-nums" style={{ color: 'var(--nu-txt)' }}>
            {slots.length}
          </b>{' '}
          relayeur{slots.length > 1 ? 's' : ''} sur 4
        </span>
        <span
          className="h-[6px] min-w-[140px] flex-1 overflow-hidden rounded-full"
          style={{ background: 'var(--nu-surf2)' }}
        >
          <span
            className="block h-full rounded-full transition-[width] duration-1000 ease-out"
            style={{ width: `${progress}%`, background: tone }}
          />
        </span>
        {slots.length < 4 && (
          <span className="text-[12.5px] whitespace-nowrap" style={{ color: 'var(--nu-dim)' }}>
            {4 - slots.length} place{4 - slots.length > 1 ? 's' : ''} à pourvoir
          </span>
        )}
      </div>

      <nav
        className="relative mb-[22px] flex gap-0.5 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--nu-line)' }}
      >
        {[
          { key: 'relay' as const, label: 'Relais', icon: Route },
          {
            key: 'history' as const,
            label: 'Historique',
            icon: History,
            count: team.performances.length,
          },
        ].map((t) => {
          const active = t.key === tab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="relative inline-flex shrink-0 items-center gap-2 px-4.5 py-3.5 text-[13.5px] whitespace-nowrap transition-colors"
              style={{
                color: active ? 'var(--nu-txt)' : 'var(--nu-dim)',
                fontWeight: active ? 680 : 400,
              }}
            >
              <t.icon
                className="size-[15px]"
                style={active ? { color: 'var(--nu-acc)' } : undefined}
              />
              {t.label}
              {t.count !== undefined && (
                <span
                  className="rounded-full px-[7px] py-0.5 text-[10.5px]"
                  style={{ background: 'var(--nu-surf)', color: 'var(--nu-dim)' }}
                >
                  {t.count}
                </span>
              )}
              {active && (
                <motion.span
                  layoutId="new-team-tab-ink"
                  className="absolute inset-x-4.5 -bottom-px h-[2px] rounded-[2px]"
                  style={{ background: 'var(--nu-acc)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          )
        })}
      </nav>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'relay' ? (
          <motion.div
            key="relay"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {slots.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-2xl py-12 text-center"
                style={{ border: '1px dashed var(--nu-line)', background: 'var(--nu-surf)' }}
              >
                <UsersRound className="size-8" style={{ color: 'var(--nu-dim)' }} />
                <p className="text-sm" style={{ color: 'var(--nu-dim)' }}>
                  Aucun athlète positionné.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {slots.map((m, i) => (
                  <div key={m.id}>
                    <div
                      className="relative grid items-center gap-4 rounded-2xl p-3.5 opacity-0"
                      style={{
                        gridTemplateColumns: '38px 46px minmax(0,1fr)',
                        background: 'var(--nu-surf)',
                        border: '1px solid var(--nu-line)',
                        boxShadow: 'inset 0 1px 0 var(--nu-rim)',
                        transform: 'translateY(12px)',
                        animation: `nu-rise .45s cubic-bezier(.2,.9,.25,1) forwards`,
                        animationDelay: `${i * 90}ms`,
                      }}
                    >
                      <span
                        className="relative isolate flex size-[34px] items-center justify-center rounded-xl text-[13px] font-black tabular-nums"
                        style={{ color: tone }}
                      >
                        <span
                          aria-hidden
                          className="absolute inset-0 -z-[1] rounded-xl"
                          style={{ background: tone, opacity: 0.16 }}
                        />
                        {m.relayOrder}
                      </span>
                      {m.isGuest ? (
                        <MemberAvatar member={m} />
                      ) : (
                        <Link href={`/athletes/${m.id}`} className="shrink-0">
                          <MemberAvatar member={m} />
                        </Link>
                      )}
                      <div className="min-w-0">
                        <div
                          className="flex items-center gap-2 text-[15px] font-semibold"
                          style={{ color: 'var(--nu-txt)' }}
                        >
                          <span className="truncate">{fullName(m.firstName, m.lastName)}</span>
                          {m.isGuest && (
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-[0.08em] uppercase"
                              style={{ background: 'var(--nu-surf2)', color: 'var(--nu-dim)' }}
                            >
                              Invité
                            </span>
                          )}
                        </div>
                        <span
                          className="mt-1 block text-xs tabular-nums"
                          style={{ color: 'var(--nu-dim)' }}
                        >
                          {m.isGuest
                            ? 'Sans licence enregistrée'
                            : m.licenseNumber
                              ? `Licence ${m.licenseNumber}`
                              : 'Sans licence renseignée'}
                        </span>
                      </div>
                    </div>

                    {i < slots.length - 1 && (
                      <div
                        className="grid items-center gap-4 px-3.5 py-1 opacity-0"
                        style={{
                          gridTemplateColumns: '38px minmax(0,1fr)',
                          animation: `nu-rise .45s cubic-bezier(.2,.9,.25,1) forwards`,
                          animationDelay: `${i * 90 + 45}ms`,
                        }}
                      >
                        <span
                          className="justify-self-center h-[30px] w-[2px] rounded-full"
                          style={{
                            background:
                              'repeating-linear-gradient(180deg, var(--nu-line) 0 5px, transparent 5px 10px)',
                          }}
                        />
                        <span
                          className="inline-flex items-center gap-2 text-[12.5px]"
                          style={{ color: 'var(--nu-dim)' }}
                        >
                          <span className="size-3.5" style={{ color: tone }}>
                            {BATON}
                          </span>
                          {m.handoffMark ? (
                            <b style={{ color: 'var(--nu-txt)', fontWeight: 640 }}>
                              {m.handoffMark}
                            </b>
                          ) : (
                            <span className="italic opacity-70">Marque non renseignée</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {bench.length > 0 && (
              <div className="mt-6">
                <h2
                  className="mb-3 text-xs font-bold tracking-wide uppercase"
                  style={{ color: 'var(--nu-dim)' }}
                >
                  Remplaçants
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {bench.map((m) => {
                    const content = (
                      <>
                        <MemberAvatar member={m} size={40} radius={13} />
                        <div className="min-w-0">
                          <div
                            className="truncate text-sm font-semibold"
                            style={{ color: 'var(--nu-txt)' }}
                          >
                            {fullName(m.firstName, m.lastName)}
                          </div>
                          {m.isGuest ? (
                            <div className="truncate text-xs" style={{ color: 'var(--nu-dim)' }}>
                              Invité
                            </div>
                          ) : (
                            m.licenseNumber && (
                              <div
                                className="truncate text-xs tabular-nums"
                                style={{ color: 'var(--nu-dim)' }}
                              >
                                Licence{' '}
                                <span className="font-mono font-bold">{m.licenseNumber}</span>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )
                    const cls = 'flex items-center gap-3 rounded-2xl p-3'
                    return m.isGuest ? (
                      <div
                        key={m.id}
                        className={cls}
                        style={{
                          border: '1px dashed var(--nu-line)',
                          background: 'var(--nu-surf)',
                        }}
                      >
                        {content}
                      </div>
                    ) : (
                      <Link
                        key={m.id}
                        href={`/athletes/${m.id}`}
                        className={`${cls} transition-colors`}
                        style={{ border: '1px solid var(--nu-line)', background: 'var(--nu-surf)' }}
                      >
                        {content}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {team.performances.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-2xl py-12 text-center"
                style={{ border: '1px dashed var(--nu-line)', background: 'var(--nu-surf)' }}
              >
                <Timer className="size-8" style={{ color: 'var(--nu-dim)' }} />
                <p className="text-sm" style={{ color: 'var(--nu-dim)' }}>
                  Aucune course enregistrée pour cette équipe.
                </p>
              </div>
            ) : (
              team.performances.map((p, i) => (
                <div
                  key={p.id}
                  className="grid items-center gap-4 rounded-2xl p-4 opacity-0 max-[719px]:grid-cols-1"
                  style={{
                    gridTemplateColumns: 'minmax(0,1fr) auto',
                    background: 'var(--nu-surf)',
                    border: '1px solid var(--nu-line)',
                    boxShadow: 'inset 0 1px 0 var(--nu-rim)',
                    transform: 'translateY(12px)',
                    animation: `nu-rise .45s cubic-bezier(.2,.9,.25,1) forwards`,
                    animationDelay: `${i * 70}ms`,
                  }}
                >
                  <div className="min-w-0">
                    <h4
                      className="truncate text-[15px] font-semibold"
                      style={{ color: 'var(--nu-txt)' }}
                    >
                      {p.location || 'Compétition'}
                    </h4>
                    <div
                      className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]"
                      style={{ color: 'var(--nu-dim)' }}
                    >
                      <span>{formatDate(p.date)}</span>
                      {p.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {p.location}
                        </span>
                      )}
                      {p.place != null && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold"
                          style={{
                            background:
                              'color-mix(in srgb, var(--nu-pb, #FFC93C) 18%, transparent)',
                            color: 'var(--nu-pb, #FFC93C)',
                          }}
                        >
                          <Medal className="size-3" />
                          {p.place}
                          <sup>{p.place === 1 ? 'er' : 'e'}</sup>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right max-[719px]:text-left">
                    <b
                      className="block text-[22px] leading-none font-extrabold tracking-[-0.03em] tabular-nums"
                      style={{ color: tone }}
                    >
                      {p.time}
                    </b>
                    <span
                      className="mt-1.5 block text-[9.5px] font-semibold tracking-[0.11em] uppercase"
                      style={{ color: 'var(--nu-dim)' }}
                    >
                      Temps de l&apos;équipe
                    </span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
