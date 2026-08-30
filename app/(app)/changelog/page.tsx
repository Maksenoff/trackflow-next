import { Sparkles } from 'lucide-react'
import { PageTransition } from '@/components/motion/page-transition'
import { BackButton } from '@/components/ui/back-button'
import { CHANGELOG } from '@/lib/changelog'

export default function ChangelogPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8 xl:p-10">
        <BackButton label="Retour" href="/dashboard" />

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveautés</h1>
          <p className="text-sm text-muted-foreground">
            Tout ce qui a changé dans TrackFlow, version par version.
          </p>
        </div>

        <div className="space-y-8">
          {CHANGELOG.map((entry, i) => (
            <div
              key={entry.version}
              className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"
            >
              {i === 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/10 blur-3xl"
                />
              )}
              <div className="relative mb-5 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-selected px-3 py-1.5 text-sm font-bold text-white shadow-sm shadow-primary/25">
                  <Sparkles className="size-3.5" />v{entry.version}
                </span>
                <span className="text-sm text-muted-foreground">{entry.date}</span>
              </div>

              <div className="relative space-y-5">
                {entry.sections.map((section) => (
                  <div key={section.title}>
                    <h2 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      {section.title}
                    </h2>
                    <ul className="space-y-1.5">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-foreground/90">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
