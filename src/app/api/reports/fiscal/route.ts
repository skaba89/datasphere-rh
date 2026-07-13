import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatGNF } from '@/lib/utils-rh'

/**
 * GET /api/reports/fiscal?type=cnss_monthly&month=2026-07
 * GET /api/reports/fiscal?type=its_annual&year=2026
 * GET /api/reports/fiscal?type=solde_tout_compte&employeeId=xxx
 *
 * Génère les rapports fiscaux guinéens :
 * - cnss_monthly : Déclaration mensuelle CNSS
 * - its_annual : Déclaration annuelle ITS
 * - solde_tout_compte : Reçu pour solde de tout compte
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const month = searchParams.get('month') // YYYY-MM
    const year = searchParams.get('year') // YYYY
    const employeeId = searchParams.get('employeeId')

    if (!type) {
      return NextResponse.json({ error: 'Type de rapport requis (cnss_monthly, its_annual, solde_tout_compte)' }, { status: 400 })
    }

    // Récupérer la société (première pour démo, sinon depuis la session)
    const company = await db.company.findFirst({
      include: { _count: { select: { employees: true } } },
    })
    if (!company) {
      return NextResponse.json({ error: 'Aucune société configurée' }, { status: 404 })
    }

    let report: any

    switch (type) {
      case 'cnss_monthly':
        if (!month) return NextResponse.json({ error: 'Mois requis (format YYYY-MM)' }, { status: 400 })
        report = await generateCnssMonthlyDeclaration(company, month)
        break

      case 'its_annual':
        if (!year) return NextResponse.json({ error: 'Année requise (format YYYY)' }, { status: 400 })
        report = await generateItsAnnualDeclaration(company, year)
        break

      case 'solde_tout_compte':
        if (!employeeId) return NextResponse.json({ error: 'employeeId requis' }, { status: 400 })
        report = await generateSoldeToutCompte(company, employeeId)
        break

      default:
        return NextResponse.json({ error: 'Type de rapport non supporté' }, { status: 400 })
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'GENERATE_FISCAL_REPORT',
        entityType: 'fiscal_report',
        entityId: type,
        userId: 'system',
        diff: JSON.stringify({ after: { type, month, year, employeeId } }),
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('GET /api/reports/fiscal error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération du rapport' }, { status: 500 })
  }
}

/**
 * Déclaration mensuelle CNSS — Format conforme Guinée
 * Cotisations : 5% salarié + 17% employeur (plafonné à 8×SMIG = 4 640 000 GNF)
 */
