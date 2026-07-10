# @datasphere/rh-sdk

SDK JavaScript/TypeScript pour l'API publique **DataSphere RH** — SIRH guinéen avec IA multi-providers.

## Installation

```bash
npm install @datasphere/rh-sdk
# ou
yarn add @datasphere/rh-sdk
# ou
bun add @datasphere/rh-sdk
```

## Configuration

Obtenez votre clé API sur **[rh.datasphere.gn](https://rh.datasphere.gn)** → Paramètres IA → Clés API publique.

```typescript
import { DataSphereRH } from '@datasphere/rh-sdk'

const client = new DataSphereRH({
  apiKey: 'dsrh_live_xxxxxxxxxxxx',
  // baseUrl: 'https://rh.datasphere.gn',  // défaut
  // timeout: 60000,                       // 60s défaut
})
```

## Usage rapide

### Chat

```typescript
const result = await client.chat({
  messages: [
    { role: 'system', content: 'Tu es un assistant RH.' },
    { role: 'user', content: 'Quels sont les jours fériés en Guinée ?' },
  ],
})
console.log(result.content)
// "En Guinée, les jours fériés sont : 1er janvier, 2 janvier..."
```

### Vision (analyse d'images)

```typescript
import fs from 'fs'

const imageBase64 = fs.readFileSync('attestation.jpg').toString('base64')

const result = await client.vision({
  images: [{ base64: imageBase64, mimeType: 'image/jpeg' }],
  prompt: 'Extrais tout le texte visible sur ce document',
})
console.log(result.content)
```

### RAG (Q&A sur documents RH internes)

```typescript
const { answer, sources } = await client.ragAsk({
  question: 'Combien de jours de télétravail par semaine ?',
})
console.log(answer)
// "Selon la politique de télétravail, vous pouvez prendre 2 jours par semaine..."

console.log(sources)
// [{ title: 'Politique de télétravail', source: 'policy', score: 7.27 }]
```

### Templates de prompts RH

11 templates prêts à l'emploi :

```typescript
const result = await client.runTemplate('contrat_cdi_resume', {
  poste: 'Développeur',
  salaire: '1500000',
  date_embauche: '2026-01-15',
  periode_essai: '3 mois',
  lieu: 'Conakry',
})
console.log(result.content)
```

Templates disponibles :
- `contrat_cdi_resume` — Résumé contrat CDI
- `avenant_contrat` — Avenant de modification
- `synthese_evaluation` — Synthèse évaluation annuelle
- `feedback_360` — Analyse feedback 360°
- `annonce_promotion` — Annonce de promotion
- `annonce_depart` — Annonce de départ
- `lettre_avertissement` — Lettre d'avertissement
- `analyse_turnover` — Analyse turnover
- `synthese_paie` — Synthèse paie mensuelle
- `plan_onboarding` — Plan d'onboarding
- `mediation_conflit` — Note de médiation

### Workflows IA multi-étapes

Chaînez plusieurs étapes IA (générer → améliorer → indexer → sauver) :

```typescript
const { finalOutput, results } = await client.runWorkflow(
  'contract_pipeline',
  JSON.stringify({
    employeeName: 'Mariama Camara',
    poste: 'Cheffe de projet',
    salaire: '2500000',
    date: '2026-09-01',
  })
)

console.log(`Workflow terminé en ${results.length} étapes`)
console.log('Contrat final :', finalOutput)
```

Workflows prédéfinis :
- `contract_pipeline` — Pipeline contrat complet (générer → améliorer → sauver → indexer)
- `document_analysis` — Analyse document (résumer → extraire mots-clés → traduire → sauver)
- `policy_create` — Création politique RH (générer → améliorer → sauver → indexer)

## Providers LLM supportés

11 providers, 60+ modèles :

| Provider | Modèles populaires |
|---|---|
| **Z.ai (GLM)** | GLM-4.6, GLM-4.5, GLM-4 Air, GLM-4V (vision) |
| **OpenAI** | GPT-4o, GPT-4o-mini, o1-preview |
| **Anthropic Claude** | Claude 3.5 Sonnet/Haiku, Claude 3 Opus |
| **Groq** | Llama 3.3 70B, Llama 3.2 Vision |
| **Google Gemini** | Gemini 2.0 Flash, Gemini 1.5 Pro |
| **OpenRouter** | 200+ modèles agrégés |
| **Mistral AI** | Mistral Large, Mixtral 8x22B |
| **DeepSeek** | DeepSeek V3, DeepSeek R1 |
| **Cohere** | Command R+ |
| **Together AI** | Llama 405B, Qwen 72B |
| **Ollama (local)** | Llama 3.3, Qwen, Mistral, Gemma |

## Scopes

Les clés API ont des scopes (permissions) :

| Scope | Description |
|---|---|
| `llm:chat` | Chat unifié |
| `llm:vision` | Analyse images |
| `llm:stream` | Streaming SSE |
| `rag:ask` | Q&A sur documents |
| `rag:search` | Recherche documents |
| `rag:index` | Indexation documents |
| `templates:run` | Exécuter templates |
| `workflows:run` | Exécuter workflows |
| `employees:read` | Lecture employés |
| `audit:read` | Lecture audit |
| `*` | Admin complet |

## Gestion des erreurs

```typescript
import { DataSphereRH, DataSphereRHError } from '@datasphere/rh-sdk'

try {
  const result = await client.chat({ messages: [...] })
} catch (e) {
  if (e instanceof DataSphereRHError) {
    console.error(`Erreur ${e.statusCode}: ${e.message}`)
    if (e.statusCode === 401) console.error('Clé API invalide')
    if (e.statusCode === 403) console.error('Scope insuffisant')
    if (e.statusCode === 429) console.error('Rate limit dépassé')
  }
}
```

## Rate limiting

Par défaut : 100 requêtes/heure par clé. Configurable lors de la création de la clé.

Si vous dépassez la limite, l'API retourne `429 Too Many Requests`.

## Exemples

### Script Node.js complet

```typescript
import { createClient } from '@datasphere/rh-sdk'
import fs from 'fs'

const client = createClient(process.env.DATASPHERE_API_KEY!)

async function main() {
  // 1. Vérifier la clé
  const { valid } = await client.ping()
  if (!valid) throw new Error('Clé API invalide')

  // 2. Chat simple
  const chat = await client.chat({
    messages: [{ role: 'user', content: 'Bonjour !' }],
  })
  console.log('Chat:', chat.content)

  // 3. RAG
  const rag = await client.ragAsk({
    question: 'Quelle est la politique de congés maternité ?',
  })
  console.log('RAG:', rag.answer)
  console.log('Sources:', rag.sources.length)

  // 4. Template
  const template = await client.runTemplate('synthese_evaluation', {
    employe: 'Fatoumata Touré',
    poste: 'Comptable',
    note: '4',
    points_forts: 'Rigueur, autonomie',
    axes_amelioration: 'Communication',
  })
  console.log('Template:', template.content.slice(0, 200))

  fs.writeFileSync('synthese.txt', template.content)
  console.log('Sauvegardé dans synthese.txt')
}

main().catch(console.error)
```

### Intégration Slack bot

```typescript
import { createClient } from '@datasphere/rh-sdk'

const dsrh = createClient(process.env.DATASPHERE_API_KEY!)

app.command('/rh-ask', async ({ command, ack, respond }) => {
  await ack()

  const { answer, sources } = await dsrh.ragAsk({
    question: command.text,
  })

  const sourceList = sources.map(s => `• ${s.title}`).join('\n')
  await respond(`*Réponse:*\n${answer}\n\n*Sources:*\n${sourceList}`)
})
```

## License

MIT © DataSphere SARL
