'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackButton({
  label = 'Retour',
  href,
  className,
}: {
  label?: string
  /** Destination fixe — utilisée à la place de l'historique du navigateur quand
      celui-ci n'est pas fiable (ex: arrivée directe sur la page, ou historique
      remplacé par un router.replace en amont). */
  href?: string
  className?: string
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => (href ? router.push(href) : router.back())}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden',
        className
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  )
}
