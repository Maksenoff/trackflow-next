'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BackButton({
  label = 'Retour',
  className,
}: {
  label?: string
  className?: string
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
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
