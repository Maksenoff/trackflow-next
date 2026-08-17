'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  BellRing,
  Check,
  Dumbbell,
  MessageSquare,
  Trophy,
  BadgeCheck,
  X,
  Loader2,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
  competition: Trophy,
  ffa: BadgeCheck,
}

const POLL_INTERVAL_MS = 30_000

export function NotificationBell({ className, label }: { className?: string; label?: string }) {
  const router = useRouter()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

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
    setOpen(false)
    if (item.url) router.push(item.url)
  }

  async function handleDelete(e: React.MouseEvent, item: NotificationItem) {
    e.stopPropagation()
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    if (!item.isRead) setUnread((u) => Math.max(0, u - 1))
    await fetch(`/api/notifications/${item.id}`, { method: 'DELETE' })
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, isRead: true })))
    setUnread(0)
    await fetch('/api/notifications/read-all', { method: 'POST' })
  }

  async function handleTogglePush() {
    setPushLoading(true)
    if (pushEnabled) {
      const ok = await unsubscribeFromPush()
      if (ok) setPushEnabled(false)
    } else {
      if (Notification.permission === 'denied') {
        setPushLoading(false)
        return
      }
      const permission =
        Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission === 'granted') {
        const ok = await subscribeToPush()
        if (ok) setPushEnabled(true)
      }
    }
    setPushLoading(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'relative flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          className
        )}
        aria-label="Notifications"
      >
        <span className="relative inline-flex">
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
        {label && <span>{label}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <span className="text-sm font-bold">Notifications</span>
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

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 size-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Aucune notification.</p>
            </div>
          ) : (
            items.map((item) => {
              const Icon = TYPE_ICONS[item.type] ?? Bell
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'group/item flex w-full items-start gap-2.5 border-b border-border/60 px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50',
                    !item.isRead && 'bg-primary/[0.04]'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                      item.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('truncate text-xs', !item.isRead && 'font-bold')}>
                        {item.title}
                      </p>
                      {!item.type.startsWith('debrief') && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleDelete(e, item)}
                          className="shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/item:opacity-100"
                        >
                          <X className="size-3" />
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      {item.body}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{item.timeAgo}</p>
                  </div>
                  {!item.isRead && (
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              )
            })
          )}
        </div>

        {pushSupported && (
          <button
            type="button"
            onClick={handleTogglePush}
            disabled={pushLoading}
            className="flex w-full items-center justify-center gap-1.5 border-t border-border px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-60"
          >
            {pushLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <BellRing className="size-3.5" />
            )}
            {pushEnabled ? 'Désactiver les notifications push' : 'Activer les notifications push'}
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}
