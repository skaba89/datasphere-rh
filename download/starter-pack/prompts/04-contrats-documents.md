# Prompt 04 — Module Contrats & Documents RH

## CONTEXTE

Dans le monorepo DataSphere RH Guinée, implémente le module Contrats et Documents
RH dans `apps/api/src/contracts/`.

## ENTITÉS PRISMA

- Contract: id, employee_id, type, date_debut, date_fin, poste, service_id,
  salaire_base, devise, periodicite, motif_cdd, preavis_jours, clauses JSONB,
  avenant_parent, status
- EmployeeDocument: id, employee_id, type, file_key, file_name, file_size,
  mime_type, signed_at, signed_by, signature_hash

## TYPES DE CONTRATS GÉRÉS

- CDI (Contrat à Durée Indéterminée)
- CDD (Contrat à Durée Déterminée) — motif obligatoire, durée max 24 mois
- STAGE (Contrat de stage) — 6 mois max, indemnité min 60% SMIG
- PRESTATAIRE (Contrat de prestation B2B) — hors paie salarié
- EXPATRIE (Contrat d'expatrié) — avantages spécifiques
- APPRENTI (Contrat d'apprentissage) — 1 à 2 ans, indemnité progressive

## AVENANTS

- Un avenant est un contrat dont `avenant_parent` référence le contrat initial
- Historique complet accessible via GET /contracts/:id/avenants
- Date d'effet obligatoire, motif d'avenant obligatoire
- Calcul automatique de l'impact sur la paie (salaire, poste)

## ENDPOINTS API

- GET /contracts?filter[employee_id]=&filter[type]=&filter[status]=
- POST /contracts (création contrat initial)
- GET /contracts/:id
- PATCH /contracts/:id (modification avec audit trail)
- POST /contracts/:id/avenants (création avenant)
- GET /contracts/:id/avenants (historique des avenants)
- POST /contracts/:id/sign (signature électronique interne)
- GET /contracts/:id/pdf (génération PDF du contrat)
- POST /contracts/:id/documents (upload documents liés: contrat signé, annexe)
- GET /contracts/:id/documents

## SIGNATURE ÉLECTRONIQUE INTERNE

- Hash SHA-256 du PDF + horodatage UTC
- Stockage du hash dans `signature_hash` + `signed_at` + `signed_by`
- QR code de vérification ajouté en page finale du PDF
- Endpoint public GET /verify/:signature_hash → retourne métadonnées du document

## WORKFLOW DE VALIDATION (CDI)

1. RH crée le contrat (statut BROUILLON)
2. RH upload le PDF signé scanné OU utilise signature électronique interne
3. Admin Entreprise valide (statut ACTIF)
4. Notification envoyée à l'employé (WhatsApp + email)
5. Contrat archivé dans MinIO (bucket `documents`)
6. Audit log: action=VALIDATE, entity_type=contract

## ALERTES AUTOMATIQUES

- Fin de CDD approchant (J-30): notification au RH et manager
- Fin de période d'essai (J-15): notification au RH
- Renouvellement d'avenant à prévoir (J-30): notification au RH
- Cron job quotidien (BullMQ) qui scanne les contrats et envoie les alertes

## FRONTEND

```
apps/web/app/employees/[id]/contracts/
├── page.tsx                    # liste + timeline avenants
├── new/page.tsx                # création contrat
├── [contractId]/
│   ├── page.tsx                # détail contrat
│   ├── edit/page.tsx           # édition (statut BROUILLON uniquement)
│   ├── avenant/page.tsx        # création avenant
│   └── sign/page.tsx           # signature électronique
```

## TEMPLATE PDF CONTRAT

- Handlebars template dans `apps/api/templates/pdf/contract.hbs`
- Logo entreprise en header
- Toutes les clauses obligatoires (parties, poste, rémunération, préavis)
- Page de signature avec emplacement signatures
- Génération via Puppeteer (page.pdf() vectoriel)

## TESTS

- Unit: ContractsService, validation par type, calcul avenant
- Integration: création → avenant → signature → PDF → archive
- E2E: workflow complet CDI avec validation

Génère backend + frontend + template PDF + tests.
