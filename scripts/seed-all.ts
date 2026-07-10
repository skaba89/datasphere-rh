import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
const db = new PrismaClient()

function randomHex(len: number) { return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('') }
function randomDate(offsetDays: number) { const d = new Date(); d.setDate(d.getDate() + offsetDays); return d.toISOString() }

async function seedRag(companyId: string) {
  const docs = [
    { source: 'policy', title: 'Politique de télétravail', content: `# Politique de télétravail\n\n## 1. Principe\nLe télétravail est autorisé pour tous les employés en CDI ayant au moins 3 mois d'ancienneté. Il est limité à 2 jours par semaine en moyenne.\n\n## 2. Éligibilité\n- Employés en CDI avec au moins 3 mois d'ancienneté\n- Postes compatibles\n- Performance satisfaisante (évaluation >= 3/5)\n\n## 3. Demande\nL'employé doit faire une demande écrite à son manager au moins 15 jours avant. Le manager répond sous 7 jours.\n\n## 4. Organisation\n- Maximum 2 jours par semaine\n- Au moins 3 jours en présentiel obligatoires\n- Présence obligatoire lors des réunions d'équipe\n\n## 5. Équipement\nL'entreprise fournit un ordinateur portable et une connexion internet remboursée jusqu'à 200 000 GNF/mois.` },
    { source: 'policy', title: 'Politique de congés', content: `# Politique de congés\n\n## Congés payés annuels\n- 30 jours calendaires par an (2,5 jours par mois)\n- Pris par période de 5 jours minimum\n- Pose au moins 30 jours à l'avance\n\n## Congé maternité\n- 14 semaines (6 avant, 8 après)\n- 100% du salaire payé par la CNSS\n\n## Congé paternité\n- 3 jours consécutifs à la naissance\n\n## Congé maladie\n- Justificatif médical obligatoire sous 48h\n- Plein salaire pendant 1 mois, demi-salaire le 2e\n\n## Périodes de fermeture\nL'entreprise ferme du 24 décembre au 2 janvier inclus.` },
    { source: 'faq', title: 'FAQ RH - Questions fréquentes', content: `# FAQ RH\n\nQ: Quand suis-je payé ?\nR: Le 28 de chaque mois.\n\nQ: Comment calculer mon salaire net ?\nR: Salaire brut - 5% CNSS - 1,5% ITS = salaire net imposable.\n\nQ: Combien de congés me reste-t-il ?\nR: Consultez votre solde dans le portail employé.\n\nQ: Puis-je reporter mes congés non pris ?\nR: Oui, jusqu'au 31 mars de l'année suivante.\n\nQ: Comment demander une attestation d'employeur ?\nR: Faites la demande dans le portail employé. Délai : 3 jours ouvrés.` },
    { source: 'law', title: 'Code du travail guinéen - Extraits', content: `# Code du travail guinéen (Loi L/2014/072/AN)\n\n## Article L.42 - CDD\nLe CDD ne peut être conclu que pour : remplacement, surcroît d'activité, emplois saisonniers. Durée maximale : 24 mois.\n\n## Article L.55 - Période d'essai\n- Ouvriers : 1 mois\n- Agents de maîtrise : 2 mois\n- Cadres : 3 mois\n\n## Article L.83 - Congés payés\n30 jours calendaires par an (2,5 jours par mois).\n\n## Article L.121 - Préavis\n- Ouvriers : 1 mois\n- Cadres : 3 mois\n\n## Article L.150 - Heures supplémentaires\nMajoration de 25% pour les 8 premières heures, 50% au-delà.\n\n## CNSS\n- Taux salarié : 5% (plafonné à 1 000 000 GNF)\n- Taux employeur : 17%\n- ITS : 1,5%` },
    { source: 'manual', title: 'Manuel d\'onboarding', content: `# Manuel d'onboarding\n\n## Jour 1\n9h00 : Accueil par le RH (signature contrat, remise badge)\n10h00 : Rencontre avec le manager\n14h00 : Configuration poste de travail\n\n## Semaine 1\n- Formation produit (2 jours)\n- Shadowing (1 jour)\n- Bilan avec manager (vendredi)\n\n## Documents à fournir\n- Pièce d'identité\n- Photo d'identité\n- Numéro CNSS\n- Extrait de naissance\n- Casier judiciaire` },
  ]
  
  for (const doc of docs) {
    const chunks = doc.content.length <= 2000 ? [doc.content] : doc.content.split(/\n\n+/).reduce((acc: string[], p) => { const last = acc[acc.length-1]; if (last && (last+'\n\n'+p).length <= 2000) acc[acc.length-1] = last+'\n\n'+p; else acc.push(p); return acc }, [])
    for (let i = 0; i < chunks.length; i++) {
      await db.documentChunk.create({ data: { companyId, source: doc.source, title: doc.title, content: chunks[i], chunkIndex: i } })
    }
  }
  console.log(`  ✓ RAG: ${docs.length} documents indexés`)
}

