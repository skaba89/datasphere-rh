/**
 * Exemple d'utilisation du SDK DataSphere RH.
 *
 * Usage :
 *   DATASPHERE_API_KEY=dsrh_live_xxx npx tsx sdk/examples/basic.ts
 */
import { createClient, DataSphereRHError } from '../src/index'

async function main() {
  const apiKey = process.env.DATASPHERE_API_KEY
  if (!apiKey) {
    console.error('Définissez DATASPHERE_API_KEY dans votre environnement')
    process.exit(1)
  }

  const client = createClient(apiKey, {
    baseUrl: process.env.DATASPHERE_BASE_URL || 'http://localhost:3000',
  })

  console.log('━'.repeat(60))
  console.log('  DataSphere RH SDK — Exemple')
  console.log('━'.repeat(60))

  // 1. Ping
  console.log('\n▸ 1. Test de connectivité')
  const ping = await client.ping()
  console.log(`  ${ping.valid ? '✓' : '✗'} Clé ${ping.valid ? 'valide' : 'invalide'}`)
  if (!ping.valid) {
    console.error(`  Erreur: ${ping.error}`)
    process.exit(1)
  }

  // 2. Chat
  console.log('\n▸ 2. Chat simple')
  try {
    const result = await client.chat(
      [{ role: 'user', content: 'Dis bonjour en français, en une phrase.' }],
      { maxTokens: 50 }
    )
    console.log(`  ✓ ${result.content}`)
    console.log(`  Provider: ${result.provider} · ${result.durationMs}ms · ${result.usage?.totalTokens} tok`)
  } catch (e: any) {
    console.error(`  ✗ ${e.message}`)
  }

  // 3. RAG
  console.log('\n▸ 3. RAG — Q&A sur documents RH')
  try {
    const { answer, sources, contextFound } = await client.ragAsk({
      question: 'Combien de jours de télétravail par semaine ?',
    })
    console.log(`  ${contextFound ? '✓ Contexte trouvé' : '○ Pas de contexte'}`)
    console.log(`  Answer: ${answer.slice(0, 200)}...`)
    console.log(`  Sources: ${sources.length}`)
    sources.forEach(s => console.log(`    • ${s.title} (${s.source}, score: ${s.score})`))
  } catch (e: any) {
    console.error(`  ✗ ${e.message}`)
  }

  // 4. Template
  console.log('\n▸ 4. Template — Résumé contrat CDI')
  try {
    const result = await client.runTemplate('contrat_cdi_resume', {
      poste: 'Développeur',
      salaire: '1500000',
      date_embauche: '2026-01-15',
      periode_essai: '3 mois',
      lieu: 'Conakry',
    })
    console.log(`  ✓ Template exécuté`)
    console.log(`  Provider: ${result.provider}/${result.model}`)
    console.log(`  Duration: ${result.durationMs}ms`)
    console.log(`  Content:`)
    console.log('  ' + result.content.split('\n').join('\n  ').slice(0, 500))
  } catch (e: any) {
    console.error(`  ✗ ${e.message}`)
  }

  // 5. Workflow
  console.log('\n▸ 5. Workflow — Analyse document')
  try {
    const { finalOutput, results, totalDurationMs, totalTokens } = await client.runWorkflow(
      'document_analysis',
      'Le télétravail est autorisé 2 jours par semaine pour les employés en CDI avec 3 mois d\'ancienneté. La connexion internet est remboursée 200000 GNF/mois.'
    )
    console.log(`  ✓ Workflow terminé : ${results.length} étapes`)
    console.log(`  Duration: ${totalDurationMs}ms · ${totalTokens} tok`)
    results.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.success ? '✓' : '✗'} ${r.stepLabel} (${r.durationMs}ms)`)
    })
    console.log(`  Output final:`)
    console.log('  ' + finalOutput.slice(0, 300))
  } catch (e: any) {
    console.error(`  ✗ ${e.message}`)
  }

  // 6. Gestion d'erreur
  console.log('\n▸ 6. Test gestion d\'erreur (provider inexistant)')
  try {
    await client.chat(
      [{ role: 'user', content: 'test' }],
      { provider: 'provider_inexistant' }
    )
  } catch (e: any) {
    if (e instanceof DataSphereRHError) {
      console.log(`  ✓ Erreur catchée: HTTP ${e.statusCode} — ${e.message}`)
    } else {
      console.log(`  ✓ Erreur: ${e.message}`)
    }
  }

  console.log('\n' + '━'.repeat(60))
  console.log('  Exemple terminé ✓')
  console.log('━'.repeat(60))
}

main().catch(console.error)
