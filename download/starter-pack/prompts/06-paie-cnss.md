# Prompt 06 — Module Paie Guinéenne Paramétrable (CRITIQUE)

## CONTEXTE

Module critique: moteur de calcul de paie conforme CNSS Guinée. À implémenter
dans `apps/api/src/payroll/`. Doit être idempotent, audité, et paramétrable par
tenant sans modification du code.

## ENTITÉS PRISMA (déjà dans prisma/schema.prisma)

- CnssParam: taux_cnss_salarie (0.05), taux_cnss_employeur (0.08), plafond_cnss
  (8 × smig = 4 640 000 GNF), smig (580 000), taux_rts (0.01),
  taux_versement_forfaitaire (0.04), taux_taxe_apprentissage (0.01),
  taux_formation_pro (0.03), taux_accident_travail (0.02), date_effet, date_fin
- PayrollPeriod: id, tenant_id, mois, annee, libelle, date_debut, date_fin,
  status (OUVERTE | CALCULEE | VALIDEE | CLOTUREE), locked_at, locked_by
- Payslip: id, tenant_id, employee_id, period_id, contract_id, salaire_base,
  primes JSONB, heures_supplementaires JSONB, avantages_nature JSONB,
  salaire_brut, salaire_brut_imposable, cnss_salarie, cnss_employeur, rts,
  versement_forfaitaire, taxe_apprentissage, formation_pro, retenues_diverses,
  net_a_payer, pdf_key, pdf_generated_at, signature_hash
- PayrollElement: id, tenant_id, employee_id, period_id, type (PRIME | HEURE_SUP |
  AVANTAGE_NATURE | INDEMNITE | RETENUE | AVANCE), label, amount, quantity, rate,
  imposable

## WORKFLOW CALCUL (8 ÉTAPES — IDempotent)

```typescript
async function calculatePayslip(employee, period, cnssParams): Promise<Payslip> {
  // Étape 1: Collecte éléments variables
  const elements = await payrollElements.findMany({ employeeId, periodId });

  // Étape 2: Salaire brut et brut imposable
  const salaireBrut = salaireBase + sumPrimes(elements) + sumHS(elements)
                    + sumAvantages(elements) - sumAbsences(elements);
  const salaireBrutImposable = salaireBrut - sumExonerees(elements);

  // Étape 3: CNSS salarié (plafonné)
  const assietteCnss = Math.min(salaireBrutImposable, cnssParams.plafondCnss);
  const cnssSalarie = assietteCnss * cnssParams.tauxCnssSalarie;

  // Étape 4: CNSS employeur (plafonné)
  const cnssEmployeur = assietteCnss * cnssParams.tauxCnssEmployeur;

  // Étape 5: RTS
  const rts = salaireBrutImposable * cnssParams.tauxRts;

  // Étape 6: Charges patronales
  const versementForfaitaire = salaireBrutImposable * cnssParams.tauxVersementForfaitaire;
  const taxeApprentissage = salaireBrutImposable * cnssParams.tauxTaxeApprentissage;
  const formationPro = salaireBrutImposable * cnssParams.tauxFormationPro;

  // Étape 7: Net à payer
  const netAPayer = salaireBrutImposable - cnssSalarie - rts
                  - sumAvances(elements) - sumRetenues(elements)
                  + sumNonImposables(elements);

  // Étape 8: Hash d'idempotence (SHA-256 du snapshot)
  const signatureHash = sha256(JSON.stringify({
    employee, period, cnssParams, elements, result: { salaireBrut, netAPayer }
  }));

  return { /* tous les champs */, signatureHash };
}
```

## HEURES SUPPLÉMENTAIRES (majorations paramétrables)

| Type | Majoration défaut |
|------|------------------|
| Semaine 8 premières HS | +25% |
| Semaine au-delà de 8 HS | +50% |
| Nuit (22h-6h) | +50% |
| Dimanche | +75% |
| Jour férié légal | +100% |

