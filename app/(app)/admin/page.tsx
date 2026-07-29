import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isAdmin } from '@/lib/roles'
import { ComingSoon } from '@/components/coming-soon'

export default async function AdminPage() {
  const session = await auth()
  if (!isAdmin(session?.user.roles)) {
    redirect('/dashboard')
  }

  return (
    <ComingSoon
      icon={ShieldCheck}
      title="Administration"
      description="La gestion des utilisateurs, types et feedbacks arrive à la session 8."
    />
  )
}
