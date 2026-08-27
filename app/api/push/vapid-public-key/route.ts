import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

/**
 * Sert la clé VAPID publique en direct depuis l'env serveur, plutôt que de
 * s'appuyer sur `NEXT_PUBLIC_VAPID_PUBLIC_KEY` figée au moment du build dans
 * le bundle JS — un appareil qui garde un vieux bundle en cache (PWA installée
 * sur l'écran d'accueil iOS notamment, dont le cache est totalement séparé de
 * celui de Safari et survit à un "effacer les données de navigation") restait
 * bloqué sur une clé absente/périmée sans jamais pouvoir se rattraper.
 */
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const publicKey = process.env.VAPID_PUBLIC_KEY
  if (!publicKey) {
    return NextResponse.json({ error: 'Clé VAPID non configurée côté serveur' }, { status: 500 })
  }
  return NextResponse.json({ publicKey })
}
