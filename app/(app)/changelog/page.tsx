import { Sparkles, Wrench } from 'lucide-react'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { cn } from '@/lib/utils'
import { CHANGELOG } from '@/lib/changelog'

export default function ChangelogPage() {
  return (
    <PageTransition>
      <div className="space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour" href="/dashboard" />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveautés</h1>
          <p className="text-sm text-muted-foreground">
            Tout ce qui a changé dans TrackFlow, version par version.
          </p>
        </div>

        <div className="space-y-10">
          {CHANGELOG.map((entry, i) => (
            <div key={entry.version} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-selected px-3 py-1.5 text-sm font-bold text-white shadow-sm shadow-primary/25">
                  <Sparkles className="size-3.5" />v{entry.version}
                </span>
                <span className="text-sm text-muted-foreground">{entry.date}</span>
                {i === 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase">
                    Version actuelle
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {entry.sections.map((section) => {
                  const isFix = section.kind === 'fix'
                  return (
                    <div
                      key={section.title}
                      className={cn(
                        'rounded-2xl border p-4 shadow-card',
                        isFix ? 'border-amber-500/25 bg-amber-500/[0.04]' : 'border-border bg-card'
                      )}
                    >
                      <h2
                        className={cn(
                          'mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase',
                          isFix ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                        )}
                      >
                        {isFix ? (
                          <Wrench className="size-3.5" />
                        ) : (
                          <Sparkles className="size-3.5" />
                        )}
                        {section.title}
                      </h2>
                      <ul className="space-y-1.5">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span
                              className={cn(
                                'mt-1.5 size-1.5 shrink-0 rounded-full',
                                isFix ? 'bg-amber-500' : 'bg-primary'
                              )}
                            />
                            <span className="text-foreground/90">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
