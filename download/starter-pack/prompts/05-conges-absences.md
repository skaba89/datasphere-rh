# Prompt 05 — Module Congés & Absences

## CONTEXTE

Dans le monorepo DataSphere RH Guinée, implémente le module Congés et Absences
dans `apps/api/src/leaves/` et `apps/web/app/leaves/`.

## ENTITÉS PRISMA

- LeaveRequest: id, tenant_id, employee_id, type, date_debut, date_fin,
  demi_journee, motif, statut, approved_by, approved_at, justificatif_key
- LeavePolicy: id, tenant_id, type, name, default_days, is_paid,
  needs_approval, needs_justificatif, carry_over
- Holiday: id, tenant_id, date, name, type (LEGAL | RELIGIEUX | OPTIONNEL)

## TYPES DE CONGÉS (par défaut, paramétrables)

| Type | Durée légale GN | Acquisition | Reportable | Workflow |
|------|----------------|-------------|------------|----------|
| CONGE_PAYE | 30 j calendaires/an | 2,5 j/mois | Oui | 3 niveaux |
| MALADIE | Selon CNSS (max 26 sem) | Indemnisé CNSS | Non | Saisie RH directe |
| MATERNITE | 14 semaines | 100% salaire | Non | Saisie RH directe |
| PATERNITE | 3 semaines | 100% salaire | Non | Saisie RH directe |
| MARIAGE | 3 jours | Payé | Oui | 2 niveaux |
| DECES | 3 jours | Payé | Oui | 2 niveaux |
| SANS_SOLDE | Négocié | Non payé | Non | Approval DG |

## WORKFLOW DE VALIDATION (3 niveaux par défaut)

1. Soumission par l'employé (portail) ou le RH
2. Validation Manager direct → notification RH
3. Validation finale RH → génération attestation + MAJ solde

- Refus: motif obligatoire, possibilité de resoumettre
- Annulation: possible si statut != APPROUVE ou avant J-1
- Maladie/maternité: workflow court (RH saisit directement sur certificat médical)

## ENDPOINTS API

- GET /leaves (filtres: status, employee_id, type, période)
- POST /leaves (nouvelle demande, validation Zod)
- GET /leaves/:id
- POST /leaves/:id/approve (Manager uniquement)
- POST /leaves/:id/reject (motif obligatoire)
- POST /leaves/:id/cancel (annulation par demandeur)
- GET /leaves/balances/:employeeId (soldes par type)
- GET /leaves/calendar?start=&end= (calendrier équipe)
- GET /leaves/policies (politiques du tenant)
- PUT /leaves/policies/:id (modification politiques)
- GET /leaves/holidays (jours fériés guinéens)
- POST /leaves/holidays (ajout jour férié)
- GET /leaves/:id/attestation (PDF attestation de congé)

## CALCUL DES SOLDES

```typescript
// Acquisition mensuelle: 2.5 jours de congé payé par mois travaillé
const monthlyAccrual = 2.5;

// Solde = (mois travaillés × 2.5) - congés pris - congés en cours
function calculateBalance(employee, period) {
  const monthsWorked = monthsBetween(employee.dateEmbauche, period.end);
  const accrued = Math.min(monthsWorked * monthlyAccrual, 30); // plafond annuel
  const taken = leavesTakenThisYear(employee.id, CONGE_PAYE);
  const pending = leavesPendingThisYear(employee.id, CONGE_PAYE);
  return {
    accrued,
    taken,
    pending,
    available: accrued - taken - pending,
    carryOver: previousYearBalance(employee.id, period.year - 1)
  };
}
```

## FRONTEND

```
apps/web/app/leaves/
├── page.tsx                    # liste demandes (DataTable avec filtres)
├── new/page.tsx                # nouvelle demande (calendar picker)
├── [id]/page.tsx               # détail + workflow validation
├── calendar/page.tsx           # vue calendrier équipe (fullcalendar)
├── balances/page.tsx           # soldes par employé
├── policies/page.tsx           # politiques congés (admin)
└── holidays/page.tsx           # jours fériés
```

## NOTIFICATIONS

À chaque étape du workflow, notification envoyée via:
- Email (SendGrid) — template HTML multilingue
- WhatsApp (Twilio) — message court avec lien de validation
- In-app notification (WebSocket + bell icon)

## ATTESTATION PDF

- Endpoint GET /leaves/:id/attestation retourne PDF signé
- Template Handlebars `apps/api/templates/pdf/leave-attestation.hbs`
- Contient: nom employé, période, type de congé, signature RH
- QR code de vérification

## TESTS

- Unit: calcul des soldes, validation workflow, transitions de statut
- Integration: demande → approbation → MAJ solde → attestation
- E2E: employé fait demande → manager approuve → RH valide → solde mis à jour
- E2E: refus avec motif → employé resoumet → approbation

Génère backend + frontend + template PDF + tests E2E.
