import type { LucideIcon } from 'lucide-react'
import { PageTransition } from '@/components/motion/page-transition'

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center text-center px-6 py-24 gap-4">
        <div className="size-14 rounded-2xl bg-accent flex items-center justify-center">
          <Icon className="size-6 text-accent-foreground" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </PageTransition>
  )
}
