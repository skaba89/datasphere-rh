/**
 * Catalogue central des modules RH disponibles dans DataSphere RH.
 * Utilisé par :
 *  - La Sidebar (n'afficher que les modules activés)
 *  - La page Settings (interface de gestion des modules)
 *  - L'API features (GET/PATCH)
 *
 * Chaque module a :
 *  - key : identifiant unique (correspond à PageKey dans page.tsx)
 *  - label : libellé affiché dans la sidebar
 *  - category : section de la sidebar
 *  - defaultEnabled : true = activé par défaut pour les nouvelles sociétés
 *  - description : courte description pour l'interface de gestion
 *  - essential : true = module non désactivable (toujours actif)
 */

export interface ModuleDef {
  key: string
  label: string
  category: string
  defaultEnabled: boolean
  description: string
  essential?: boolean
}

export const MODULE_CATALOG: ModuleDef[] = [
  // === Pilotage (essentiels) ===
  { key: 'dashboard', label: 'Tableau de bord', category: 'Pilotage', defaultEnabled: true, description: 'Vue d\'ensemble KPIs RH', essential: true },
  { key: 'employees', label: 'Employés', category: 'Pilotage', defaultEnabled: true, description: 'Gestion du personnel et fiches détaillées', essential: true },
  { key: 'payroll', label: 'Paie & CNSS', category: 'Pilotage', defaultEnabled: true, description: 'Calculs de paie conformes Guinée (CNSS, ITS)', essential: true },
  { key: 'leaves', label: 'Congés & absences', category: 'Pilotage', defaultEnabled: true, description: 'Demandes, validation, soldes', essential: true },
  { key: 'settings', label: 'Paramètres', category: 'Pilotage', defaultEnabled: true, description: 'Configuration société et modules', essential: true },

  // === Pilotage avancé ===
  { key: 'pilotage', label: 'Pilotage consolidé', category: 'Pilotage', defaultEnabled: true, description: 'Vue multi-sociétés consolidée' },
  { key: 'customdash', label: 'Dashboard custom', category: 'Pilotage', defaultEnabled: false, description: 'Tableaux de bord personnalisables' },
  { key: 'calendar', label: 'Calendrier global', category: 'Pilotage', defaultEnabled: true, description: 'Calendrier RH partagé' },
  { key: 'time', label: 'Temps & présence', category: 'Pilotage', defaultEnabled: true, description: 'Pointage, entrées/sorties' },
  { key: 'geo', label: 'Géolocalisation', category: 'Pilotage', defaultEnabled: false, description: 'Suivi géolocalisé des équipes terrain' },
  { key: 'budget', label: 'Budget RH', category: 'Pilotage', defaultEnabled: true, description: 'Prévisions et suivi budgétaire' },
  { key: 'expenses', label: 'Notes de frais', category: 'Pilotage', defaultEnabled: true, description: 'Soumission et validation des frais' },
  { key: 'loans', label: 'Prêts & Avances', category: 'Pilotage', defaultEnabled: false, description: 'Gestion des prêts employés' },
  { key: 'shifts', label: 'Planning équipe', category: 'Pilotage', defaultEnabled: false, description: 'Planning shifts et rotations' },
  { key: 'accounting', label: 'Comptabilité', category: 'Pilotage', defaultEnabled: false, description: 'Export FEC, intégrations comptables' },
  { key: 'referential', label: 'Référentiel', category: 'Pilotage', defaultEnabled: false, description: 'Données de référence (postes, grades)' },

  // === Talent ===
  { key: 'recruitment', label: 'Recrutement', category: 'Talent', defaultEnabled: true, description: 'Pipeline candidats et entretiens' },
  { key: 'joboffers', label: 'Offres d\'emploi', category: 'Talent', defaultEnabled: true, description: 'Publication et gestion des offres' },
  { key: 'evaluations', label: 'Évaluations', category: 'Talent', defaultEnabled: true, description: 'Entretiens annuels et semestriels' },
  { key: 'orgchart', label: 'Organigramme', category: 'Talent', defaultEnabled: true, description: 'Structure hiérarchique visuelle' },
  { key: 'training', label: 'Formations', category: 'Talent', defaultEnabled: true, description: 'Planification et suivi des formations' },
  { key: 'skills', label: 'Compétences', category: 'Talent', defaultEnabled: false, description: 'Matrice de compétences et évaluations' },
  { key: 'onboarding', label: 'Onboarding', category: 'Talent', defaultEnabled: false, description: 'Checklist arrivée nouveaux employés' },
  { key: 'satisfaction', label: 'Satisfaction', category: 'Talent', defaultEnabled: false, description: 'Enquêtes de satisfaction employés' },
  { key: 'interviews', label: 'Entretiens', category: 'Talent', defaultEnabled: false, description: 'Planification des entretiens RH' },
  { key: 'career', label: 'Carrières', category: 'Talent', defaultEnabled: false, description: 'Plans de développement de carrière' },
  { key: 'mentoring', label: 'Mentorat', category: 'Talent', defaultEnabled: false, description: 'Programme de mentorat' },
  { key: 'feedback360', label: 'Feedback 360°', category: 'Talent', defaultEnabled: false, description: 'Évaluations multi-sources' },

  // === IA & Analytique ===
  { key: 'ai', label: 'IA & Documents', category: 'IA & Analytique', defaultEnabled: true, description: 'Génération de contrats et documents par IA' },
  { key: 'chatbot', label: 'Chatbot RH', category: 'IA & Analytique', defaultEnabled: true, description: 'Assistant conversationnel RH' },
  { key: 'analytics', label: 'Analytics', category: 'IA & Analytique', defaultEnabled: true, description: 'Tableaux de bord analytiques avancés' },
  { key: 'ai-insights', label: 'Insights IA', category: 'IA & Analytique', defaultEnabled: false, description: 'Prédictions et recommandations IA' },
  { key: 'forecasts', label: 'Prévisions', category: 'IA & Analytique', defaultEnabled: false, description: 'Prévisions effectif et turnover' },
  { key: 'predictive', label: 'IA prédictive', category: 'IA & Analytique', defaultEnabled: false, description: 'Modèles prédictifs RH' },

  // === Conformité & Sécurité ===
  { key: 'compliance', label: 'Conformité', category: 'Conformité', defaultEnabled: true, description: 'Suivi des obligations légales et CNSS' },
  { key: 'audit', label: 'Audit', category: 'Conformité', defaultEnabled: true, description: 'Journal d\'audit des actions' },
  { key: 'vault', label: 'Coffre-fort', category: 'Conformité', defaultEnabled: true, description: 'Documents confidentiels chiffrés' },
  { key: 'signature', label: 'Signature électronique', category: 'Conformité', defaultEnabled: false, description: 'Signature de documents en ligne' },
  { key: 'contracts-mgmt', label: 'Gestion contrats', category: 'Conformité', defaultEnabled: false, description: 'Cycle de vie des contrats' },
  { key: 'doc-traceability', label: 'Traçabilité docs', category: 'Conformité', defaultEnabled: false, description: 'Suivi et traçabilité documentaire' },
  { key: 'risks', label: 'Risques', category: 'Conformité', defaultEnabled: false, description: 'Cartographie des risques RH' },
  { key: 'data-governance', label: 'Gouvernance données', category: 'Conformité', defaultEnabled: false, description: 'RGPD et gouvernance des données' },
  { key: 'blockchain', label: 'Blockchain', category: 'Conformité', defaultEnabled: false, description: 'Certification blockchain des documents' },

  // === Communication ===
  { key: 'notifications', label: 'Notifications', category: 'Communication', defaultEnabled: true, description: 'Centre de notifications' },
  { key: 'announcements', label: 'Annonces', category: 'Communication', defaultEnabled: true, description: 'Annonces internes' },
  { key: 'helpdesk', label: 'Helpdesk', category: 'Communication', defaultEnabled: false, description: 'Tickets de support interne' },
  { key: 'portal', label: 'Portail employé', category: 'Communication', defaultEnabled: false, description: 'Espace self-service employé' },

  // === Bien-être & Vie sociale ===
  { key: 'health', label: 'Santé', category: 'Bien-être', defaultEnabled: false, description: 'Dossiers médicaux et visites' },
  { key: 'wellness', label: 'Bien-être', category: 'Bien-être', defaultEnabled: false, description: 'Défis wellness et programmes' },
  { key: 'benefits', label: 'Avantages', category: 'Bien-être', defaultEnabled: false, description: 'Gestion des avantages sociaux' },
  { key: 'cse', label: 'CSE', category: 'Bien-être', defaultEnabled: false, description: 'Comité social d\'entreprise' },
  { key: 'diversity', label: 'Diversité', category: 'Bien-être', defaultEnabled: false, description: 'Suivi de la diversité et inclusion' },
  { key: 'wellness_language', label: 'Langues', category: 'Bien-être', defaultEnabled: false, description: 'Cours de langues pour employés' },

  // === Communication externe ===
  { key: 'international', label: 'International', category: 'Communication', defaultEnabled: false, description: 'Gestion des expatriés et visas' },
  { key: 'rse', label: 'RSE', category: 'Communication', defaultEnabled: false, description: 'Responsabilité sociétale' },
  { key: 'crisis', label: 'Gestion de crise', category: 'Communication', defaultEnabled: false, description: 'Plans et procédures de crise' },

  // === Administration ===
  { key: 'exports', label: 'Exports', category: 'Administration', defaultEnabled: true, description: 'Exports CSV, Excel, PDF' },
  { key: 'custom-reports', label: 'Rapports custom', category: 'Administration', defaultEnabled: false, description: 'Rapports personnalisés' },
  { key: 'reports', label: 'Rapports DG', category: 'Administration', defaultEnabled: true, description: 'Rapports pour la direction' },
  { key: 'webhooks', label: 'Webhooks', category: 'Administration', defaultEnabled: false, description: 'Intégrations API sortantes' },
  { key: 'advsettings', label: 'Paramètres avancés', category: 'Administration', defaultEnabled: false, description: 'Configuration avancée' },
  { key: 'gamification', label: 'Gamification', category: 'Administration', defaultEnabled: false, description: 'Badges et points' },
  { key: 'rh-projects', label: 'Projets RH', category: 'Administration', defaultEnabled: false, description: 'Gestion de projets RH' },
  { key: 'contractors', label: 'Prestataires', category: 'Administration', defaultEnabled: false, description: 'Gestion des prestataires externes' },
  { key: 'equipment', label: 'Équipements', category: 'Administration', defaultEnabled: false, description: 'Inventaire matériel attribué' },
  { key: 'conflicts', label: 'Conflits', category: 'Administration', defaultEnabled: false, description: 'Gestion des conflits au travail' },
]

