function Block({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-2xl border border-border bg-card ${className ?? ''}`}
    />
  )
}

export function SessionsSkeleton() {
  return (
    <div className="space-y-2.5">
      <Block className="h-5 w-32 border-0 bg-transparent" />
      <Block className="h-36" />
      <Block className="h-16" />
      <Block className="h-16" />
    </div>
  )
}

export function CompetitionsSkeleton() {
  return (
    <div className="space-y-2.5">
      <Block className="h-5 w-32 border-0 bg-transparent" />
      <Block className="h-36" />
      <Block className="h-16" />
    </div>
  )
}

export function PerformancesSkeleton() {
  return (
    <div className="space-y-2.5">
      <Block className="h-5 w-44 border-0 bg-transparent" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Block key={i} className="h-16" />
      ))}
    </div>
  )
}
