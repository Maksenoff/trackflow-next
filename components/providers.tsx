'use client'

import { Suspense } from 'react'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { ServiceWorkerRegister } from '@/components/sw-register'
import { RouteProgress } from '@/components/ui/route-progress'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <ServiceWorkerRegister />
        {/* `useSearchParams()` (route-progress.tsx) exige une frontière Suspense
            en App Router, même si le composant ne rend rien tant qu'il n'y a
            pas de navigation en cours. */}
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  )
}
