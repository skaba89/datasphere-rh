# Prompt 07 — Module Bulletins de Paie PDF

## CONTEXTE

Implémente la génération de bulletins PDF vectoriels pour DataSphere RH Guinée
dans `apps/api/src/payslips-pdf/`.

## EXIGENCES

- Format A4 portrait, vectoriel (texte sélectionnable)
- Conformité légale GN: toutes les rubriques obligatoires
- Bilingue FR/EN (toggle par employé, default FR)
- Logo entreprise en header (depuis MinIO bucket `avatars`)
- Signature électronique interne (hash SHA-256 + horodatage UTC)
- Archivage MinIO avec lifecycle 10 ans
- Mode hors-ligne (pré-génération batch)
- QR code de vérification en footer

## STACK

- Puppeteer + HTML/CSS pour le rendu (vectoriel via page.pdf())
- Handlebars pour le templating
- MinIO SDK pour le stockage
- BullMQ (Redis) pour la file de génération asynchrone
- `qrcode` npm pour générer le QR code de vérification

## TEMPLATE HTML (Handlebars)

```
apps/api/templates/pdf/
├── payslip.hbs        # bulletin principal
├── partials/
│   ├── header.hbs     # logo + raison sociale + NIF/RC/CNSS
│   ├── employee.hbs   # matricule, nom, poste, période
│   ├── earnings.hbs   # rubriques gains (brut, primes, HS, avantages)
│   ├── deductions.hbs # cotisations (CNSS sal, RTS, retenues)
│   ├── employer.hbs   # charges patronales (CNSS emp, VF, taxes)
│   ├── summary.hbs    # net à payer + totaux
│   └── footer.hbs     # signature électronique + QR code
└── styles/
    └── payslip.css    # styles print A4
```

## STRUCTURE DU BULLETIN

```
┌──────────────────────────────────────────┐
│ [LOGO]  RAISON SOCIALE                   │
│         NIF: xxx  RC: xxx  CNSS: xxx    │
├──────────────────────────────────────────┤
│ BULLETIN DE PAIE — [MOIS ANNÉE]          │
├──────────────────────────────────────────┤
│ Employé: NOM Prenoms                     │
│ Matricule: xxx    CNSS: xxx              │
│ Poste: xxx        Service: xxx           │
│ Contrat: CDI     Embauche: JJ/MM/AAAA   │
├──────────────────────────────────────────┤
│ GAINS                    MONTANT (GNF)   │
│ Salaire de base              3 000 000   │
│ Heures supp. (5 × 1.25)       108 175    │
│ Prime de rendement            200 000    │
│ Avantage en nature logement   300 000    │
│ Indemnité transport           100 000    │
│ ─────────────────────────────────────    │
│ Salaire brut                3 708 175    │
├──────────────────────────────────────────┤
│ RETENUES SALARIÉ                        │
│ CNSS (5%)                    -180 409    │
│ RTS (1%)                      -36 082    │
│ ─────────────────────────────────────    │
│ Total retenues               -216 491    │
├──────────────────────────────────────────┤
│ NET À PAYER                 3 391 684    │
├──────────────────────────────────────────┤
│ CHARGES EMPLOYEUR (informatives)         │
│ CNSS employeur (8%)           288 654    │
│ Versement forfaitaire (4%)    144 327    │
│ Taxe apprentissage (1%)        36 082    │
│ Formation pro (3%)            108 245    │
│ ─────────────────────────────────────    │
│ Coût total employeur        4 185 883    │
├──────────────────────────────────────────┤
│ [QR CODE]  Signature: hash[:16]...       │
│ Généré le JJ/MM/AAAA à HH:MM UTC         │
│ Vérification: /verify/<hash>             │
└──────────────────────────────────────────┘
```

## ENDPOINTS

- POST /payroll/periods/:id/payslips/generate (batch async — file BullMQ)
- GET /payroll/periods/:id/payslips/generate/status (statut génération)
- GET /payroll/payslips/:id/pdf (téléchargement PDF binaire)
- GET /payroll/payslips/:id/verify (vérification signature)
- GET /payroll/payslips/:id/preview (preview HTML pour debug)

## FILE BULLMQ

```typescript
@Processor('payslip-pdf-generation')
export class PayslipPdfProcessor extends WorkerHost {
  async process(job: Job<{ payslipIds: string[] }>): Promise<void> {
    const { payslipIds } = job.data;

    for (const id of payslipIds) {
      const payslip = await payslipsRepo.findById(id);
      const html = await renderTemplate('payslip.hbs', payslip);
      const pdfBuffer = await puppeteer.renderPdf(html, { format: 'A4' });

      const signatureHash = sha256(pdfBuffer + Date.now());
      const pdfKey = `payslips/${payslip.tenantId}/${payslip.periodId}/${payslip.employeeId}.pdf`;

      await minio.putObject('payslips', pdfKey, pdfBuffer, {
        'Content-Type': 'application/pdf',
        'x-amz-meta-signature-hash': signatureHash,
        'x-amz-meta-generated-at': new Date().toISOString(),
      });

      await payslipsRepo.update(id, {
        pdfKey,
        pdfGeneratedAt: new Date(),
        signatureHash,
      });

      await job.updateProgress(++completed / payslipIds.length);
    }
  }
}
```

## ARCHIVAGE MINIO

- Bucket: `payslips`
- Clé: `payslips/{tenant_id}/{period_id}/{employee_id}.pdf`
- Chiffrement: SSE-S3 (AES-256)
- Lifecycle:
  - 0-12 mois: storage class STANDARD
  - 12 mois - 10 ans: transition vers GLACIER
  - 10 ans+: suppression automatique (rétention légale CNSS Guinée)
- Métadonnées: employee_id, period_id, generated_at, signature_hash

## QR CODE DE VÉRIFICATION

- Contenu: `{baseUrl}/verify/{signatureHash}`
- Généré en base64 via `qrcode` npm
- Embed dans le footer du PDF
- Endpoint public GET /verify/:hash retourne:
  ```json
  {
    "valid": true,
    "payslip": {
      "employeeName": "Diallo Mamadou",
      "period": "Juin 2026",
      "generatedAt": "2026-07-01T15:30:00Z",
      "tenantName": "Demo SARL"
    }
  }
  ```

## TESTS

- Unit: template rendering, hash computation, QR code generation
- Integration: génère PDF → upload MinIO → download → vérifie signature
- E2E: clôture période → génération batch → téléchargement → vérification QR
- E2E: tentative de modification d'un PDF signé → vérification échoue

## PERF

- 1 PDF ~250ms à générer
- Batch 500 PDFs parallèle (concurrency: 3) ~45 secondes
- Mémoire Puppeteer: 1 instance réutilisée (singleton browser)

Génère service complet + template Handlebars + styles + tests E2E.
