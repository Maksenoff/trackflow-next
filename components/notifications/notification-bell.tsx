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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  isPushSupported,
  getExistingPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-client'
import { cn } from '@/lib/utils'

type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  url: string | null
  isRead: boolean
  timeAgo: string
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

const TYPE_ICON_STYLES: Record<string, string> = {
  feedback: 'bg-violet-500/10 text-violet-500',
  debrief: 'bg-orange-500/10 text-orange-500',
  'session-soon': 'bg-sky-500/10 text-sky-500',
  'session-moved': 'bg-fuchsia-500/10 text-fuchsia-500',
  competition: 'bg-amber-500/10 text-amber-500',
  ffa: 'bg-emerald-500/10 text-emerald-500',
  account: 'bg-rose-500/10 text-rose-500',
}
const DEFAULT_ICON_STYLE = 'bg-primary/10 text-primary'

const POLL_INTERVAL_MS = 30_000
const SWIPE_THRESHOLD = -64
const SWIPE_MAX = -88

function NotificationRowContent({ item }: { item: NotificationItem }) {
  const Icon = TYPE_ICONS[item.type] ?? Bell
  return (
    <>
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          TYPE_ICON_STYLES[item.type] ?? DEFAULT_ICON_STYLE
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-[13px]', !item.isRead && 'font-semibold')}>{item.title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/80">{item.timeAgo}</p>
      </div>
      <div className="mt-1.5 flex shrink-0 items-center gap-1.5">
        {!item.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        {item.url && <ChevronRight className="size-3.5 text-muted-foreground/50" />}
      </div>
    </>
  )
}

/** Ligne swipeable (tactile) : glisser vers la gauche révèle la suppression,
 *  ET une croix toujours visible en secours (le swipe seul n'est pas fiable
 *  à 100% sur tous les appareils/navigateurs). */
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
    // Ignore le tap s'il vient d'une ligne encore ouverte/mi-swipée.
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
      className="relative overflow-hidden border-b border-border/60 last:border-b-0"
    >
      <div className="absolute inset-0 flex items-center justify-end bg-destructive px-5">
        <Trash2 className="size-4 text-destructive-foreground" />
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        style={{ x }}
        dragConstraints={{ left: SWIPE_MAX, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < SWIPE_THRESHOLD || info.velocity.x < -500) {
            animate(x, -400, { duration: 0.15 }).then(onDelete)
          } else {
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 })
          }
        }}
        className="relative flex items-start bg-popover"
      >
        {!item.isRead && <div className="absolute inset-0 bg-primary/[0.04]" />}
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
          className="relative mt-2 mr-2 shrink-0 rounded-full p-1.5 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3.5" />
        </button>
      </motion.div>
    </motion.div>
  )
}

