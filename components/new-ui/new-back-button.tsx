'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function NewBackButton({ label = 'Retour' }: { label?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="group mb-6.5 inline-flex items-center gap-2 text-[13.5px] transition-colors hover:[color:var(--nu-txt)]"
      style={{ color: 'var(--nu-dim)' }}
    >
      <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
      {label}
    </button>
  )
}
