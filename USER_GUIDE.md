# Guide Utilisateur — DataSphere RH Guinée

> Système d'Information Ressources Humaines premium adapté au contexte guinéen

## Accès à l'application

- URL : https://datasphere-rh.netlify.app/
- Identifiants de démonstration :

| Email | Rôle | Mot de passe |
|-------|------|--------------|
| admin@datasphere.gn | Super Admin | demo123 |
| rh@datasphere.gn | RH | demo123 |
| comptable@datasphere.gn | Comptable | demo123 |
| manager@datasphere.gn | Manager | demo123 |
| admin@minebokedemo.gn | Admin Mine de Boké | demo123 |

## Modules principaux

### 1. Tableau de bord (Dashboard)
Vue d'ensemble en temps réel : effectif total, masse salariale, charges patronales, demandes de congés en attente, alertes RH.

### 2. Employés
Gestion complète du personnel : fiches détaillées, contrats, documents, historique. Wizard de création en 5 étapes. Import en masse via CSV/Excel.

### 3. Paie & CNSS
Calcul automatique des bulletins de paie conformes à la législation guinéenne :
- CNSS : 5% part salariale, 17% part patronale
- ITS : 1.5%
- Versement forfaitaire
- Génération PDF des bulletins

### 4. Congés & absences
Workflow de validation : demande → validation RH → validation direction. Gestion des soldes, types de congés (annuel, maladie, maternité, paternité, mariage, décès).

### 5. Contrats
Génération de contrats CDI, CDD, lettres d'embauche, attestations d'employeur et de salaire. Conformes au Code du travail guinéen (Loi L/2014/072/AN).

### 6. AI / Chatbot
Assistant RH propulsé par GLM-4 (Z.ai). Génération automatique de documents juridiques. Chatbot pour répondre aux questions RH.

**Note** : Pour activer l'IA, ajoutez `ZAI_API_KEY` dans les variables d'environnement Netlify. Sans clé, les templates de documents sont générés automatiquement.

### 7. Recrutement
Pipeline candidats, offres d'emploi, entretiens, lettres de refus/embauche.

### 8. Analytics
Graphiques : évolution effectif, turnover, pyramide des âges, répartition par poste/département.

### 9. Audit
Traçabilité complète des actions : connexion, création/modification d'employés, génération de documents, changements de paie.

## Multi-sociétés

Le sélecteur de société (en haut) permet de basculer entre :
- DataSphere Demo SARL (Conakry) — 9 employés
- Société Minière de Boké SARL (Boké) — 15 employés

## Conformité Guinée

- Code du travail : Loi L/2014/072/AN
- CNSS : cotisations 5% / 17%
- ITS : 1.5%
- Congés : 30 jours calendaires/an
- Période d'essai : 1-3 mois selon catégorie
- Préavis : 1-3 mois selon grade

## Architecture technique

- Frontend : Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- Backend : API Routes Next.js, Prisma ORM
- Base de données : PostgreSQL (Neon)
- Hébergement : Netlify (functions serverless)
- IA : Z.ai GLM-4 (z-ai-web-dev-sdk)

## Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL Neon |
| `ZAI_API_KEY` | (Optionnel) Clé API Z.ai pour activer l'IA |

## Support

Pour toute question ou assistance, contactez l'administrateur système.
