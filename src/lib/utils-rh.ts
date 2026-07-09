// Utilitaires DataSphere RH Guinée

// Format montant GNF
export function formatGNF(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' GNF'
}

// Format date FR
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Format date longue
export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Types congés
export const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  CONGE_PAYE: { label: 'Congé payé', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  MALADIE: { label: 'Maladie', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  MATERNITE: { label: 'Maternité', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  PATERNITE: { label: 'Paternité', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  MARIAGE: { label: 'Mariage', color: 'bg-green-100 text-green-700 border-green-200' },
  DECES: { label: 'Décès', color: 'bg-gray-100 text-gray-700 border-gray-200' },
}

// Statuts congés
export const LEAVE_STATUS: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  APPROUVE: { label: 'Approuvé', color: 'bg-green-100 text-green-800 border-green-200' },
  REFUSE: { label: 'Refusé', color: 'bg-red-100 text-red-800 border-red-200' },
}

// Types contrats
export const CONTRACT_TYPES: Record<string, { label: string; color: string }> = {
  CDI: { label: 'CDI', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CDD: { label: 'CDD', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  STAGE: { label: 'Stage', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  PRESTATAIRE: { label: 'Prestataire', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  EXPATRIE: { label: 'Expatrié', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  APPRENTI: { label: 'Apprenti', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
}

// Calcul paie guinéenne — workflow 8 étapes
export interface PayrollInput {
  salaireBase: number
  primes: number
  heuresSup: number         // montant total majoré
  avantagesNature: number
  indemnitesNonImposables: number
  retenuesDiverses: number
  cnssParams: {
    tauxCnssSalarie: number
    tauxCnssEmployeur: number
    plafondCnss: number
    tauxRts: number
    tauxVersementForfaitaire: number
    tauxTaxeApprentissage: number
    tauxFormationPro: number
    tauxAccidentTravail: number
  }
}

export interface PayrollResult {
  salaireBrut: number
  salaireBrutImposable: number
  cnssSalarie: number
  cnssEmployeur: number
  rts: number
  versementForfaitaire: number
  taxeApprentissage: number
  formationPro: number
  accidentTravail: number
  totalChargesPatronales: number
  netAPayer: number
  coutTotalEmployeur: number
}

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const { salaireBase, primes, heuresSup, avantagesNature, indemnitesNonImposables,
    retenuesDiverses, cnssParams: p } = input

  // Étape 1-2: Brut et brut imposable
  const salaireBrut = salaireBase + primes + heuresSup + avantagesNature
  const salaireBrutImposable = salaireBrut - indemnitesNonImposables

  // Étape 3-4: CNSS salarié et employeur (plafonné)
  const assietteCnss = Math.min(salaireBrutImposable, p.plafondCnss)
  const cnssSalarie = assietteCnss * p.tauxCnssSalarie
  const cnssEmployeur = assietteCnss * p.tauxCnssEmployeur

  // Étape 5: RTS
  const rts = salaireBrutImposable * p.tauxRts

  // Étape 6: Charges patronales
  const versementForfaitaire = salaireBrutImposable * p.tauxVersementForfaitaire
  const taxeApprentissage = salaireBrutImposable * p.tauxTaxeApprentissage
  const formationPro = salaireBrutImposable * p.tauxFormationPro
  const accidentTravail = salaireBrutImposable * p.tauxAccidentTravail

  const totalChargesPatronales = cnssEmployeur + versementForfaitaire
    + taxeApprentissage + formationPro + accidentTravail

  // Étape 7: Net à payer
  const netAPayer = salaireBrutImposable - cnssSalarie - rts - retenuesDiverses + indemnitesNonImposables

  // Étape 8: Coût total employeur
  const coutTotalEmployeur = salaireBrut + totalChargesPatronales

  return {
    salaireBrut,
    salaireBrutImposable,
    cnssSalarie,
    cnssEmployeur,
    rts,
    versementForfaitaire,
    taxeApprentissage,
    formationPro,
    accidentTravail,
    totalChargesPatronales,
    netAPayer,
    coutTotalEmployeur,
  }
}
