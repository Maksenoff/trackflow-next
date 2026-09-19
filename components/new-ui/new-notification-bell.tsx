'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useMotionValue, animate } from 'framer-motion'
import { toast } from 'sonner'
import {
  Bell,
  BellRing,
  Check,
  ChevronRight,
  Clock,
  CalendarClock,
  Dumbbell,
  KeyRound,
  MessageSquare,
  Trophy,
  BadgeCheck,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-client'
import { cn } from '@/lib/utils'

/**
 * Cloche de la nouvelle interface (bêta) — même logique/état que
 * components/notifications/notification-bell.tsx (feed, lu/non-lu,
 * suppression, push), dupliquée plutôt que partagée pour ne pas coupler les
 * deux skins visuels (voir CLAUDE.md, décision prise pour ce chantier).
 */
type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  isRead: boolean
  timeAgo: string
  date: string
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  feedback: MessageSquare,
  debrief: Dumbbell,
  'session-soon': Clock,
  'session-moved': CalendarClock,
  competition: Trophy,
  ffa: BadgeCheck,
  account: KeyRound,
}

/** Couleur sémantique par type — un ton par famille d'évènement plutôt qu'un
 * accent unique partout, pour que la frise (desktop) et les puces (mobile)
 * se distinguent réellement au premier coup d'œil. Valeurs fixes (pas de
 * variable de thème) : le sens (feedback = violet, urgence = ambre...) doit
 * rester lisible quelle que soit la couleur d'accent choisie par l'utilisateur. */
const TYPE_COLORS: Record<string, string> = {
  feedback: '#8b5cf6',
  debrief: '#f97316',
  'session-soon': '#0ea5e9',
  'session-moved': '#d946ef',
  competition: '#f59e0b',
  ffa: '#10b981',
  account: '#f43f5e',
}
const DEFAULT_TYPE_COLOR = '#94a3b8'

const POLL_INTERVAL_MS = 30_000
const SWIPE_THRESHOLD = -64
const SWIPE_MAX = -88

/** Regroupe par jour relatif (Aujourd'hui/Hier/Cette semaine/Plus tôt) pour
 * la frise desktop — voir TimelineNotificationList. */
function groupByDay(items: NotificationItem[]) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const today = startOfDay(new Date())
  const buckets = new Map<number, { label: string; items: NotificationItem[] }>()
  for (const item of items) {
    const diffDays = Math.round((today - startOfDay(new Date(item.date))) / 86_400_000)
    const key = diffDays <= 0 ? 0 : diffDays === 1 ? 1 : diffDays < 7 ? 2 : 3
    const label =
      key === 0 ? "Aujourd'hui" : key === 1 ? 'Hier' : key === 2 ? 'Cette semaine' : 'Plus tôt'
    if (!buckets.has(key)) buckets.set(key, { label, items: [] })
    buckets.get(key)!.items.push(item)
  }
  return [...buckets.entries()].sort(([a], [b]) => a - b).map(([, v]) => v)
}

function NotificationRowContent({ item }: { item: NotificationItem }) {
  const Icon = TYPE_ICONS[item.type] ?? Bell
  const color = TYPE_COLORS[item.type] ?? DEFAULT_TYPE_COLOR
  return (
    <>
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn('truncate text-[13px]', !item.isRead && 'font-semibold')}
          style={{ color: 'var(--nu-txt)' }}
        >
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: 'var(--nu-dim)' }}>
          {item.body}
        </p>
        <p className="mt-1 text-[11px] opacity-70" style={{ color: 'var(--nu-dim)' }}>
          {item.timeAgo}
        </p>
      </div>
      <div className="mt-1.5 flex shrink-0 items-center gap-1.5">
        {!item.isRead && (
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: 'var(--nu-acc)' }}
          />
        )}
        {item.url && (
          <ChevronRight className="size-3.5 opacity-40" style={{ color: 'var(--nu-dim)' }} />
        )}
      </div>
    </>
  )
}

