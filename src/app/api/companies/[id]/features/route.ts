import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  MODULE_CATALOG,
  getDefaultEnabledModules,
  getEssentialModules,
  parseEnabledModules,
  serializeFeatures,
} from '@/lib/modules-catalog'

/**
 * GET /api/companies/[id]/features
 * Retourne la liste des modules activés pour une société.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      select: { id: true, raisonSociale: true, features: true },
    })

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    const enabledSet = parseEnabledModules(company.features)
    const essentials = new Set(getEssentialModules())

    // Retourne le catalogue complet avec le statut activé/désactivé
    const modules = MODULE_CATALOG.map(m => ({
      key: m.key,
      label: m.label,
      category: m.category,
      description: m.description,
      essential: m.essential || false,
      enabled: enabledSet.has(m.key),
    }))

    return NextResponse.json({
      company: { id: company.id, raisonSociale: company.raisonSociale },
      modules,
      stats: {
        total: modules.length,
        enabled: modules.filter(m => m.enabled).length,
        essential: modules.filter(m => m.essential).length,
      },
    })
  } catch (error) {
    console.error('GET /api/companies/[id]/features error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PATCH /api/companies/[id]/features
 * Met à jour les modules activés pour une société.
 *
 * Body: { modules: string[] }  — liste des clés de modules à activer
 * Les modules essentiels sont toujours forcés à true.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body || !Array.isArray(body.modules)) {
      return NextResponse.json(
        { error: 'Le corps de la requête doit contenir un tableau "modules"' },
        { status: 400 }
      )
    }

    // Vérifier que la société existe
    const company = await db.company.findUnique({
      where: { id },
      select: { id: true, raisonSociale: true },
    })
    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    // Valider que toutes les clés existent dans le catalogue
    const validKeys = new Set(MODULE_CATALOG.map(m => m.key))
    const requestedKeys = body.modules.filter((k: string) => validKeys.has(k))

    // Forcer les modules essentiels
    const essentials = getEssentialModules()
    const allEnabled = Array.from(new Set([...requestedKeys, ...essentials]))

    // Sérialiser et sauvegarder
    const featuresJson = serializeFeatures(allEnabled)
    await db.company.update({
      where: { id },
      data: { features: featuresJson },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_FEATURES',
        entityType: 'company',
        entityId: id,
        userId: 'system',
        diff: JSON.stringify({
          after: { enabledModules: allEnabled.length, total: MODULE_CATALOG.length },
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: `${allEnabled.length} module(s) activé(s) sur ${MODULE_CATALOG.length}`,
      enabledModules: allEnabled,
    })
  } catch (error) {
    console.error('PATCH /api/companies/[id]/features error:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }
}

/**
 * POST /api/companies/[id]/features
 * Réinitialise les modules aux valeurs par défaut.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    const defaults = getDefaultEnabledModules()
    const featuresJson = serializeFeatures(defaults)
    await db.company.update({
      where: { id },
      data: { features: featuresJson },
    })

    return NextResponse.json({
      success: true,
      message: 'Modules réinitialisés aux valeurs par défaut',
      enabledModules: defaults,
    })
  } catch (error) {
    console.error('POST /api/companies/[id]/features error:', error)
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation' }, { status: 500 })
  }
}