async function generateCnssMonthlyDeclaration(company: any, month: string) {
  const employees = await db.employee.findMany({
    where: { companyId: company.id, statut: 'actif' },
    include: { contracts: { where: { status: 'ACTIF' }, take: 1 } },
  })

  const [year, monthNum] = month.split('-')
  const monthLabel = new Date(parseInt(year), parseInt(monthNum) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const plafondCnss = 4640000
  const tauxSalarie = 0.05
  const tauxEmployeur = 0.17

  const lignes = employees.map(emp => {
    const contract = emp.contracts[0]
    const salaireBrut = contract?.salaireBase || 0
    const assiette = Math.min(salaireBrut, plafondCnss)
    const cotisationSalarie = Math.round(assiette * tauxSalarie)
    const cotisationEmployeur = Math.round(assiette * tauxEmployeur)
    return {
      matricule: emp.matricule,
      nom: emp.nom,
      prenoms: emp.prenoms,
      cnssNumero: emp.cnssNumero || '—',
      salaireBrut,
      assietteCnss: assiette,
      cotisationSalarie,
      cotisationEmployeur,
      total: cotisationSalarie + cotisationEmployeur,
    }
  })

  const totalSalaireBrut = lignes.reduce((s, l) => s + l.salaireBrut, 0)
  const totalAssiette = lignes.reduce((s, l) => s + l.assietteCnss, 0)
  const totalSalarie = lignes.reduce((s, l) => s + l.cotisationSalarie, 0)
  const totalEmployeur = lignes.reduce((s, l) => s + l.cotisationEmployeur, 0)

  return {
    type: 'cnss_monthly',
    title: 'Déclaration Mensuelle CNSS',
    subtitle: `Caisse Nationale de Sécurité Sociale — République de Guinée`,
    company: {
      raisonSociale: company.raisonSociale,
      nif: company.nif,
      rc: company.rc,
      cnssNumero: company.cnssNumero,
      adresse: company.adresse,
    },
    period: { month, label: monthLabel },
    rates: { tauxSalarie: '5%', tauxEmployeur: '17%', plafond: plafondCnss },
    lignes,
    totals: {
      effectif: lignes.length,
      totalSalaireBrut,
      totalAssiette,
      totalCotisationSalarie: totalSalarie,
      totalCotisationEmployeur: totalEmployeur,
      totalGeneral: totalSalarie + totalEmployeur,
    },
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Déclaration annuelle ITS — Impôt sur le Salaire (1,5%)
 * + Versement forfaitaire (4%) + Taxe apprentissage (1%) + Formation pro (3%)
 */
async function generateItsAnnualDeclaration(company: any, year: string) {
  const employees = await db.employee.findMany({
    where: { companyId: company.id, statut: 'actif' },
    include: { contracts: { where: { status: 'ACTIF' }, take: 1 } },
  })

  const lignes = employees.map(emp => {
    const contract = emp.contracts[0]
    const salaireBrut = (contract?.salaireBase || 0) * 12
    const its = Math.round(salaireBrut * 0.015)
    const versementForfaitaire = Math.round(salaireBrut * 0.04)
    const taxeApprentissage = Math.round(salaireBrut * 0.01)
    const formationPro = Math.round(salaireBrut * 0.03)
    const accidentTravail = Math.round(salaireBrut * 0.02)
    return {
      matricule: emp.matricule,
      nom: emp.nom,
      prenoms: emp.prenoms,
      salaireAnnuelBrut: salaireBrut,
      its,
      versementForfaitaire,
      taxeApprentissage,
      formationPro,
      accidentTravail,
      totalCharges: its + versementForfaitaire + taxeApprentissage + formationPro + accidentTravail,
    }
  })

  const totals = {
    effectif: lignes.length,
    totalSalaireAnnuelBrut: lignes.reduce((s, l) => s + l.salaireAnnuelBrut, 0),
    totalIts: lignes.reduce((s, l) => s + l.its, 0),
    totalVersementForfaitaire: lignes.reduce((s, l) => s + l.versementForfaitaire, 0),
    totalTaxeApprentissage: lignes.reduce((s, l) => s + l.taxeApprentissage, 0),
    totalFormationPro: lignes.reduce((s, l) => s + l.formationPro, 0),
    totalAccidentTravail: lignes.reduce((s, l) => s + l.accidentTravail, 0),
  }
  totals.totalGeneral = totals.totalIts + totals.totalVersementForfaitaire + totals.totalTaxeApprentissage + totals.totalFormationPro + totals.totalAccidentTravail

  return {
    type: 'its_annual',
    title: 'Déclaration Annuelle des Charges Sociales et Fiscales',
    subtitle: `Impôt sur le Salaire (ITS) + Versement Forfaitaire + Taxes — Exercice ${year}`,
    company: {
      raisonSociale: company.raisonSociale,
      nif: company.nif,
      rc: company.rc,
      cnssNumero: company.cnssNumero,
      adresse: company.adresse,
    },
    period: { year, label: `Année ${year}` },
    rates: {
      its: '1,5%',
      versementForfaitaire: '4%',
      taxeApprentissage: '1%',
      formationPro: '3%',
      accidentTravail: '2%',
    },
    lignes,
    totals,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Reçu pour solde de tout compte — Document légal de fin de contrat
 */
async function generateSoldeToutCompte(company: any, employeeId: string) {
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { contracts: { orderBy: { dateDebut: 'desc' }, take: 1 } },
  })

  if (!employee) {
    throw new Error('Employé introuvable')
  }

  const contract = employee.contracts[0]
  const salaireBase = contract?.salaireBase || 0
  const today = new Date()
  const dateFin = today.toISOString().slice(0, 10)

  // Calcul des éléments du solde de tout compte
  const salaireBrutMois = Math.round(salaireBase / 30 * 15) // 15 jours travaillés (exemple)
  const primes = 0
  const congesPayes = Math.round(salaireBase / 30 * 2.5) // 2,5 jours de congés acquis non pris
  const indemniteFinContrat = contract?.type === 'CDD' ? Math.round(salaireBase * 0.06) : 0 // 6% pour CDD
  const indemniteCompensatrice = Math.round(salaireBase / 30 * 5) // préavis 5 jours

  const totalBrut = salaireBrutMois + primes + congesPayes + indemniteFinContrat + indemniteCompensatrice

  // Retenues
  const cnssSalarie = Math.round(Math.min(totalBrut, 4640000) * 0.05)
  const its = Math.round(totalBrut * 0.015)
  const totalRetenues = cnssSalarie + its

  const netAPayer = totalBrut - totalRetenues

  return {
    type: 'solde_tout_compte',
    title: 'Reçu pour Solde de Tout Compte',
    subtitle: 'Conforme au Code du travail guinéen (Loi L/2014/072/AN)',
    company: {
      raisonSociale: company.raisonSociale,
      nif: company.nif,
      rc: company.rc,
      cnssNumero: company.cnssNumero,
      adresse: company.adresse,
    },
    employee: {
      matricule: employee.matricule,
      nom: employee.nom,
      prenoms: employee.prenoms,
      poste: employee.poste,
      dateEmbauche: employee.dateEmbauche,
      dateFin,
      typeContrat: contract?.type || 'CDI',
      cnssNumero: employee.cnssNumero || '—',
    },
    elements: {
      salaireBrutMois,
      primes,
      congesPayes,
      indemniteFinContrat,
      indemniteCompensatrice,
      totalBrut,
      retenues: {
        cnssSalarie,
        its,
        totalRetenues,
      },
      netAPayer,
    },
    formattedElements: {
      salaireBrutMois: formatGNF(salaireBrutMois),
      primes: formatGNF(primes),
      congesPayes: formatGNF(congesPayes),
      indemniteFinContrat: formatGNF(indemniteFinContrat),
      indemniteCompensatrice: formatGNF(indemniteCompensatrice),
      totalBrut: formatGNF(totalBrut),
      cnssSalarie: formatGNF(cnssSalarie),
      its: formatGNF(its),
      totalRetenues: formatGNF(totalRetenues),
      netAPayer: formatGNF(netAPayer),
    },
    mention: `J'ai reçu de la société ${company.raisonSociale} la somme de ${formatGNF(netAPayer)} ci-dessus indiquée, formant solde de tout compte de mon contrat de travail. Je donne quitus à l'employeur sans réserve.`,
    generatedAt: new Date().toISOString(),
  }
}