/** Ligne desktop : bouton de suppression visible au survol (pas de swipe à la souris). */
function HoverDeleteNotificationRow({
  item,
  onOpen,
  onDelete,
}: {
  item: NotificationItem
  onOpen: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div
      className={cn(
        'relative flex items-start gap-2.5 border-b border-border/60 py-1 pr-2 pl-1 transition-colors last:border-b-0',
        item.url && 'hover:bg-muted/40',
        !item.isRead && 'bg-primary/[0.035]'
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'flex min-w-0 flex-1 items-start gap-2.5 px-2.5 py-2 text-left',
          item.url ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        <NotificationRowContent item={item} />
      </button>
      <button
        type="button"
        aria-label="Supprimer la notification"
        onClick={onDelete}
        className="mt-2 shrink-0 rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

function NotificationList({
  items,
  onItemClick,
  onDelete,
  swipeToDelete,
}: {
  items: NotificationItem[]
  onItemClick: (item: NotificationItem) => void
  onDelete: (id: string) => void
  swipeToDelete: boolean
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <Bell className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Aucune notification.</p>
      </div>
    )
  }

  if (swipeToDelete) {
    return (
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <SwipeableNotificationRow
            key={item.id}
            item={item}
            onOpen={() => onItemClick(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </AnimatePresence>
    )
  }

  return (
    <>
      {items.map((item) => (
        <HoverDeleteNotificationRow
          key={item.id}
          item={item}
          onOpen={() => onItemClick(item)}
          onDelete={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
        />
      ))}
    </>
  )
}

function PushToggle({
  pushSupported,
  pushEnabled,
  pushLoading,
  onToggle,
  className,
}: {
  pushSupported: boolean
  pushEnabled: boolean
  pushLoading: boolean
  onToggle: () => void
  className?: string
}) {
  if (!pushSupported) return null
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pushLoading}
      className={cn(
        'flex w-full items-center justify-center gap-1.5 border-t border-border px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-60',
        className
      )}
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

export function NotificationBell({
  className,
  label,
  variant = 'popover',
}: {
  className?: string
  label?: string
  variant?: 'popover' | 'sheet'
}) {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const itemsRef = useRef<NotificationItem[]>([])
  itemsRef.current = items

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
    getExistingPushSubscription().then((sub) => setPushEnabled(!!sub))
  }, [])

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)))
      setUnread((u) => Math.max(0, u - 1))
      fetch(`/api/notifications/${item.id}/read`, { method: 'POST' })
    }
    // Pas de destination réelle (ex: feedback) : on marque juste comme lu, sans
    // fermer le panneau ni naviguer nulle part — pas de faux chemin d'accès.
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
        if (ok) {
          setPushEnabled(false)
        } else {
          toast.error('Impossible de désactiver les notifications push.')
        }
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
      if (ok) {
        setPushEnabled(true)
      } else {
        toast.error("Impossible d'activer les notifications push.")
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Push toggle échoué :', err)
      toast.error(`Erreur notifications push${err instanceof Error ? ` : ${err.message}` : ''}.`)
    } finally {
      setPushLoading(false)
    }
  }

  const triggerContent = (
    <>
      <span className="relative inline-flex">
        <Bell className="size-4.5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </span>
      {label && <span>{label}</span>}
    </>
  )
  const triggerClassName = cn(
    'relative flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
    className
  )

  if (variant === 'sheet') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Notifications"
          className={triggerClassName}
        >
          {triggerContent}
        </button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="flex max-h-[80dvh] flex-col rounded-t-[28px] border-border pb-[max(1rem,env(safe-area-inset-bottom))]"
            showCloseButton={false}
          >
            <div className="mx-auto mt-1 h-1 w-9 shrink-0 rounded-full bg-muted" />

            <div className="flex items-center justify-between px-4 pt-2">
              <SheetTitle className="text-base">Notifications</SheetTitle>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Check className="size-3" />
                  Tout marquer lu
                </button>
              )}
            </div>

            <div className="mt-2 flex-1 overflow-y-auto border-t border-border">
              <NotificationList
                items={items}
                onItemClick={handleItemClick}
                onDelete={handleDelete}
                swipeToDelete
              />
            </div>

            <PushToggle
              pushSupported={pushSupported}
              pushEnabled={pushEnabled}
              pushLoading={pushLoading}
              onToggle={handleTogglePush}
              className="shrink-0"
            />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerClassName} aria-label="Notifications">
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 gap-0 rounded-2xl p-0 shadow-xl" sideOffset={10}>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Notifications</span>
            {unread > 0 && (
              <span className="flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Check className="size-3" />
              Tout marquer lu
            </button>
          )}
        </div>

        <div className="max-h-[26rem] overflow-y-auto border-t border-border">
          <NotificationList
            items={items}
            onItemClick={handleItemClick}
            onDelete={handleDelete}
            swipeToDelete={false}
          />
        </div>

        <PushToggle
          pushSupported={pushSupported}
          pushEnabled={pushEnabled}
          pushLoading={pushLoading}
          onToggle={handleTogglePush}
          className="rounded-b-2xl"
        />
      </PopoverContent>
    </Popover>
  )
}
