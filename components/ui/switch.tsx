'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '@/lib/utils'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Piste bien visible même désactivée : --input/--muted sont quasi identiques au
        // fond des cards en dark (#0b0914/#0f0d1a/#080810, tous à un cheveu du noir pur) —
        // le fix light (bg-muted + border-border) ne suffisait pas en dark (correctif
        // 2026-08-26bis). Overrides dark: en blanc translucide, garanti visible quel que
        // soit le fond derrière plutôt que de chercher un token gris qui s'en approche.
        'peer inline-flex h-5.5 w-9.5 shrink-0 items-center rounded-full border border-border bg-muted shadow-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-primary data-checked:bg-primary dark:border-white/20 dark:bg-white/10 dark:data-checked:border-primary dark:data-checked:bg-primary',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4.5 translate-x-0.5 rounded-full bg-background shadow-lg ring-0 transition-transform data-checked:translate-x-[1.125rem] dark:bg-white"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
