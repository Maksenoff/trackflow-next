import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.roles = (user as { roles: string[] }).roles
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.roles = token.roles as string[]
      return session
    },
  },
}
