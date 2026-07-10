import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push'

// GET /api/push/vapid-public-key — retourne la clé publique VAPID
// Utilisé par le client pour souscrire aux push notifications
export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() })
}
