'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, FileText, Info, Link as LinkIcon, Plus, Users } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RegistrationRow } from '@/components/competitions/registration-row'
import {
  RegistrationDialog,
  type RegistrationAthleteOption,
} from '@/components/competitions/registration-dialog'
import type { CompetitionDetail } from '@/lib/competitions-data'

type Registration = CompetitionDetail['registrations'][number]

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

  function openCreate() {
    setEditingRegistration(null)
    setDialogOpen(true)
  }

  function openEdit(registration: Registration) {
    setEditingRegistration(registration)
    setDialogOpen(true)
  }

  return (
    <Tabs defaultValue="infos" className="gap-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
        <TabsTrigger
          value="infos"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <Info className="size-3.5" />
          Infos pratiques
        </TabsTrigger>
        <TabsTrigger
          value="registrations"
          className="gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 data-active:border-primary/40 data-active:bg-primary/10"
        >
          <Users className="size-3.5" />
          Inscriptions
          <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold">
            {competition.registrations.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="infos">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2"
        >
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
        </motion.div>
      </TabsContent>

      <TabsContent value="registrations" className="space-y-3">
        {competition.registrations.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-10 text-center shadow-sm">
            <Users className="mx-auto mb-2 size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucun inscrit pour l&apos;instant.</p>
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
      </TabsContent>

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
    </Tabs>
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
