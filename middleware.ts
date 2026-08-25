import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

// /api/keep-alive : appelé par le cron Vercel (vercel.json) sans session —
// doit rester joignable sans redirection vers /login.
// /api/upload : la validation de token de dépôt (POST initial du navigateur) reste
// gérée par la session dans app/api/upload/route.ts, mais le webhook
// "blob.upload-completed" est appelé serveur à serveur par l'infra Vercel Blob
// une fois le fichier stocké, sans cookie de session — le middleware ne doit pas
// le rediriger vers /login avant qu'il n'atteigne la route.
const PUBLIC_PATHS = ['/login', '/register', '/api/keep-alive', '/api/upload']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!req.auth && !isPublic) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (req.auth && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|brand|workbox-.*).*)',
  ],
}
