import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-block shrink-0', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mark-on-dark.svg"
        alt=""
        aria-hidden
        className="hidden size-full dark:block"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mark-on-light.svg"
        alt=""
        aria-hidden
        className="block size-full dark:hidden"
      />
    </span>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 210 40" className={className} aria-hidden focusable="false">
      <text
        x="0"
        y="30"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontSize="26"
        fontWeight={900}
        fontStyle="italic"
        letterSpacing="0.5"
        fill="currentColor"
        style={{ paintOrder: 'stroke', stroke: 'currentColor', strokeWidth: 1.2 }}
      >
        TRACKFLOW
      </text>
    </svg>
  )
}

export function Logo({
  href = '/dashboard',
  className,
  markClassName,
  wordmarkClassName,
}: {
  href?: string
  className?: string
  markClassName?: string
  wordmarkClassName?: string
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={cn('size-8', markClassName)} />
      <Wordmark className={cn('h-4 w-auto text-foreground', wordmarkClassName)} />
    </Link>
  )
}
