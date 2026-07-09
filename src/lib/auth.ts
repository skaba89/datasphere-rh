import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { company: true },
          })

          if (!user || !user.active) {
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!isValid) {
            return null
          }

          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          await db.auditLog.create({
            data: {
              action: 'LOGIN',
              entityType: 'user',
              entityId: user.id,
              userId: user.email,
              diff: JSON.stringify({ after: { email: user.email, role: user.role } }),
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
          } as any
        } catch (e) {
          console.error('[auth] Authorize error:', e)
          return null
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.userId = (user as any).id
        token.companyId = (user as any).companyId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        (session.user as any).id = token.userId
        (session.user as any).companyId = token.companyId
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production-32chars-long-please',
}
