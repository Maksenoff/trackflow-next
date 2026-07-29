import { auth } from '@/lib/auth'
import { ROLE_LABELS, type Role } from '@/lib/roles'
import { PageTransition } from '@/components/motion/page-transition'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default async function DashboardPage() {
  const session = await auth()
  const firstName = session?.user.name?.split(' ')[0] ?? ''
  const roles = (session?.user.roles ?? []) as Role[]
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <PageTransition>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
          <div className="flex gap-1.5 pt-1">
            {roles.map((r) => (
              <Badge key={r} variant="secondary">
                {ROLE_LABELS[r] ?? r}
              </Badge>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="py-8 text-center space-y-1.5">
            <p className="text-sm font-medium">Fondations TrackFlow installées</p>
            <p className="text-sm text-muted-foreground">
              Les widgets entraînements, compétitions et performances récentes arrivent à la session 2.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
