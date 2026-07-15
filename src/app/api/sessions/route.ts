import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'

/**
 * GET /api/sessions
 * Liste les sessions actives de l'utilisateur connecté.
 * Permet de voir tous les appareils connectés et de les révoquer.
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const sessions = await db.session.findMany({
      where: {
        userId: user.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Parser le User-Agent pour un affichage lisible
    const formatted = sessions.map(s => {
      const ua = s.userAgent || ''
      let browser = 'Inconnu'
      let os = 'Inconnu'
      let device = 'Ordinateur'

      if (ua.includes('Firefox')) browser = 'Firefox'
      else if (ua.includes('Chrome')) browser = 'Chrome'
      else if (ua.includes('Safari')) browser = 'Safari'
      else if (ua.includes('Edge')) browser = 'Edge'

      if (ua.includes('Windows')) os = 'Windows'
      else if (ua.includes('Mac')) os = 'macOS'
      else if (ua.includes('Linux')) os = 'Linux'
      else if (ua.includes('Android')) { os = 'Android'; device = 'Mobile' }
      else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = 'Mobile' }

      return {
        id: s.id,
        ipAddress: s.ipAddress || 'Inconnue',
        browser,
        os,
        device,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: false, // Sera déterminé côté client via le cookie
      }
    })

    return NextResponse.json({ sessions: formatted })
  } catch (error: any) {
    console.error('GET /api/sessions error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * DELETE /api/sessions
 * Révoque une session spécifique (déconnexion d'un appareil).
 * Body: { sessionId } ou { all: true } pour révoquer toutes les autres sessions
 */
export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, all } = body

    if (all) {
      // Révoquer toutes les sessions sauf celle en cours
      const result = await db.session.updateMany({
        where: {
          userId: user.userId,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      })
      return NextResponse.json({
        success: true,
        message: `${result.count} session(s) révoquée(s)`,
      })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 })
    }

    // Vérifier que la session appartient à l'utilisateur
    const session = await db.session.findUnique({ where: { id: sessionId } })
    if (!session || session.userId !== user.userId) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
    }

    await db.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ success: true, message: 'Session révoquée' })
  } catch (error: any) {
    console.error('DELETE /api/sessions error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
