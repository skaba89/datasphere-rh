/**
 * Système de permissions RBAC.
 *
 * Rôles hiérarchiques (du plus élevé au plus bas) :
 *   SUPER_ADMIN > ADMIN_ENTREPRISE > RH > MANAGER > COMPTABLE > EMPLOYE
 *
 * En mode démo (user = null), toutes les permissions sont accordées
 * pour permettre la navigation complète.
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN_ENTREPRISE' | 'RH' | 'MANAGER' | 'COMPTABLE' | 'EMPLOYE'

const ROLE_LEVEL: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN_ENTREPRISE: 80,
  RH: 60,
  MANAGER: 40,
  COMPTABLE: 30,
  EMPLOYE: 10,
}

export type Permission =
  | 'contract.renew'        // renouveler un contrat fournisseur
  | 'contract.revoke'       // résilier un contrat
  | 'certificate.revoke'    // révoquer un certificat blockchain
  | 'certificate.issue'     // émettre un certificat
  | 'model.train'           // ré-entraîner les modèles IA
  | 'webhook.manage'        // créer/modifier/supprimer un webhook
  | 'data.export'           // exporter données (CSV, etc.)
  | 'audit.view'            // consulter le journal d'audit
  | 'audit.advanced.view'   // consulter l'audit avancé
  | 'pilotage.view'         // dashboard pilotage consolidé
  | 'user.manage'           // gérer les utilisateurs
  | 'settings.advanced'     // paramètres avancés

const PERMISSIONS: Record<Permission, Role[]> = {
  'contract.renew': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'],
  'contract.revoke': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE'],
  'certificate.revoke': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE'],
  'certificate.issue': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'],
  'model.train': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'],
  'webhook.manage': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE'],
  'data.export': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH', 'MANAGER', 'COMPTABLE'],
  'audit.view': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'],
  'audit.advanced.view': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'],
  'pilotage.view': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH', 'MANAGER'],
  'user.manage': ['SUPER_ADMIN'],
  'settings.advanced': ['SUPER_ADMIN', 'ADMIN_ENTREPRISE'],
}

/**
 * Vérifie si un rôle dispose d'une permission.
 * Si userRole est null (mode démo), retourne true.
 */
export function can(userRole: string | null | undefined, permission: Permission): boolean {
  if (!userRole) return true // mode démo
  const allowed = PERMISSIONS[permission]
  return allowed.includes(userRole as Role)
}

/**
 * Vérifie si userRole a un niveau >= au rôle requis.
 */
export function hasMinLevel(userRole: string | null | undefined, minRole: Role): boolean {
  if (!userRole) return true // mode démo
  const userLevel = ROLE_LEVEL[userRole as Role]
  const minLevel = ROLE_LEVEL[minRole]
  if (userLevel === undefined) return false
  return userLevel >= minLevel
}

/**
 * Retourne la liste des permissions d'un rôle.
 */
export function getPermissions(userRole: string | null | undefined): Permission[] {
  if (!userRole) return Object.keys(PERMISSIONS) as Permission[]
  return (Object.keys(PERMISSIONS) as Permission[]).filter(p => PERMISSIONS[p].includes(userRole as Role))
}