async function seedContracts(companyId: string) {
  const existing = await db.contractSupplier.count({ where: { companyId } })
  if (existing > 0) { console.log('  ⊘ Contrats déjà présents'); return }
  const contracts = [
    { title: 'Maintenance ERP SAP', supplier: 'DataSphere Guinea', type: 'PRESTATION_IT', amount: 450000000, clauses: 12, status: 'ACTIF', daysEnd: 185, daysRenewal: 30, owner: 'Aïcha Diallo', alerts: 0, desc: 'Maintenance applicative et support N3 du ERP' },
    { title: 'Audit financier annuel', supplier: 'KPMG Guinea', type: 'AUDIT', amount: 180000000, clauses: 8, status: 'ACTIF', daysEnd: 305, daysRenewal: 60, owner: 'Mamadou Camara', alerts: 0, desc: 'Audit des comptes annuels' },
    { title: 'Assurance multi-risques', supplier: 'NSIA Assurance', type: 'ASSURANCE', amount: 95000000, clauses: 15, status: 'EXPIRE_BIENTOT', daysEnd: 65, daysRenewal: 15, owner: 'Fatou Touré', alerts: 2, desc: 'Police flotte automobile + locaux' },
    { title: 'Cybersécurité pentest', supplier: 'Sentry Africa', type: 'PRESTATION_IT', amount: 125000000, clauses: 9, status: 'EXPIRE_BIENTOT', daysEnd: 25, daysRenewal: 20, owner: 'Lamine Barry', alerts: 3, desc: 'Tests d\'intrusion annuels' },
    { title: 'Formation management', supplier: 'Institut PME', type: 'FORMATION', amount: 45000000, clauses: 6, status: 'ACTIF', daysEnd: 335, owner: 'Sékou Traoré', alerts: 0, desc: 'Programme formation cadres (5 sessions)' },
    { title: 'Connectivité fibre + SD-WAN', supplier: 'Orange Business', type: 'TELECOM', amount: 72000000, clauses: 10, status: 'ACTIF', daysEnd: 245, daysRenewal: 45, owner: 'Lamine Barry', alerts: 0, desc: '2 liens fibre 1Gbps + SD-WAN multi-sites' },
    { title: 'Assurance santé collective', supplier: 'Saham Assurance', type: 'ASSURANCE', amount: 220000000, clauses: 14, status: 'ACTIF', daysEnd: 320, daysRenewal: 75, owner: 'Fatou Touré', alerts: 0, desc: 'Mutuelle santé 100% employés' },
    { title: 'Aménagement bureaux', supplier: 'BTP Guinea', type: 'TRAVAUX', amount: 320000000, clauses: 18, status: 'EXPIRE', daysEnd: -35, owner: 'Aïcha Diallo', alerts: 1, desc: 'Aménagement 3e étage (terminé)' },
  ]
  for (const c of contracts) {
    await db.contractSupplier.create({ data: { companyId, title: c.title, supplier: c.supplier, type: c.type, description: c.desc, amount: c.amount, currency: 'GNF', clauses: c.clauses, startDate: randomDate(-180), endDate: randomDate(c.daysEnd), renewalDate: c.daysRenewal !== null ? randomDate(c.daysRenewal) : null, status: c.status, owner: c.owner, alerts: c.alerts, txHash: '0x' + randomHex(64) } })
  }
  console.log(`  ✓ Contrats: ${contracts.length} créés`)
}

async function seedCertificates(companyId: string) {
  const existing = await db.certificate.count({ where: { companyId } })
  if (existing > 0) { console.log('  ⊘ Certificats déjà présents'); return }
  const employees = await db.employee.findMany({ where: { companyId }, take: 8 })
  const certTypes = [
    { title: 'Attestation d\'employeur', type: 'ATTESTATION', signer: 'Aïcha Diallo', role: 'RH' },
    { title: 'Contrat de travail CDI', type: 'CONTRAT', signer: 'Mamadou Camara', role: 'DRH' },
    { title: 'Bulletin de paie Juin 2026', type: 'BULLETIN', signer: 'Comptabilité', role: 'COMPTA' },
    { title: 'Certificat de travail', type: 'CERTIFICAT', signer: 'Aïcha Diallo', role: 'RH' },
    { title: 'Attestation CNSS', type: 'ATTESTATION', signer: 'Fatou Touré', role: 'JURIDIQUE' },
  ]
  for (let i = 0; i < certTypes.length; i++) {
    const cert = certTypes[i]; const emp = employees[i % employees.length]
    await db.certificate.create({ data: { companyId, documentTitle: `${cert.title} - ${emp ? emp.nom + ' ' + emp.prenoms : 'Employé'}`, documentType: cert.type, hash: randomHex(64), txHash: '0x' + randomHex(64), blockNumber: 18500000 + i * 1234, qrToken: randomHex(16), signerName: cert.signer, signerRole: cert.role, employeeId: emp?.id || null, employeeName: emp ? `${emp.nom} ${emp.prenoms}` : null, status: 'ACTIVE', immutable: true, timestamp: new Date(Date.now() - i * 86400000) } })
  }
  console.log(`  ✓ Certificats: ${certTypes.length} créés`)
}

async function seedWebhook(companyId: string) {
  const existing = await db.webhookConfig.count({ where: { companyId } })
  if (existing > 0) { console.log('  ⊘ Webhook déjà présent'); return }
  await db.webhookConfig.create({ data: { companyId, name: 'Slack RH (démo)', url: 'https://hooks.slack.com/services/T000/B000/XXX', events: JSON.stringify(['contract.renewed', 'certificate.revoked', 'model.trained']), isActive: true, secret: 'whsec_demo_12345' } })
  console.log('  ✓ Webhook: 1 créé')
}

async function main() {
  console.log('🌱 Seed complet (RAG + Contrats + Certificats + Webhook)…')
  const company = await db.company.findFirst()
  if (!company) { console.error('❌ Aucune société'); process.exit(1) }
  await seedRag(company.id)
  await seedContracts(company.id)
  await seedCertificates(company.id)
  await seedWebhook(company.id)
  console.log('✅ Seed terminé')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
