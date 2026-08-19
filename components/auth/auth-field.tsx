'use client'

import { forwardRef, useState, type ComponentProps } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type AuthFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  id: string
  label: string
  icon: LucideIcon
  error?: string
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, icon: Icon, error, id, type, className, ...props },
  ref
) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          id={id}
          type={isPassword ? (show ? 'text' : 'password') : type}
          aria-invalid={!!error}
          className={cn(
            'h-12 rounded-xl border-border bg-muted/40 pr-4 pl-11 text-base shadow-sm transition-all focus-visible:border-violet-800/50 focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-violet-800/15',
            isPassword && 'pr-11',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {show ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  )
})
