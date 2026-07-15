import { NextResponse } from 'next/server'
import { MODULE_CATALOG } from '@/lib/modules-catalog'

/**
 * GET /api/public/modules-catalog
 * API publique (sans authentification) listant tous les modules disponibles.
 * Utilisée par la landing page pour afficher les fonctionnalités.
 */
export async function GET() {
  const byCategory = MODULE_CATALOG.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = []
    acc[mod.category].push({
      key: mod.key,
      label: mod.label,
      description: mod.description,
      defaultEnabled: mod.defaultEnabled,
      essential: mod.essential || false,
    })
    return acc
  }, {} as Record<string, any[]>)

  return NextResponse.json({
    totalModules: MODULE_CATALOG.length,
    essentialModules: MODULE_CATALOG.filter(m => m.essential).length,
    defaultEnabled: MODULE_CATALOG.filter(m => m.defaultEnabled).length,
    categories: Object.entries(byCategory).map(([category, modules]) => ({
      category,
      modules: modules.sort((a, b) => a.label.localeCompare(b.label)),
    })),
  })
}
