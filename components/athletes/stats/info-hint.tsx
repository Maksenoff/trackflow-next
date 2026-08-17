'use client'

import { Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function InfoHint({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground"
            aria-label="Plus d'infos"
          >
            <Info className="size-2.5" />
          </button>
        }
      />
      <PopoverContent className="w-64 text-xs leading-relaxed text-muted-foreground" sideOffset={6}>
        {children}
      </PopoverContent>
    </Popover>
  )
}
