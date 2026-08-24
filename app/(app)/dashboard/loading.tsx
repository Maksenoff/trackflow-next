function Block({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-2xl border border-border bg-card ${className ?? ''}`}
    />
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-8 xl:p-10">
      <Block className="h-32 rounded-3xl lg:h-36" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-6 lg:col-span-3">
          <div className="space-y-2.5">
            <Block className="h-5 w-32 border-0 bg-transparent" />
            <Block className="h-32" />
            <Block className="h-16" />
            <Block className="h-16" />
          </div>
          <div className="space-y-2.5">
            <Block className="h-5 w-32 border-0 bg-transparent" />
            <Block className="h-32" />
            <Block className="h-16" />
          </div>
        </div>

        <div className="space-y-2.5 lg:col-span-2">
          <Block className="h-5 w-40 border-0 bg-transparent" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  )
}
