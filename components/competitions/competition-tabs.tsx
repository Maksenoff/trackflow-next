'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, FileText, Info, Link as LinkIcon, Plus, Users } from 'lucide-react'
import { RegistrationRow } from '@/components/competitions/registration-row'
import {
  RegistrationDialog,
  type RegistrationAthleteOption,
} from '@/components/competitions/registration-dialog'
import { cn } from '@/lib/utils'
import type { CompetitionDetail } from '@/lib/competitions-data'

type Registration = CompetitionDetail['registrations'][number]
type TabKey = 'infos' | 'registrations'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function CompetitionTabs({
  competition,
  canManage,
  linkedAthleteId,
  registrationAthletes,
}: {
  competition: CompetitionDetail
  canManage: boolean
  linkedAthleteId: string | null
  registrationAthletes: RegistrationAthleteOption[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null)

  const canRegisterSelf = !canManage && !!linkedAthleteId
  const canAddRegistration = canManage || (canRegisterSelf && !editingRegistration)
  const color = competition.competitionType?.color ?? '#f59e0b'

  const tabs = [
    { key: 'infos' as const, label: 'Infos pratiques', icon: Info },
    {
      key: 'registrations' as const,
      label: 'Inscriptions',
      icon: Users,
      badge: competition.registrations.length,
    },
  ]

  const [active, setActive] = useState<TabKey>('infos')
  const [direction, setDirection] = useState(1)

  function switchTo(key: TabKey) {
    if (key === active) return
    const from = tabs.findIndex((t) => t.key === active)
    const to = tabs.findIndex((t) => t.key === key)
    setDirection(to > from ? 1 : -1)
    setActive(key)
  }

  function openCreate() {
    setEditingRegistration(null)
    setDialogOpen(true)
  }

  function openEdit(registration: Registration) {
    setEditingRegistration(registration)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 shadow-sm">
        {tabs.map((t) => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTo(t.key)}
              aria-current={isActive}
              className={cn(
                'relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="competition-tab-active"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-sm shadow-primary/30"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              )}
              <t.icon className="size-3.5" />
              {t.label}
              {t.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] font-bold',
                    isActive ? 'bg-white/20' : 'bg-muted'
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={active}
          custom={direction}
          initial={{ x: direction * 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -16, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {active === 'infos' && (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-5 py-3">
                  <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Ressources
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  <ResourceRow
                    icon={LinkIcon}
                    label="Site officiel"
                    value={competition.websiteUrl}
                    editHref={`/competitions/${competition.id}/edit`}
                    addLabel="Ajouter un lien"
                    color={color}
                    external
                  />
                  <ResourceRow
                    icon={FileText}
                    label="Circulaire"
                    value={competition.documentUrl}
                    editHref={`/competitions/${competition.id}/edit`}
                    addLabel="Ajouter une circulaire"
                    color={color}
                  />
                  <ResourceRow
                    icon={Clock}
                    label="Horaires"
                    value={competition.schedulesUrl}
                    editHref={`/competitions/${competition.id}/edit`}
                    addLabel="Ajouter les horaires"
                    color={color}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Notes
                  </h2>
                  {canManage && (
                    <Link
                      href={`/competitions/${competition.id}/edit`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Modifier
                    </Link>
                  )}
                </div>
                <div className="p-5">
                  {competition.description ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                      {competition.description}
                    </p>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">Aucune note.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {active === 'registrations' && (
            <div className="space-y-3">
              {competition.registrations.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-sm">
                  <Users className="mx-auto mb-2 size-7 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aucun inscrit pour l&apos;instant.
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 gap-3 lg:grid-cols-2"
                >
                  {competition.registrations.map((reg) => (
                    <motion.div key={reg.id} variants={itemVariants}>
                      <RegistrationRow
                        registration={reg}
                        competitionId={competition.id}
                        isSelf={reg.athleteId === linkedAthleteId}
                        canManage={canManage}
                        onEdit={() => openEdit(reg)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {canAddRegistration && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--accent)]"
                  style={{ '--accent': color } as CSSProperties}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}66`)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
                >
                  <Plus className="size-4" />
                  Ajouter une inscription
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <RegistrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        competitionId={competition.id}
        availableDisciplines={competition.availableDisciplines}
        requestExpectedPerf={competition.requestExpectedPerf}
        canManage={canManage}
        athletes={
          canManage ? registrationAthletes : linkedAthleteId ? registrationAthletes : undefined
        }
        registrationId={editingRegistration?.id}
        athleteId={editingRegistration?.athleteId ?? linkedAthleteId ?? undefined}
        athleteName={
          editingRegistration
            ? `${editingRegistration.athlete.firstName} ${editingRegistration.athlete.lastName}`
            : undefined
        }
        initialData={
          editingRegistration
            ? {
                disciplines: JSON.parse(editingRegistration.disciplines) as string[],
                ffaRegistered: editingRegistration.ffaRegistered,
                expectedPerformances: editingRegistration.expectedPerformances
                  ? (JSON.parse(editingRegistration.expectedPerformances) as Record<string, string>)
                  : null,
              }
            : undefined
        }
      />
    </div>
  )
}

function ResourceRow({
  icon: Icon,
  label,
  value,
  editHref,
  addLabel,
  color,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | null
  editHref: string
  addLabel: string
  color: string
  external?: boolean
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        {value ? (
          external ? (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-sm font-medium text-primary hover:underline"
            >
              {value}
            </a>
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-sm font-medium text-primary hover:underline"
            >
              Voir le document
            </a>
          )
        ) : (
          <Link
            href={editHref}
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            {addLabel} →
          </Link>
        )}
      </div>
    </div>
  )
}
