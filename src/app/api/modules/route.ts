import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'
import { parseEnabledModules } from '@/lib/modules-catalog'

/**
 * GET /api/modules
 * Retourne la liste des modules activés pour la société de l'utilisateur connecté.
 *
 * Si l'utilisateur n'est pas connecté (mode démo), utilise la première société.
 * Si aucune société n'existe, retourne les modules par défaut.
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)

    let company = null
    if (user?.companyId) {
      company = await db.company.findUnique({
        where: { id: user.companyId },
        select: { id: true, features: true },
      })
    }

    // Fallback : première société (mode démo)
    if (!company) {
      company = await db.company.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, features: true },
      })
    }

    const enabledSet = company
      ? parseEnabledModules(company.features)
      : new Set<string>()

    return NextResponse.json({
      companyId: company?.id || null,
      enabledModules: Array.from(enabledSet),
    })
  } catch (error) {
    console.error('GET /api/modules error:', error)
    // En cas d'erreur (ex: base de données non configurée), retourner les modules par défaut
    return NextResponse.json({
      companyId: null,
      enabledModules: [],
      error: 'Could not load modules configuration',
    })
  }
}
