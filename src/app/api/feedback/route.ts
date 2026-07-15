import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'

/**
 * POST /api/feedback
 *
 * Permet aux utilisateurs de soumettre un feedback (bug, suggestion, question).
 * Le feedback est enregistré dans l'audit log et visible par les admins.
 *
 * Body: { type, message, rating?, module?, screenshot? }
 */
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const body = await request.json()
    const { type, message, rating, module, screenshot } = body

    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type et message sont requis' },
        { status: 400 }
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Message trop long (max 2000 caractères)' },
        { status: 400 }
      )
    }

    // Enregistrer dans l'audit log
    await db.auditLog.create({
      data: {
        action: 'USER_FEEDBACK',
        entityType: 'feedback',
        entityId: user.userId,
        userId: user.email,
        diff: JSON.stringify({
          type, // bug | suggestion | question | praise
          message,
          rating: rating || null, // 1-5
          module: module || null, // module concerné
          hasScreenshot: !!screenshot,
          userRole: user.role,
          createdAt: new Date().toISOString(),
        }),
      },
    })

    // Si bug critique, notifier l'admin
    if (type === 'bug' && rating && rating <= 2) {
      // TODO: Envoyer email à l'admin
      console.log(`[FEEDBACK] Bug critique signalé par ${user.email}: ${message.slice(0, 100)}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Merci pour votre feedback ! Notre équipe l\'a bien reçu.',
    })
  } catch (error: any) {
    console.error('POST /api/feedback error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du feedback' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/feedback
 * Liste les feedbacks (admin only).
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(user.role)) {
      return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 })
    }

    const feedbacks = await db.auditLog.findMany({
      where: { action: 'USER_FEEDBACK' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const result = feedbacks.map(f => {
      let data: any = {}
      try {
        data = f.diff ? JSON.parse(f.diff) : {}
      } catch {
        data = {}
      }
      return {
        id: f.id,
        type: data.type,
        message: data.message,
        rating: data.rating,
        module: data.module,
        user: f.userId,
        userRole: data.userRole,
        createdAt: f.createdAt,
      }
    })

    return NextResponse.json({ feedbacks: result })
  } catch (error: any) {
    console.error('GET /api/feedback error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