/**
 * Retourne la liste des clés de modules activés par défaut.
 */
export function getDefaultEnabledModules(): string[] {
  return MODULE_CATALOG.filter(m => m.defaultEnabled).map(m => m.key)
}

/**
 * Retourne la liste de tous les modules essentiels (non désactivables).
 */
export function getEssentialModules(): string[] {
  return MODULE_CATALOG.filter(m => m.essential).map(m => m.key)
}

/**
 * Parse le champ `features` d'une société (JSON string) et retourne
 * un Set des clés de modules activés.
 *
 * Si `features` est null ou vide, retourne les modules par défaut.
 */
export function parseEnabledModules(features: string | null): Set<string> {
  if (!features) {
    return new Set(getDefaultEnabledModules())
  }
  try {
    const parsed = JSON.parse(features)
    if (!parsed || typeof parsed !== 'object') {
      return new Set(getDefaultEnabledModules())
    }
    // Les modules essentiels sont toujours activés
    const essentials = getEssentialModules()
    const enabled = new Set<string>(essentials)
    for (const [key, value] of Object.entries(parsed)) {
      if (value === true) enabled.add(key)
    }
    return enabled
  } catch {
    return new Set(getDefaultEnabledModules())
  }
}

/**
 * Sérialise un objet de features en JSON string pour stockage en base.
 */
export function serializeFeatures(enabledKeys: string[]): string {
  const features: Record<string, boolean> = {}
  // S'assurer que les essentiels sont toujours true
  const essentials = new Set(getEssentialModules())
  for (const key of enabledKeys) {
    features[key] = true
  }
  // Marquer explicitement les essentiels
  for (const e of essentials) {
    features[e] = true
  }
  return JSON.stringify(features)
}

/**
 * Retourne les modules groupés par catégorie (pour l'UI de gestion).
 */
export function getModulesByCategory(): Array<{
  category: string
  modules: ModuleDef[]
}> {
  const categories: Record<string, ModuleDef[]> = {}
  for (const mod of MODULE_CATALOG) {
    if (!categories[mod.category]) categories[mod.category] = []
    categories[mod.category].push(mod)
  }
  return Object.entries(categories).map(([category, modules]) => ({
    category,
    modules: modules.sort((a, b) => a.label.localeCompare(b.label)),
  }))
}