function SwipeableNotificationRow({
  item,
  onOpen,
  onDelete,
}: {
  item: NotificationItem
  onOpen: () => void
  onDelete: () => void
}) {
  const x = useMotionValue(0)

  function handleClick() {
    if (Math.abs(x.get()) > 4) {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
      return
    }
    onOpen()
  }

  return (
    <motion.div
      layout
      initial={false}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="relative overflow-hidden border-b last:border-b-0"
      style={{ borderColor: 'var(--nu-line)' }}
    >
      <div className="absolute inset-0 flex items-center justify-end bg-red-500 px-5">
        <Trash2 className="size-4 text-white" />
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        style={{ x, background: 'var(--nu-surf)' }}
        dragConstraints={{ left: SWIPE_MAX, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < SWIPE_THRESHOLD || info.velocity.x < -500) {
            animate(x, -400, { duration: 0.15 }).then(onDelete)
          } else {
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
          }
        }}
        className="relative flex items-start"
      >
        <button
          type="button"
          onClick={handleClick}
          className="relative flex min-w-0 flex-1 items-start gap-2.5 px-3.5 py-2.5 text-left"
        >
          <NotificationRowContent item={item} />
        </button>
        <button
          type="button"
          aria-label="Supprimer la notification"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="relative mt-2 mr-2 shrink-0 rounded-full p-1.5 opacity-70 transition-colors hover:opacity-100"
          style={{ color: 'var(--nu-dim)' }}
        >
          <X className="size-3.5" />
        </button>
      </motion.div>
    </motion.div>
  )
}

/** Liste swipeable — mobile — groupée par jour comme la frise desktop
 * (retour Maksen 2026-09-19, "chronologie et tout top pour le mobile
 * aussi"). */
function NotificationList({
  items,
  onItemClick,
  onDelete,
}: {
  items: NotificationItem[]
  onItemClick: (item: NotificationItem) => void
  onDelete: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <Bell className="mx-auto mb-2 size-6 opacity-40" style={{ color: 'var(--nu-dim)' }} />
        <p className="text-xs" style={{ color: 'var(--nu-dim)' }}>
          Aucune notification.
        </p>
      </div>
    )
  }

  const groups = groupByDay(items)

  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <div
            className="sticky top-0 z-10 px-4 pt-2.5 pb-1.5 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--nu-dim)', background: 'var(--nu-bg)' }}
          >
            {group.label}
          </div>
          <AnimatePresence initial={false}>
            {group.items.map((item) => (
              <SwipeableNotificationRow
                key={item.id}
                item={item}
                onOpen={() => onItemClick(item)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </>
  )
}

/**
 * Présentation desktop — frise chronologique groupée par jour plutôt qu'une
 * simple liste plate (retour Maksen 2026-09-19, "quelque chose de plus
 * original"). Une ligne verticale relie les puces colorées par type
 * (TYPE_COLORS), chaque groupe de jour a son propre en-tête collant. Le
 * mobile garde `NotificationList` (liste swipeable) — pas concerné par cette
 * demande, qui portait explicitement sur le desktop.
 */
function TimelineNotificationList({
  items,
  onItemClick,
  onDelete,
}: {
  items: NotificationItem[]
  onItemClick: (item: NotificationItem) => void
  onDelete: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <Bell className="mx-auto mb-2 size-6 opacity-40" style={{ color: 'var(--nu-dim)' }} />
        <p className="text-xs" style={{ color: 'var(--nu-dim)' }}>
          Aucune notification.
        </p>
      </div>
    )
  }

  const groups = groupByDay(items)

  return (
    <div className="py-1">
      {groups.map((group) => (
        <div key={group.label}>
          <div
            className="sticky top-0 z-10 px-4 pt-2.5 pb-1.5 text-[10px] font-bold tracking-wider uppercase"
            style={{ color: 'var(--nu-dim)', background: 'var(--nu-bg)' }}
          >
            {group.label}
          </div>
          <div className="relative px-4">
            <span
              aria-hidden
              className="absolute top-0 bottom-0 left-[31px] w-px"
              style={{ background: 'var(--nu-line)' }}
            />
            {group.items.map((item) => {
              const Icon = TYPE_ICONS[item.type] ?? Bell
              const color = TYPE_COLORS[item.type] ?? DEFAULT_TYPE_COLOR
              return (
                <div key={item.id} className="relative flex items-start gap-3 py-2">
                  <span
                    className="relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ring-4"
                    style={
                      {
                        background: color,
                        color: '#fff',
                        '--tw-ring-color': 'var(--nu-bg)',
                      } as React.CSSProperties
                    }
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => onItemClick(item)}
                    className={cn(
                      'min-w-0 flex-1 text-left',
                      item.url ? 'cursor-pointer' : 'cursor-default'
                    )}
                  >
                    <p
                      className={cn('truncate text-[13px]', !item.isRead && 'font-semibold')}
                      style={{ color: 'var(--nu-txt)' }}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: 'var(--nu-dim)' }}>
                      {item.body}
                    </p>
                    <p className="mt-1 text-[11px] opacity-70" style={{ color: 'var(--nu-dim)' }}>
                      {item.timeAgo}
                    </p>
                  </button>
                  <div className="mt-0.5 flex shrink-0 items-center gap-1">
                    {!item.isRead && (
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: 'var(--nu-acc)' }}
                      />
                    )}
                    {/* Toujours visible en gris (pas juste au survol de la
                        ligne), passe au rouge seulement au survol du bouton
                        lui-même — logique attendue pour une action de
                        suppression (retour Maksen 2026-09-19). Couleur en
                        classes Tailwind (pas de `style` inline sur `color`) :
                        un style inline sur la même propriété bloquerait
                        silencieusement la variante `hover:`, quelle que soit
                        sa spécificité. */}
                    <button
                      type="button"
                      aria-label="Supprimer la notification"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(item.id)
                      }}
                      className="shrink-0 rounded-full p-1 transition-colors [color:var(--nu-dim)] hover:[background:rgba(239,68,68,.12)] hover:[color:#ef4444]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Bouton "Tout marquer lu" — pastille pleine teintée accent plutôt qu'un
 * simple lien texte+icône sans fond (retour Maksen 2026-09-19, "c'est pas
 * top en terme de design"), avec un état hover marqué. Partagé entre l'en-tête
 * du sheet mobile et celui du panneau desktop pour rester identique aux deux
 * endroits.
 */
function MarkAllReadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors [background:color-mix(in_srgb,var(--nu-acc)_13%,transparent)] hover:[background:color-mix(in_srgb,var(--nu-acc)_22%,transparent)]"
      style={{ color: 'var(--nu-acc)' }}
    >
      <Check className="size-3.5" />
      Tout marquer lu
    </button>
  )
}

function PushToggle({
  pushSupported,
  pushEnabled,
  pushLoading,
  onToggle,
}: {
  pushSupported: boolean
  pushEnabled: boolean
  pushLoading: boolean
  onToggle: () => void
}) {
  if (!pushSupported) return null
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pushLoading}
      className="flex w-full items-center justify-center gap-1.5 border-t px-3.5 py-2.5 text-xs font-semibold transition-colors disabled:opacity-60"
      style={{ borderColor: 'var(--nu-line)', color: 'var(--nu-dim)' }}
    >
      {pushLoading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <BellRing className="size-3.5" />
      )}
      {pushEnabled ? 'Désactiver les notifications push' : 'Activer les notifications push'}
    </button>
  )
}

