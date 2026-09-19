'use client'

import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Pencil, Trash2, UserRound } from 'lucide-react'
import { formatFullDate } from '@/lib/date'
import { MEDAL_GRADIENTS } from '@/components/athletes/podiums/medal-colors'
import { MedalIcon } from '@/components/athletes/podiums/medal-icon'
import type { PodiumItem, AthleteInfo } from '@/components/athletes/podiums/podiums-view'

const STEP_ORDER = [2, 1, 3] as const
const STEP_HEIGHT_CLASS: Record<number, string> = {
  1: 'nu-step-h-1',
  2: 'nu-step-h-2',
  3: 'nu-step-h-3',
}

function rankOrdinal(rank: number) {
  return rank === 1 ? '1er' : `${rank}ème`
}

async function deletePodium(athleteId: string, podiumId: string) {
  const res = await fetch(`/api/athletes/${athleteId}/podiums/${podiumId}`, { method: 'DELETE' })
  return res.ok
}

export function NewPodiumStage({
  podiums,
  athlete,
  athleteId,
  canEdit,
  index,
  direction,
  onNavigate,
  onEdit,
}: {
  podiums: PodiumItem[]
  athlete: AthleteInfo
  athleteId: string
  canEdit: boolean
  index: number
  direction: number
  onNavigate: (index: number, direction: number) => void
  onEdit: (p: PodiumItem) => void
}) {
  const router = useRouter()
  const current = podiums[index]
  const style = MEDAL_GRADIENTS[(current.rank in MEDAL_GRADIENTS ? current.rank : 3) as 1 | 2 | 3]

  function go(delta: number) {
    onNavigate(Math.min(Math.max(index + delta, 0), podiums.length - 1), delta)
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 && index < podiums.length - 1) go(1)
    else if (info.offset.x > 60 && index > 0) go(-1)
  }

  async function handleDelete() {
    if (!window.confirm('Supprimer ce podium ?')) return
    const ok = await deletePodium(athleteId, current.id)
    if (!ok) {
      toast.error('Suppression impossible.')
      return
    }
    if (index >= podiums.length - 1) onNavigate(Math.max(0, index - 1), -1)
    router.refresh()
  }

  return (
    <div
      className="relative overflow-hidden rounded-[20px] px-5 pt-7 pb-5 sm:px-7"
      style={{
        background: 'var(--nu-surf)',
        border: '1px solid var(--nu-line)',
        boxShadow: 'inset 0 1px 0 var(--nu-rim)',
      }}
    >
      <div className="relative text-center">
        <div
          className="text-[clamp(22px,2.4vw,30px)] font-extrabold tracking-[-0.03em]"
          style={{ color: 'var(--nu-txt)' }}
        >
          {current.discipline}
        </div>
        <div
          className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-2.5 text-[12.5px]"
          style={{ color: 'var(--nu-dim)' }}
        >
          <span>{current.level}</span>
          <i
            className="size-[3px] rounded-full"
            style={{ background: 'currentColor', opacity: 0.5 }}
          />
          <span>{formatFullDate(current.recordedAt)}</span>
          {current.venue && (
            <>
              <i
                className="size-[3px] rounded-full"
                style={{ background: 'currentColor', opacity: 0.5 }}
              />
              <span>{current.venue}</span>
            </>
          )}
        </div>
        <motion.div
          key={`rule-${current.id}`}
          className="mx-auto mt-3.5 h-px w-[min(460px,76%)]"
          style={{
            background: `linear-gradient(90deg, transparent, ${style.ring}, transparent)`,
            opacity: 0.55,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.9, 0.25, 1] }}
        />
      </div>

      <AnimatePresence mode="popLayout" custom={direction} initial={false}>
        <motion.div
          key={current.id}
          custom={direction}
          initial={{ x: direction * 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -40, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="relative touch-pan-y"
        >
          <div
            className="mx-auto mt-7 grid max-w-[600px] items-end"
            style={{ gridTemplateColumns: '1fr 1.14fr 1fr' }}
          >
            {STEP_ORDER.map((rank) => {
              const isOurs = rank === current.rank
              // Le mockup indexe le stagger sur le rang réellement obtenu par
              // l'athlète (d=0, toujours le premier à apparaître) et laisse les
              // deux autres marches sur leur index de rang naturel (rank-1) —
              // pas sur leur position de colonne à l'écran (silver/gold/bronze).
              const d = isOurs ? 0 : rank - 1
              const s = MEDAL_GRADIENTS[rank as 1 | 2 | 3]
              const winner = rank === 1
              return (
                <div key={rank} className="flex flex-col items-center">
                  <motion.div
                    className="relative rounded-[20px]"
                    style={{
                      padding: 3,
                      borderRadius: winner ? 22 : 20,
                      background: 'var(--nu-surf2)',
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${s.ring} ${winner ? 45 : 22}%, transparent)`,
                    }}
                    initial={{ opacity: 0, scale: 0.4, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + d * 0.13,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                  >
                    <div
                      className="relative flex items-center justify-center overflow-hidden"
                      style={{
                        width: winner ? 82 : 64,
                        height: winner ? 82 : 64,
                        borderRadius: winner ? 18 : 17,
                        background: 'var(--nu-bg)',
                        color: 'var(--nu-dim)',
                      }}
                    >
                      {isOurs ? (
                        athlete.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={athlete.photoUrl}
                            alt=""
                            className="size-full object-cover"
                            style={{
                              objectPosition: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                              transform: `scale(${athlete.photoConfig.zoom ?? 1})`,
                              transformOrigin: `${athlete.photoConfig.x ?? 50}% ${athlete.photoConfig.y ?? 50}%`,
                            }}
                          />
                        ) : (
                          <UserRound className="size-7" style={{ color: 'var(--nu-acc)' }} />
                        )
                      ) : (
                        <UserRound className="size-6" />
                      )}
                    </div>
                    <MedalIcon
                      rank={rank}
                      size={winner ? 30 : 26}
                      className="absolute right-[-8px] bottom-[-8px]"
                    />
                  </motion.div>

                  <motion.div
                    className="mt-2 max-w-full truncate text-center text-[12.5px]"
                    style={{
                      color: isOurs ? 'var(--nu-txt)' : 'var(--nu-dim)',
                      fontWeight: isOurs ? 640 : 500,
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.55 + d * 0.13 }}
                  >
                    {isOurs ? `${athlete.firstName} ${athlete.lastName}` : 'Non renseigné'}
                  </motion.div>
                  <div className="mt-1.5 h-[22px]">
                    {isOurs && current.performance && (
                      <motion.span
                        className="inline-block rounded-full px-2.5 py-1 text-[12.5px] font-bold tabular-nums"
                        style={{
                          color: s.ring,
                          background: `color-mix(in srgb, ${s.ring} 16%, transparent)`,
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, delay: 0.62 + d * 0.13 }}
                      >
                        {current.performance}
                      </motion.span>
                    )}
                  </div>

                  <motion.div
                    className={`nu-step-h flex w-full flex-col items-center justify-start gap-1 overflow-hidden pt-2.5 ${STEP_HEIGHT_CLASS[rank]}`}
                    style={{
                      transformOrigin: 'bottom',
                      background: `linear-gradient(180deg, color-mix(in srgb, ${s.ring} ${winner ? 34 : 20}%, transparent), color-mix(in srgb, ${s.ring} ${winner ? 6 : 3}%, transparent))`,
                      border: `1px solid color-mix(in srgb, ${s.ring} ${winner ? 60 : 42}%, transparent)`,
                      borderBottom: 'none',
                      borderRadius:
                        rank === STEP_ORDER[0]
                          ? '12px 0 0 0'
                          : rank === STEP_ORDER[2]
                            ? '0 12px 0 0'
                            : '12px 12px 0 0',
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{
                      duration: 0.55,
                      ease: [0.24, 1.12, 0.38, 1],
                      delay: 0.15 + d * 0.1,
                    }}
                  >
                    <span className="text-sm font-black" style={{ color: s.ring }}>
                      {rankOrdinal(rank)}
                    </span>
                    <span
                      className="mt-auto text-[36px] leading-none font-extrabold tracking-[-0.05em]"
                      style={{
                        color: s.ring,
                        opacity: winner ? 0.55 : 0.32,
                        fontSize: winner ? 46 : 36,
                      }}
                    >
                      {rank}
                    </span>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reflet (miroir des marches) et halo radial retirés le 2026-09-20 —
          purement décoratifs, "trop d'effets lumineux" (retour Maksen). Juste
          un séparateur plein, sobre. */}
      <div className="mx-auto mt-6 h-px max-w-[600px]" style={{ background: 'var(--nu-line)' }} />

      <div className="relative mt-5 flex items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="nu-tool flex size-[34px] shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-30"
          style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
          aria-label="Podium précédent"
        >
          <ChevronLeft className="size-[15px]" />
        </button>
        <div className="flex items-center gap-[7px]">
          {podiums.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onNavigate(i, i > index ? 1 : -1)}
              aria-label={`Aller au podium ${i + 1}`}
              className="h-[7px] rounded-full transition-[width,background]"
              style={{
                width: i === index ? 20 : 7,
                background: i === index ? style.ring : 'var(--nu-line)',
              }}
            />
          ))}
        </div>
        {canEdit && current.source === 'manual' && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onEdit(current)}
              className="nu-tool flex size-[30px] items-center justify-center rounded-[9px] transition-colors"
              style={{ color: 'var(--nu-dim)' }}
              aria-label="Modifier"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex size-[30px] items-center justify-center rounded-[9px] transition-colors hover:[background:color-mix(in_srgb,var(--nu-ko)_15%,transparent)] hover:[color:var(--nu-ko)]"
              style={{ color: 'var(--nu-dim)' }}
              aria-label="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === podiums.length - 1}
          className="nu-tool flex size-[34px] shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-30"
          style={{ border: '1px solid var(--nu-line)', color: 'var(--nu-dim)' }}
          aria-label="Podium suivant"
        >
          <ChevronRight className="size-[15px]" />
        </button>
      </div>
    </div>
  )
}