Cumulable: une HS de nuit le dimanche = base × 1.50 × 1.75 = 2.625× taux de base.

```typescript
// Table de configuration par tenant
type HSMajorationConfig = {
  weeknightSurcharge: number;     // 0.50
  sundaySurcharge: number;        // 0.75
  holidaySurcharge: number;       // 1.00
  weekFirst8Surcharge: number;    // 0.25
  weekBeyond8Surcharge: number;   // 0.50
};
```

## ENDPOINTS API

- GET /payroll/periods (liste avec statut)
- POST /payroll/periods (ouverture période)
- GET /payroll/periods/:id (détail + employés inclus)
- POST /payroll/periods/:id/run (lancement calcul async via BullMQ)
- GET /payroll/periods/:id/run/status (statut du calcul)
- POST /payroll/periods/:id/review (revue + ajustements)
- POST /payroll/periods/:id/lock (clôture définitive)
- GET /payroll/payslips (liste bulletins)
- GET /payroll/payslips/:id (détail)
- GET /payroll/payslips/:id/pdf (PDF binaire)
- GET /payroll/payslips/:id/verify (vérification signature)
- POST /payroll/elements (saisie éléments variables)
- GET /payroll/elements?employee_id=&period_id=
- GET /payroll/declarations/cnss?trimestre=&annee= (PDF déclaration)
- GET /payroll/exports?format=xlsx (export comptable Sage/Cegid)

## FILE ASYNCHRONE (BullMQ + Redis)

```typescript
// Le calcul de paie pour 500 employés prend ~3 minutes
// Job en file pour ne pas bloquer l'API
@Processor('payroll-calculation')
export class PayrollProcessor extends WorkerHost {
  async process(job: Job<{ periodId: string }>): Promise<void> {
    const { periodId } = job.data;
    const employees = await employeesRepo.findActive(periodId);

    for (const employee of employees) {
      const payslip = await calculatePayslip(employee, period);
      await payslipsRepo.upsert(payslip);
      await job.updateProgress(++completed / employees.length);
    }
    await periodsRepo.markAsCalculee(periodId);
  }
}
```

## CRITIQUE — INTÉGRITÉ

- **Idempotence**: même input → même output (hash SHA-256 stocké)
- **Verrouillage**: une période CLOTUREE ne peut plus être recalculée (erreur 423)
- **Snapshot des paramètres**: à chaque calcul, snapshot des cnssParams utilisé
  (table `cnss_param_snapshots`) pour audit rétroactif
- **Audit trail**: chaque calcul journalisé avec user_id, period_id, hash

## TESTS (50 CAS DE TEST OBLIGATOIRES)

Cas nominaux:
- Salaire < plafond CNSS → cotisations sur brut complet
- Salaire > plafond CNSS → cotisations plafonnées
- Heures supp en semaine jour → +25%
- Heures supp en semaine nuit → +50%
- Heures supp dimanche jour → +75%
- Heures supp jour férié → +100%
- Cumul nuit + dimanche → 1.50 × 1.75

Cas limites:
- Salaire = SMIG exact → pas de plafonnement
- Salaire = plafond CNSS exact → cotisations au maximum
- 0 heures supp → pas de majoration
- 100 heures supp (au-delà légal) → alerte + bloquant
- Employé en congé sans solde → brut = 0
- Avantages en nature > 30% du brut → alerte

Cas régressifs:
- Modification rétroactive d'un taux CNSS → recalcul interdit si période clôturée
- Modification d'un élément variable → recalcul automatique si période OUVERTE

## SIMULATEUR FRONTEND

```
apps/web/app/payroll/simulator/
└── page.tsx  — simulateur interactif pour tester un calcul
                 (inputs: salaire, HS, primes → output: tous les calculs intermédiaires)
```

Génère backend complet + simulateur + tests exhaustifs + documentation mathématique.
