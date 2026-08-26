import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

// Pages d'auth : jamais de session requise, ET redirection vers /dashboard si
// une session existe déjà (pas de sens à revoir /login une fois connecté).
const AUTH_PAGES = ['/login', '/register']

// Routes API publiques : jamais de session requise, mais PAS de redirection
// même si une session existe — ce sont de vraies routes API (pas des pages),
// souvent appelées PAR un utilisateur connecté (ex: upload de photo). Les
// mélanger avec AUTH_PAGES dans une même liste a un temps cassé les uploads :
// un utilisateur connecté qui appelait /api/upload se faisait rediriger vers
// /dashboard (règle "déjà connecté" pensée pour /login) au lieu d'atteindre la
// route, et le SDK Vercel Blob tentait de parser cette redirection HTML comme
// du JSON → "Failed to retrieve the client token" (correctif 2026-08-26).
// - /api/keep-alive : cron Vercel (vercel.json), sans session.
// - /api/blob/upload : le POST initial ("generate-client-token") vient du navigateur
//   avec cookie de session (vérifié dans la route elle-même) ; le webhook
//   "blob.upload-completed" est appelé serveur à serveur par Vercel Blob, sans
//   cookie — les deux doivent atteindre la route sans redirection.
// - /api/cron : appelé par GitHub Actions (session-reminders.yml) sans cookie,
//   protégé par son propre secret partagé (voir app/api/cron/.../route.ts).
const PUBLIC_API_PATHS = ['/api/keep-alive', '/api/blob/upload', '/api/cron']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const isPublicApi = PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!req.auth && !isAuthPage && !isPublicApi) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.auth && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|brand|workbox-.*).*)',
  ],
}
