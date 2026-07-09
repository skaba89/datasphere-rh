import { NextResponse } from 'next/server'
import { getSession } from '../login/route'

export async function GET(request: Request) {
  const token = request.cookies.get('dsrh-session')?.value
  if (!token) {
    return NextResponse.json({ user: null })
  }
  const session = getSession(token)
  if (!session) {
    return NextResponse.json({ user: null })
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
