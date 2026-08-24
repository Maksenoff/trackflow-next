// Squelette générique affiché instantanément par Next.js (via loading.tsx) le
// temps qu'une page serveur résolve ses données — évite l'écran figé entre
// deux navigations que provoque l'absence de loading.tsx sur une route.
// Pas pixel-perfect par page : juste un shimmer plausible partout, le
// streaming réel des données prend le relais dès qu'elles arrivent.
function Block({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-2xl border border-border bg-card ${className ?? ''}`}
    />
  )
}

export function PageLoading() {
  return (
    <div className="space-y-6 p-4 lg:p-8 xl:p-10">
      <Block className="h-24 rounded-3xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Block key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
