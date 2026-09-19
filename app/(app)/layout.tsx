import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/nav/sidebar'
import { MobileNav } from '@/components/nav/mobile-nav'
import { NewSidebar } from '@/components/new-ui/new-sidebar'
import { NewMobileNav } from '@/components/new-ui/new-mobile-nav'
import { NewUiRoot } from '@/components/new-ui/new-ui-root'
import { FeedbackWidget } from '@/components/feedback/feedback-widget'
import { ActivityPing } from '@/components/activity-ping'
import { resolveNewUi, type Role } from '@/lib/roles'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const roles = (session?.user.roles ?? []) as Role[]
  const name = session?.user.name ?? ''
  const email = session?.user.email ?? ''

  const user = session?.user.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          linkedAthlete: { select: { id: true, photoUrl: true, photoConfig: true } },
          newUiEnabled: true,
          accentColor: true,
        },
      })
    : null
  const linkedAthlete = user?.linkedAthlete
    ? {
        id: user.linkedAthlete.id,
        photoUrl: user.linkedAthlete.photoUrl,
        photoConfig: JSON.parse(user.linkedAthlete.photoConfig) as {
          zoom?: number
          x?: number
          y?: number
        },
      }
    : null

  // La nouvelle interface est désormais l'interface par défaut de tout le
  // monde (décision Maksen 2026-09-19, fin de la bêta) — seul un admin peut
  // encore repasser sur l'ancienne depuis les paramètres (Apparence), pour
  // comparer/dépanner ; ce réglage n'a aucun effet pour les autres rôles, qui
  // voient toujours le nouveau shell quelle que soit la valeur en base.
  const newUiEnabled = resolveNewUi(user?.newUiEnabled, roles)
  if (newUiEnabled) {
    // "auto" (swatch Blanc/Noir) n'est pas une couleur figée — résolue côté
    // client par NewUiRoot selon le thème réel, en écrivant sur <body>. On ne
    // la redéclare PAS ici sur ce wrapper : une custom property posée
    // directement sur un élément prime toujours sur celle héritée d'un
    // ancêtre (ici <body>), quel que soit l'ordre d'écriture en JS — un guess
    // SSR ici resterait donc bloqué à vie côté client, jamais corrigé par
    // NewUiRoot (bug constaté 2026-09-19 : le "flow" du logo et le texte des
    // pastilles sur accent restaient invisibles en thème clair). Pour les
    // couleurs figées (non "auto"), la valeur ne dépend pas du thème donc
    // aucun souci à la fixer ici pour un premier rendu sans flash.
    const ssrAccent = user?.accentColor && user.accentColor !== 'auto' ? user.accentColor : null
    return (
      <div
        className="new-ui relative flex min-h-dvh"
        style={
          {
            background: 'var(--nu-bg)',
            ...(ssrAccent ? { '--nu-accent-user': ssrAccent } : {}),
          } as React.CSSProperties
        }
      >
        <NewUiRoot accentColor={user?.accentColor ?? null} />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              'radial-gradient(900px 520px at 18% -8%, color-mix(in srgb, var(--nu-acc) 7%, transparent), transparent 62%), radial-gradient(700px 460px at 96% 4%, color-mix(in srgb, #4c8dff 5%, transparent), transparent 60%)',
          }}
        />
        <ActivityPing />
        <NewSidebar
          roles={roles}
          name={name}
          linkedAthlete={linkedAthlete}
          accentColor={user?.accentColor ?? null}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-24 lg:pt-0 lg:pb-0">
            {children}
          </main>
        </div>
        <NewMobileNav
          roles={roles}
          name={name}
          email={email}
          linkedAthlete={linkedAthlete}
          accentColor={user?.accentColor ?? null}
        />
        <FeedbackWidget />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh">
      <ActivityPing />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--primary) 7%, transparent), transparent)',
        }}
      />
      <Sidebar roles={roles} name={name} linkedAthlete={linkedAthlete} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* pt-[env(safe-area-inset-top)] : viewport-fit=cover (app/layout.tsx) active
            les safe-area-inset-* sur iPhone à encoche/Dynamic Island, mais rien ne les
            respectait encore — sur mobile (pas de Sidebar, main affiché directement
            sous la barre de statut système) ça poussait le contenu du haut de page
            (ex: bouton "+ Créer un vote" sur /votes) sous la zone de la barre de
            statut, injoignable au tap. Vaut 0 sur desktop/appareils sans encoche,
            aucun effet là où ce n'est pas nécessaire (correctif 2026-09-09). */}
        <main className="flex-1 pt-[env(safe-area-inset-top)] pb-24 lg:pt-0 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav roles={roles} name={name} email={email} linkedAthlete={linkedAthlete} />
      <FeedbackWidget />
    </div>
  )
}
