import { NextResponse } from 'next/server'
import { getSession, getTokenFromRequest, SESSION_COOKIE } from '@/lib/session'

export async function GET(request: Request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json({ user: null })
  }
  const session = await getSession(token)
  if (!session) {
    const response = NextResponse.json({ user: null })
    // Effacer le cookie invalide
    response.cookies.delete(SESSION_COOKIE)
    return response
  }
  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
      companyId: session.companyId,
    },
  })
}
