# Prompt 08 — Dashboards & Exports

## CONTEXTE

Implémente les tableaux de bord RH et DG, ainsi que le moteur d'exports
Excel/PDF paramétrables dans `apps/api/src/dashboard/` et `apps/api/src/exports/`.

## DASHBOARDS

### 1. Dashboard RH (route: /dashboard/hr)

KPIs retournés:
- Effectif total + évolution 12 mois
- Turn-over (rolling 12 mois)
- Répartition par type de contrat (CDI/CDD/stage/etc.)
- Répartition par service
- Pyramide des âges
- Congés en cours + à venir (7 jours)
- Demandes de congés en attente (count)
- Période de paie en cours (statut)
- Anomalies paie (count: employés sans contrat actif, sans CNSS, etc.)

### 2. Dashboard Direction Générale (route: /dashboard/dg)

KPIs:
- Masse salariale brute (mois en cours vs N-1)
- Masse salariale nette
- Charges patronales totales
- Coût employeur total
- Headcount par société (si multi-sociétés)
- Évolution mensuelle masse salariale (12 mois)
- Top 10 des employés par coût total
- Provision congés payés
- Alerts (CDD finissant < 30j, etc.)

### 3. Dashboard Employé (route: /dashboard/employee)

- Mon profil (info perso + poste)
- Mes bulletins (12 derniers)
- Mes congés (soldes + historique)
- Mes documents
- Mes demandes en cours

## ENDPOINTS API

- GET /dashboard/hr?period=current
- GET /dashboard/dg?period=current
- GET /dashboard/employee
- GET /dashboard/team?manager_id= (vue manager)
- GET /dashboard/alerts (alertes paie/RH)
- GET /dashboard/stats/turnover?from=&to=
- GET /dashboard/stats/headcount?from=&to=

## CHARTS FRONTEND

Utiliser Recharts (compatible React 18) avec design system shadcn/ui:

```
apps/web/app/dashboard/
├── hr/page.tsx          # dashboard RH
│   ├── KpiCards         # 4 callouts: effectif, turnover, congés, anomalies
│   ├── ContractsChart   # donut chart type contrats
│   ├── ServicesChart    # bar chart effectif par service
│   ├── AgePyramid       # bar chart horizontal pyramide âges
│   ├── LeavesTimeline   # gantt congés à venir
│   └── AlertsPanel      # liste anomalies
├── dg/page.tsx          # dashboard DG
│   ├── MasseSalariale   # line chart 12 mois
│   ├── HeadcountChart   # bar chart par société
│   ├── TopEmployees     # table top 10 coût
│   └── ProvisionCard    # provision congés payés
└── employee/page.tsx    # portail employé
```

## MOTEUR D'EXPORTS

### Export Excel générique

```typescript
// Endpoint: POST /exports/excel
// Body: {
//   type: 'employees' | 'payslips' | 'audit' | 'custom',
//   filters: { ... },
//   columns: ['matricule', 'nom', 'salaire', ...],
//   format: 'xlsx' | 'csv'
// }

@Service()
export class ExportService {
  async exportExcel(type, filters, columns): Promise<{ fileKey: string; url: string }> {
    const data = await this.fetchData(type, filters);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Export');

    // Header row
    sheet.columns = columns.map(col => ({
      header: col.label,
      key: col.key,
      width: col.width || 20,
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF435862' } };

    // Data rows
    data.forEach(row => sheet.addRow(row));

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: data.length + 1, column: columns.length }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const fileKey = `exports/${type}_${Date.now()}.xlsx`;
    await minio.putObject('exports', fileKey, buffer, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    return { fileKey, url: await minio.presignedUrl('exports', fileKey, 24 * 3600) };
  }
}
```

### Exports prédéfinis

| Type | Description | Format |
|------|-------------|--------|
| employees_list | Liste employés actifs | xlsx |
| employees_full | Employés + contrats + documents | xlsx |
| payslips_period | Bulletins d'une période | xlsx + pdf zip |
| payslips_year | Bulletins annuels par employé | xlsx |
| cnss_declaration | Déclaration CNSS trimestrielle | pdf |
| audit_export | Journal d'audit filtré | xlsx |
| payroll_accounting | Export comptable (Sage/Cegid) | csv |
| leave_balances | Soldes congés tous employés | xlsx |

## CRÉATEUR DE RAPPORT PERSONNALISÉ

Frontend drag-and-drop:
- Sélection type entité (employees, payslips, audit)
- Drag colonnes disponibles → colonnes sélectionnées
- Filtres (date range, statut, société, etc.)
- Group by optionnel
- Format output (xlsx, csv, pdf)
- Sauvegarde modèle (nom + partagable)

## CRON JOBS

```typescript
// Cron quotidien à 06h00: générer rapports planifiés
@Cron('0 6 * * *')
async function generateScheduledReports() {
  const scheduled = await reportsRepo.findScheduled();
  for (const report of scheduled) {
    await exportQueue.add('generate', report);
  }
}
```

## CACHE

- Dashboards: cache Redis 5 min (key: `dashboard:{type}:{tenantId}:{period}`)
- Invalidate sur mutation (nouvel employé, nouvelle paie, etc.)
- Materialized view `mv_employee_summary` refreshée nightly pour performances

## TESTS

- Unit: calcul KPIs, génération Excel, format CSV
- Integration: dashboard RH avec 500 employés → temps < 2s
- E2E: export Excel 1000 lignes → vérifier contenu + format + URL MinIO
- E2E: rapport planifié généré automatiquement

Génère backend + frontend + templates Excel + tests.
