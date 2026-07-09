# Prompt 03 — Module Gestion des Employés

## CONTEXTE

Dans le monorepo DataSphere RH Guinée, implémente le module Employés complet dans
`apps/api/src/employees/` et `apps/web/app/employees/`.

## ENTITÉS PRISMA (déjà dans prisma/schema.prisma)

- Employee: id, tenant_id, company_id, matricule, nom, prenoms, cnss_numero,
  date_naissance, sexe, situation_familiale, nombre_enfants, adresse,
  telephone, email, photo_url, date_embauche, date_sortie, statut
- Index: (tenant_id, matricule) UNIQUE, (tenant_id, cnss_numero) UNIQUE
- EmployeeDocument: id, employee_id, type, file_key, file_name, file_size,
  mime_type, signed_at, signed_by, signature_hash

## ENDPOINTS API

- GET /employees (pagination, filter[statut], filter[company_id], include)
- POST /employees (wizard 5 étapes, validation Zod)
- GET /employees/:id (avec relations optionnelles)
- PATCH /employees/:id (audit trail automatique)
- DELETE /employees/:id (soft delete + anonymisation RGPD)
- POST /employees/:id/documents (upload MinIO presigned URL)
- GET /employees/:id/documents (liste documents)
- GET /employees/export (Excel + CSV avec mapping colonnes)
- POST /employees/import (CSV/Excel en masse, dry-run + commit)

## UPLOAD MINIO

- Presigned URL (validité 15 min) générée par l'API
- Limitation: 10 Mo, types mime autorisés: image/*, application/pdf
- Antivirus scan async (ClamAV) — file marqué "scanning" puis "clean" / "infected"
- Stockage chiffré SSE-S3
- Bucket MinIO: `avatars` pour photos, `documents` pour autres

## FRONTEND (Next.js App Router)

```
apps/web/app/employees/
├── page.tsx                    # liste DataTable shadcn
├── new/
│   └── page.tsx                # wizard 5 étapes
├── [id]/
│   ├── page.tsx                # fiche employé (tabs)
│   ├── edit/page.tsx
│   ├── contracts/page.tsx
│   ├── documents/page.tsx
│   ├── payslips/page.tsx
│   ├── leaves/page.tsx
│   └── timeline/page.tsx       # audit trail visuel
└── import/page.tsx             # import en masse
```

### Wizard 5 étapes (nouvel employé):

1. **Identification** — matricule, nom, prenoms, date naissance, sexe, cnss
2. **Contact** — adresse, telephone, email, photo
3. **Contrat** — type (CDI/CDD/stage), date debut, poste, salaire, société
4. **Documents** — upload pièce identité, CV, diplôme (presigned URLs)
5. **Confirmation** — récap + submit

## VALIDATIONS ZOD

```typescript
const employeeSchema = z.object({
  matricule: z.string().min(3).max(50).regex(/^[A-Z0-9-]+$/),
  nom: z.string().min(2).max(100),
  prenoms: z.string().min(2).max(200),
  dateNaissance: z.string().date().optional(),
  cnssNumero: z.string().regex(/^\d{10}$/).optional(),
  sexe: z.enum(['M', 'F']).optional(),
  situationFamiliale: z.enum(['CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF']).optional(),
  nombreEnfants: z.number().int().min(0).max(20).default(0),
  email: z.string().email().optional(),
  telephone: z.string().regex(/^(\+224)?\d{9,10}$/).optional(),
  dateEmbauche: z.string().date(),
  companyId: z.string().uuid(),
});
```

## IMPORT EXCEL

- Endpoint POST /employees/import accepte multipart/form-data
- Première passe: dry-run=true → retourne preview (lignes valides/erreurs)
- Deuxième passe: dry-run=false → commit transactionnel (rollback si erreur)
- Mapping colonnes configurable via en-tête Excel (matricule, nom, etc.)
- Template Excel téléchargeable sur GET /employees/import/template

## AUDIT TRAIL

- Chaque mutation (create/update/delete) déclenche le trigger PostgreSQL
- L'audit log contient: user_id, action, entity_type, entity_id, diff JSONB
- Endpoint GET /employees/:id/timeline retourne l'historique formaté pour UI

## TESTS

- Unit: EmployeesService, EmployeesController, validation Zod
- Integration: create → fetch → update → fetch → delete → anonymize
- E2E: wizard complet, import Excel 100 lignes, export Excel
- E2E: upload document via presigned URL

Génère backend + frontend + tests E2E + template Excel.
