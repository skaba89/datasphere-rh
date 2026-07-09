import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      nom, prenoms, matricule, cnss, poste, contratType,
      dateEmbauche, periode, salaireBase, primes, heuresSup,
      avantagesNature, indemnitesNonImposables, retenuesDiverses,
      salaireBrut, salaireBrutImposable, cnssSalarie, cnssEmployeur,
      rts, versementForfaitaire, taxeApprentissage, formationPro,
      accidentTravail, totalChargesPatronales, netAPayer, coutTotalEmployeur,
    } = body

    // Génère un hash de signature simulé (SHA-256 du contenu)
    const signatureHash = crypto.createHash('sha256')
      .update(JSON.stringify(body) + Date.now())
      .digest('hex')

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'payslip',
        entityId: signatureHash,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({
          after: { employee: `${nom} ${prenoms}`, periode, netAPayer, signatureHash: signatureHash.slice(0, 16) + '...' }
        }),
      },
    })

    // Générer HTML imprimable
    const fmtGNF = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' GNF'

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bulletin de paie — ${nom} ${prenoms} — ${periode}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #202224; padding: 30px; font-size: 12px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #27698a; margin-bottom: 20px; }
  .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #27698a, #435862); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; }
  .company { flex: 1; margin-left: 15px; }
  .company h1 { font-size: 18px; color: #202224; }
  .company p { font-size: 10px; color: #747a7e; margin-top: 2px; }
  .period { text-align: right; }
  .period h2 { font-size: 16px; color: #27698a; }
  .period p { font-size: 10px; color: #747a7e; margin-top: 2px; }

  .employee-block { background: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #27698a; }
  .employee-block h3 { font-size: 13px; margin-bottom: 8px; color: #202224; }
  .employee-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 11px; }
  .employee-info div { }
  .employee-info .label { color: #747a7e; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
  .employee-info .value { color: #202224; font-weight: 500; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #435862; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
  th.amount { text-align: right; }
  td { padding: 6px 10px; border-bottom: 1px solid #e7e8e9; font-size: 11px; }
  td.amount { text-align: right; font-family: monospace; }
  tr.total td { background: #eff6ff; font-weight: bold; border-top: 2px solid #27698a; }
  tr.net td { background: #f0fdf4; font-weight: bold; font-size: 13px; border-top: 2px solid #478e5e; }

  .section-title { background: #f3f4f5; padding: 6px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #435862; }

  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e7e8e9; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #747a7e; }
  .signature { text-align: right; }
  .signature .hash { font-family: monospace; color: #27698a; font-weight: bold; }

  @media print {
    body { padding: 15px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">DS</div>
    <div class="company">
      <h1>Demo SARL</h1>
      <p>NIF: GN-CONAKRY-001-2024 · RC: RC/Conakry/2024/A-001<br/>
      CNSS: CNSS-001-2024 · Hamdallaye, Conakry</p>
    </div>
    <div class="period">
      <h2>BULLETIN DE PAIE</h2>
      <p>Période : ${periode}<br/>Émis le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
  </div>

  <div class="employee-block">
    <h3>Employé</h3>
    <div class="employee-info">
      <div><div class="label">Nom complet</div><div class="value">${nom} ${prenoms}</div></div>
      <div><div class="label">Matricule</div><div class="value">${matricule}</div></div>
      <div><div class="label">Numéro CNSS</div><div class="value">${cnss || '—'}</div></div>
      <div><div class="label">Poste</div><div class="value">${poste}</div></div>
      <div><div class="label">Type de contrat</div><div class="value">${contratType}</div></div>
      <div><div class="label">Date d'embauche</div><div class="value">${dateEmbauche}</div></div>
      <div><div class="label">Période</div><div class="value">${periode}</div></div>
      <div><div class="label">Devise</div><div class="value">GNF</div></div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Rubrique</th><th class="amount">Base</th><th class="amount">Taux</th><th class="amount">Montant</th></tr>
    </thead>
    <tbody>
      <tr><td colspan="4" class="section-title">GAINS</td></tr>
      <tr><td>Salaire de base</td><td class="amount">—</td><td class="amount">—</td><td class="amount">${fmtGNF(salaireBase)}</td></tr>
      ${primes > 0 ? `<tr><td>Primes imposables</td><td class="amount">—</td><td class="amount">—</td><td class="amount">${fmtGNF(primes)}</td></tr>` : ''}
      ${heuresSup > 0 ? `<tr><td>Heures supplémentaires (majoré)</td><td class="amount">—</td><td class="amount">—</td><td class="amount">${fmtGNF(heuresSup)}</td></tr>` : ''}
      ${avantagesNature > 0 ? `<tr><td>Avantages en nature</td><td class="amount">—</td><td class="amount">—</td><td class="amount">${fmtGNF(avantagesNature)}</td></tr>` : ''}
      ${indemnitesNonImposables > 0 ? `<tr><td>Indemnités non imposables</td><td class="amount">—</td><td class="amount">—</td><td class="amount">${fmtGNF(indemnitesNonImposables)}</td></tr>` : ''}
      <tr class="total"><td>Salaire brut</td><td class="amount"></td><td class="amount"></td><td class="amount">${fmtGNF(salaireBrut)}</td></tr>
      <tr class="total"><td>Salaire brut imposable</td><td class="amount"></td><td class="amount"></td><td class="amount">${fmtGNF(salaireBrutImposable)}</td></tr>

      <tr><td colspan="4" class="section-title">RETENUES SALARIÉ</td></tr>
      <tr><td>CNSS salarié</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">5,00%</td><td class="amount">-${fmtGNF(cnssSalarie)}</td></tr>
      <tr><td>RTS (impôt sur salaire)</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">1,00%</td><td class="amount">-${fmtGNF(rts)}</td></tr>
      ${retenuesDiverses > 0 ? `<tr><td>Retenues diverses</td><td class="amount">—</td><td class="amount">—</td><td class="amount">-${fmtGNF(retenuesDiverses)}</td></tr>` : ''}

      <tr class="net"><td>NET À PAYER</td><td class="amount"></td><td class="amount"></td><td class="amount">${fmtGNF(netAPayer)}</td></tr>

      <tr><td colspan="4" class="section-title">CHARGES EMPLOYEUR (informatives)</td></tr>
      <tr><td>CNSS employeur</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">8,00%</td><td class="amount">${fmtGNF(cnssEmployeur)}</td></tr>
      <tr><td>Versement forfaitaire</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">4,00%</td><td class="amount">${fmtGNF(versementForfaitaire)}</td></tr>
      <tr><td>Taxe d'apprentissage</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">1,00%</td><td class="amount">${fmtGNF(taxeApprentissage)}</td></tr>
      <tr><td>Formation professionnelle</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">3,00%</td><td class="amount">${fmtGNF(formationPro)}</td></tr>
      <tr><td>Accident du travail</td><td class="amount">${fmtGNF(salaireBrutImposable)}</td><td class="amount">2,00%</td><td class="amount">${fmtGNF(accidentTravail)}</td></tr>
      <tr class="total"><td>Total charges patronales</td><td class="amount"></td><td class="amount"></td><td class="amount">${fmtGNF(totalChargesPatronales)}</td></tr>
      <tr class="total"><td>Coût total employeur</td><td class="amount"></td><td class="amount"></td><td class="amount">${fmtGNF(coutTotalEmployeur)}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>Demo SARL · Conakry, République de Guinée</p>
      <p>Bulletin généré le ${new Date().toLocaleString('fr-FR')} UTC</p>
    </div>
    <div class="signature">
      <p>Signature électronique :</p>
      <p class="hash">${signatureHash.slice(0, 32)}...</p>
      <p style="margin-top: 4px;">SHA-256 · Horodaté UTC</p>
    </div>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="background: #27698a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 13px;">
      🖨️ Imprimer / Enregistrer en PDF
    </button>
  </div>
</body>
</html>`

    return NextResponse.json({ html, signatureHash })
  } catch (error) {
    console.error('POST /api/payroll/generate-payslip error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
