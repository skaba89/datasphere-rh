import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/public/contact
 * Formulaire de contact public (sans authentification).
 * Enregistre la demande et notifie l'équipe commerciale.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, company, message, plan } = body

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Nom, email et message sont requis' },
        { status: 400 }
      )
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      )
    }

    // Rate limiting basique (max 5 messages/heure par IP)
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentMessages = await db.auditLog.count({
      where: {
        action: 'CONTACT_FORM',
        entityId: ipAddress,
        createdAt: { gt: oneHourAgo },
      },
    })

    if (recentMessages >= 5) {
      return NextResponse.json(
        { error: 'Trop de messages. Réessayez dans 1 heure.' },
        { status: 429 }
      )
    }

    // Enregistrer dans l'audit log (sera visible par l'admin)
    await db.auditLog.create({
      data: {
        action: 'CONTACT_FORM',
        entityType: 'lead',
        entityId: ipAddress,
        userId: email,
        diff: JSON.stringify({
          name,
          email,
          phone: phone || null,
          company: company || null,
          plan: plan || null,
          message,
          createdAt: new Date().toISOString(),
        }),
      },
    })

    // TODO: Envoyer un email à l'équipe commerciale
    // await sendEmail('contact@datasphere.gn', 'Nouveau contact', ...)

    return NextResponse.json({
      success: true,
      message: 'Message reçu. Notre équipe vous contactera sous 24h.',
    })
  } catch (error: any) {
    console.error('POST /api/public/contact error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message' },
      { status: 500 }
    )
  }
}
