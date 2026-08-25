'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { MessageSquare, Loader2, Bug, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FeedbackType = 'bug' | 'suggestion'

const TYPES: {
  key: FeedbackType
  icon: LucideIcon
  label: string
  hint: string
  sentLabel: string
}[] = [
  { key: 'bug', icon: Bug, label: 'Bug', hint: 'Ça ne marche pas', sentLabel: 'Bug envoyé' },
  {
    key: 'suggestion',
    icon: Lightbulb,
    label: 'Suggestion',
    hint: 'Une idée',
    sentLabel: 'Suggestion envoyée',
  },
]

export function FeedbackWidget() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setType('bug')
      setDescription('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 5 || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description: description.trim(), page: pathname }),
      })
      if (!res.ok) throw new Error()
      handleOpenChange(false)
      toast.success(TYPES.find((t) => t.key === type)!.sentLabel)
      // Invalide le cache client du routeur pour que /admin/feedbacks affiche
      // immédiatement ce nouveau ticket même si l'admin l'avait déjà visité récemment.
      router.refresh()
    } catch {
      toast.error("Échec de l'envoi, réessaie.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        title="Signaler un bug ou une suggestion"
        aria-label="Signaler un bug ou une suggestion"
        className="fixed right-4 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] z-30 flex size-10 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground opacity-70 shadow-md backdrop-blur transition-all hover:scale-110 hover:text-primary hover:opacity-100 print:hidden lg:bottom-6"
      >
        <MessageSquare className="size-4.5" />
      </button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Retour &amp; Suggestions</SheetTitle>
            <SheetDescription>Aide-nous à améliorer TrackFlow</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="flex h-full flex-col space-y-4"
            >
              <div>
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Type
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-left transition-colors',
                        type === t.key
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <t.icon className="mb-1 size-4.5" />
                      <span className="block text-xs font-semibold">{t.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{t.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <p className="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Description
                </p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décris le problème ou ton idée…"
                  className="min-h-56 flex-1 resize-none"
                  required
                />
                <p className="mt-1 text-right text-[10px] text-muted-foreground">
                  {description.length} caractères
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-2"
                  disabled={description.trim().length < 5 || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    'Envoyer'
                  )}
                </Button>
              </div>
            </motion.form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