export function NewNotificationBell({
  variant = 'popover',
  className,
  accentColor,
}: {
  variant?: 'popover' | 'sheet'
  className?: string
  accentColor?: string | null
}) {
  const accentStyle = accentColor
    ? ({ '--nu-accent-user': accentColor } as React.CSSProperties)
    : undefined
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const itemsRef = useRef<NotificationItem[]>([])
  itemsRef.current = items
  // Panneau desktop (variant="popover") : plus de Popover primitive, donc
  // fermeture au clic extérieur gérée à la main (cf. return plus bas).
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (variant !== 'popover' || !open) return
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [variant, open])

  const fetchFeed = useCallback(async () => {
    const res = await fetch('/api/notifications/feed')
    if (!res.ok) return
    const data = await res.json()
    setItems(data.items)
    setUnread(data.unread)
  }, [])

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchFeed])

  useEffect(() => {
    setPushSupported(isPushSupported())
    getExistingPushSubscription()
      .then((sub) => setPushEnabled(!!sub))
      .catch(() => {})
  }, [])

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)))
      setUnread((u) => Math.max(0, u - 1))
      fetch(`/api/notifications/${item.id}/read`, { method: 'POST' })
    }
    if (item.url) {
      setOpen(false)
      router.push(item.url)
    }
  }

  async function handleDelete(id: string) {
    const item = itemsRef.current.find((i) => i.id === id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (item && !item.isRead) setUnread((u) => Math.max(0, u - 1))
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
    setUnread(0)
    await fetch('/api/notifications/read-all', { method: 'POST' })
  }

  async function handleTogglePush() {
    setPushLoading(true)
    try {
      if (pushEnabled) {
        const ok = await unsubscribeFromPush()
        if (ok) setPushEnabled(false)
        else toast.error('Impossible de désactiver les notifications push.')
        return
      }
      if (!isPushSupported()) {
        toast.error(
          "Notifications push non supportées sur cet appareil (sur iOS : ajoute d'abord l'app à l'écran d'accueil)."
        )
        return
      }
      if (Notification.permission === 'denied') {
        toast.error(
          'Notifications bloquées — autorise-les dans les réglages du navigateur pour ce site.'
        )
        return
      }
      const permission =
        Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Autorisation refusée.')
        return
      }
      const ok = await subscribeToPush()
      if (ok) setPushEnabled(true)
      else toast.error("Impossible d'activer les notifications push.")
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Push toggle échoué :', err)
      toast.error(`Erreur notifications push${err instanceof Error ? ` : ${err.message}` : ''}.`)
    } finally {
      setPushLoading(false)
    }
  }

  const triggerClassName = cn(
    'relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
    className
  )

  const trigger = (
    <span className="relative inline-flex">
      <Bell className="size-4.5" />
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-bold"
          style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </span>
  )

  if (variant === 'sheet') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Notifications"
          className={triggerClassName}
          style={{ color: 'var(--nu-dim)' }}
        >
          {trigger}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="top"
            className="new-ui flex max-h-[80dvh] flex-col rounded-b-[28px] pt-[max(1rem,env(safe-area-inset-top))]"
            style={{ background: 'var(--nu-bg)', borderColor: 'var(--nu-line)', ...accentStyle }}
            showCloseButton={false}
          >
            <div className="flex items-center justify-between px-4">
              <SheetTitle className="text-base" style={{ color: 'var(--nu-txt)' }}>
                Notifications
              </SheetTitle>
              {unread > 0 && <MarkAllReadButton onClick={handleMarkAllRead} />}
            </div>
            <div
              className="mt-2 flex-1 overflow-y-auto border-t"
              style={{ borderColor: 'var(--nu-line)' }}
            >
              <NotificationList
                items={items}
                onItemClick={handleItemClick}
                onDelete={handleDelete}
              />
            </div>
            <PushToggle
              pushSupported={pushSupported}
              pushEnabled={pushEnabled}
              pushLoading={pushLoading}
              onToggle={handleTogglePush}
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  // Panneau desktop : plus un popover flottant ancré à la cloche, mais un
  // panneau qui descend juste sous le logo/nom Trackflow à la largeur exacte
  // du rail latéral (retour Maksen 2026-09-19 — "une box qui s'ouvre juste
  // comme ça sur l'écran" ne se sentait pas vraiment intégrée à l'app). Pas
  // de Popover ici : son Portal rendrait dans document.body et casserait le
  // positionnement `absolute` relatif au `<aside>` (seul ancêtre positionné,
  // `position: sticky`) — un simple AnimatePresence + fermeture au clic
  // extérieur suffit, plus besoin du positionnement flottant dynamique.
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className={triggerClassName}
        style={{ color: 'var(--nu-dim)' }}
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="new-ui absolute inset-x-0 top-16 z-40 flex flex-col overflow-hidden rounded-b-2xl border-t border-b"
            style={{
              // 60% de la hauteur du rail (pas toute sa longueur, retour
              // Maksen 2026-09-19) — le rail (<aside>) fait `h-dvh`, donc 60%
              // de `100dvh` correspond à 60% de sa propre hauteur.
              height: '60dvh',
              background: 'var(--nu-bg)',
              borderColor: 'var(--nu-line)',
              boxShadow: '0 24px 48px -14px rgba(0,0,0,.4)',
              ...accentStyle,
            }}
          >
            {/* En-tête sur deux lignes : à la largeur du rail (240px), titre +
                badge + "Tout marquer lu" ne tenaient pas sur une seule ligne
                (retour Maksen 2026-09-19, "des éléments dépassent") — c'était
                calé sur l'ancienne largeur du popover (384px). `bottom-0`
                plutôt qu'une hauteur en `dvh` calculée à la main pour occuper
                exactement tout le rail, jusqu'en bas, sans dépendre du
                viewport (retour Maksen, "ne prend pas toute la nav bar"). */}
            <div
              className="flex shrink-0 flex-col gap-2 border-b px-4 py-3.5"
              style={{ borderColor: 'var(--nu-line)' }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--nu-acc) 14%, transparent)',
                    color: 'var(--nu-acc)',
                  }}
                >
                  <Bell className="size-3.5" />
                </span>
                <span className="truncate text-sm font-bold" style={{ color: 'var(--nu-txt)' }}>
                  Notifications
                </span>
                {unread > 0 && (
                  <span
                    className="flex min-w-4.5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                    style={{ background: 'var(--nu-acc)', color: 'var(--nu-onacc)' }}
                  >
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <div className="self-start">
                  <MarkAllReadButton onClick={handleMarkAllRead} />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <TimelineNotificationList
                items={items}
                onItemClick={handleItemClick}
                onDelete={handleDelete}
              />
            </div>
            <PushToggle
              pushSupported={pushSupported}
              pushEnabled={pushEnabled}
              pushLoading={pushLoading}
              onToggle={handleTogglePush}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
