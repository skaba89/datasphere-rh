import { NextResponse } from 'next/server'
import { revokeSession, getTokenFromRequest, SESSION_COOKIE } from '@/lib/session'

export async function POST(request: Request) {
  const token = getTokenFromRequest(request)
  if (token) {
    await revokeSession(token)
  }
  const response = NextResponse.json({ success: true })
  response.cookies.delete(SESSION_COOKIE)
  return response
}
