# Backlog MVP — DataSphere RH Guinée

> 8 sprints × 2 semaines = 16 semaines
> Story points selon Fibonacci (1, 2, 3, 5, 8, 13, 21)
> Total: ~220 SP répartis sur 5 développeurs (44 SP/sprint = ~88h/sprint/dev)

---

## Sprint 1 — Authentification & Multi-tenant (Semaines 1-2)

**Objectif**: Socle technique du SaaS, isolation des tenants, auth JWT+2FA.

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-001 | En tant que Super Admin, je crée un tenant via wizard (nom, slug, plan) | 5 | Must | Tenant créé dans table public.tenants + schéma PG dédié |
| US-002 | En tant qu'Admin Entreprise, je m'inscris avec email + password | 3 | Must | Validation email, bcrypt cost 12, account créé |
| US-003 | En tant qu'utilisateur, je configure le 2FA TOTP | 5 | Must | QR code généré, code vérifié, backup codes fournis |
| US-004 | En tant qu'utilisateur, je me connecte avec refresh token | 5 | Must | Access 15min, refresh 7j rotation, blacklist Redis |
| US-005 | En tant qu'Admin, j'attribue des rôles RBAC aux utilisateurs | 5 | Must | 6 rôles, matrice permissions, @Roles decorator |
| US-006 | En tant que système, j'isole les schémas PostgreSQL par tenant | 8 | Must | Aucune fuite cross-tenant, test d'intrusion passe |
| US-007 | En tant qu'Admin, je reset mon mot de passe via email | 3 | Should | Token JWT 1h, usage unique, redirect vers app |
| US-008 | En tant que système, je bloque un compte après 5 échecs login | 3 | Should | Lock 15min, unlock par admin, audit log |
| US-009 | En tant que développeur, j'ai un docker-compose fonctionnel | 2 | Must | `pnpm db:up` démarre PG+Redis+MinIO+MailHog |
| US-010 | En tant que développeur, j'ai un seed avec 1 tenant demo | 3 | Must | `pnpm db:seed` crée démo + 1 user admin |

**Total Sprint 1**: 42 SP

---

## Sprint 2 — Entreprises & Employés (Semaines 3-4)

**Objectif**: Référentiel RH complet (sociétés + employés).

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-011 | Admin: créer une société (NIF, RC, CNSS, devise) | 5 | Must | Validation NIF unique, devise default GNF |
| US-012 | Admin: lister/modifier les sociétés du tenant | 3 | Must | Pagination, filtres, audit trail |
| US-013 | RH: créer un employé via wizard 5 étapes | 8 | Must | Identification → Contact → Contrat → Documents → Confirmation |
| US-014 | RH: liste paginée des employés avec recherche | 5 | Must | DataTable shadcn, filtres statut/société |
| US-015 | RH: upload photo employé (presigned URL MinIO) | 3 | Must | Limit 10Mo, types image/*, antivirus async |
| US-016 | RH: consultation fiche employé avec onglets | 5 | Must | Info, contrats, paie, congés, documents, audit |
| US-017 | RH: édition employé (tous champs) | 3 | Must | Audit trail automatique sur UPDATE |
| US-018 | RH: import Excel en masse avec mapping | 8 | Should | Dry-run preview, commit transactionnel |
| US-019 | RH: export Excel/CSV des employés | 3 | Should | Colonnes configurables, URL MinIO 24h |
| US-020 | Employé: consultation de ma fiche | 3 | Should | Vue en lecture seule sauf propres infos |

**Total Sprint 2**: 46 SP

---

## Sprint 3 — Contrats & Documents RH (Semaines 5-6)

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-021 | RH: créer un contrat (CDI/CDD/stage/prestataire/expatrié/apprenti) | 8 | Must | Validation par type, motif CDD obligatoire |
| US-022 | RH: créer un avenant de contrat | 5 | Must | Référence parent, date effet, impact paie calculé |
| US-023 | RH: historique des avenants d'un contrat | 3 | Must | Timeline visuel avec dates d'effet |
| US-024 | Système: alerte automatique fin CDD (J-30) | 5 | Must | Cron job quotidien, notifications email+WhatsApp |
| US-025 | RH: upload documents liés au contrat (PDF signé) | 3 | Must | Presigned URL, types pdf, archivage MinIO |
| US-026 | RH: signature électronique interne d'un contrat | 8 | Must | Hash SHA-256, QR code de vérification |
| US-027 | Public: vérification d'une signature via URL | 3 | Must | Endpoint /verify/:hash, métadonnées du document |
| US-028 | RH: génération PDF contrat (template Handlebars) | 5 | Should | Puppeteer vectoriel, logo entreprise |
| US-029 | Système: alerte fin période d'essai (J-15) | 3 | Should | Notification RH + manager |

**Total Sprint 3**: 43 SP

---

## Sprint 4 — Congés & Absences (Semaines 7-8)

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-030 | Employé: nouvelle demande de congé (portail) | 5 | Must | Calendar picker, type, dates, motif, justificatif |
| US-031 | Manager: validation/refus demande congé | 5 | Must | Motif refus obligatoire, notification employé |
| US-032 | RH: validation finale (vérification solde) | 3 | Must | Génération attestation PDF, MAJ solde |
| US-033 | Système: calcul automatique des soldes (2.5 j/mois) | 8 | Must | Plafond 30j/an, report optionnel |
| US-034 | RH: configuration des politiques de congés | 5 | Must | Type, durée défaut, payé, reportable, justificatif |
| US-035 | RH: gestion des jours fériés guinéens | 3 | Must | Calendrier annuel éditable, types LÉGAL/RELIGIEUX |
| US-036 | Manager: calendrier équipe (vue gantt) | 5 | Should | FullCalendar, filtres, export |
| US-037 | Employé: consultation soldes (portail) | 3 | Should | Par type, période, historique |
| US-038 | RH: saisie directe congé maladie/maternité | 5 | Should | Workflow court (sans validation manager) |
| US-039 | Système: notification WhatsApp + email à chaque étape | 5 | Should | Templates multilingues, opt-in |
| US-040 | RH: attestation PDF de congé signée | 3 | Should | Hash SHA-256, QR code vérification |

**Total Sprint 4**: 50 SP

---

## Sprint 5 — Paie CNSS Paramétrable (Semaines 9-10) ⚠️ CRITIQUE

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-041 | Admin: configurer paramètres CNSS par tenant | 5 | Must | Taux, plafond, SMIG, date d'effet, versionning |
| US-042 | Comptable: ouvrir une période de paie (mois, année) | 3 | Must | Statut OUVERTE, une seule période active |
| US-043 | RH: saisie éléments variables (primes, HS, absences) | 8 | Must | Validation, imposable/non, attaché période |
| US-044 | Système: calcul paie 8 étapes (idempotent) | 13 | Must | Hash SHA-256, audit trail, 50 cas test |
| US-045 | Système: gestion heures supp (majorations cumulables) | 8 | Must | 25/50/75/100%, paramétrable par tenant |
| US-046 | Système: calcul plafond CNSS (8×SMIG) | 3 | Must | Plafonnement automatique |
| US-047 | Comptable: lancement calcul paie (async BullMQ) | 5 | Must | Progress bar, statut period CALCULEE |
| US-048 | Comptable: revue paie + ajustements | 5 | Must | Anomalies mises en avant, édition possible si OUVERTE |
| US-049 | Comptable: clôture période (verrouillage définitif) | 3 | Must | Statut CLOTUREE, locked_at/by, recalcul interdit |
| US-050 | Simulateur frontend: calcul interactif d'un bulletin | 5 | Should | Inputs → tous les calculs intermédiaires affichés |

**Total Sprint 5**: 58 SP

---

## Sprint 6 — Bulletins PDF & Déclarations (Semaines 11-12)

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-051 | Système: génération PDF vectoriel des bulletins | 8 | Must | Puppeteer, template Handlebars, A4 portrait |
| US-052 | Système: archivage MinIO (lifecycle 10 ans) | 5 | Must | Bucket payslips, chiffrement SSE-S3, GLACIER à 12 mois |
| US-053 | Système: signature électronique (hash + QR code) | 5 | Must | SHA-256, QR en footer, endpoint /verify |
| US-054 | Comptable: téléchargement bulletin PDF | 3 | Must | URL présignée 24h, headers Content-Disposition |
| US-055 | Employé: consultation + téléchargement mes bulletins | 3 | Must | Portail employé, 12 derniers bulletins |
| US-056 | Comptable: génération batch tous bulletins période | 5 | Must | BullMQ queue, concurrency 3, 500 PDFs < 1 min |
| US-057 | Comptable: déclaration CNSS trimestrielle PDF | 8 | Must | Format CNSS Guinée, toutes les cotisations |
| US-058 | Comptable: export comptable (Sage/Cegid) CSV | 5 | Should | Format attendu, mapping comptes |
| US-059 | Système: bilingue FR/EN bulletins | 3 | Should | Toggle par employé, default FR |
| US-060 | Comptable: tableau de bord paie (coût total employeur) | 5 | Should | KPIs: masse salariale, charges patronales |

**Total Sprint 6**: 50 SP

---

## Sprint 7 — Dashboards & Exports (Semaines 13-14)

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-061 | RH: dashboard RH (effectif, turn-over, congés) | 8 | Should | KPIs temps réel, charts Recharts |
| US-062 | DG: dashboard direction (masse salariale, coûts) | 8 | Should | Évolution 12 mois, top 10 employés |
| US-063 | Employé: portail employé (mes infos, congés, bulletins) | 5 | Should | Vue self-service |
| US-064 | Manager: dashboard équipe (congés, absences, effectif) | 5 | Should | Filtres par service |
| US-065 | RH: export Excel générique (colonnes configurables) | 8 | Should | ExcelJS, auto-filter, presigned URL |
| US-066 | RH: export PDF rapport personnalisé | 5 | Could | Template Handlebars, multi-pages |
| US-067 | RH: créateur de rapport (drag-drop colonnes) | 8 | Could | Sauvegarde modèle, partagable |
| US-068 | Système: rapports planifiés (cron quotidien) | 5 | Could | BullMQ scheduled jobs, archivage MinIO |
| US-069 | Système: cache Redis dashboards (5 min TTL) | 3 | Should | Invalidation sur mutation |
| US-070 | Système: alertes paie (employés sans contrat, sans CNSS) | 5 | Should | Cron quotidien, notification RH |

**Total Sprint 7**: 60 SP

---

## Sprint 8 — Audit, Tests & Déploiement (Semaines 15-16)

| ID | User Story | SP | Priorité | Critères d'acceptation |
|----|-----------|----|---------:|------------------------|
| US-071 | Système: triggers PostgreSQL audit (toutes tables) | 5 | Must | Append-only, diff JSONB before/after |
| US-072 | Système: variables session PG (app.tenant_id, app.user_id) | 3 | Must | Middleware NestJS, SET LOCAL avant transaction |
| US-073 | Système: immuabilité audit_logs (REVOKE UPDATE/DELETE) | 3 | Must | Trigger bloque modifications |
| US-074 | Super Admin: journal d'audit paginé + filtres | 5 | Must | Filtres user/entity/action/date, export Excel |
| US-075 | RH: timeline audit d'une entité (visuel) | 3 | Should | Diff before/after côte à côte |
| US-076 | Système: audit actions non-DB (login, export, download) | 3 | Must | AuditService.log() explicite |
| US-077 | Développeur: tests E2E Playwright (flows critiques) | 8 | Must | Login, paie, bulletin, congé, audit |
| US-078 | Développeur: couverture tests ≥ 80% | 5 | Must | Rapport coverage, blocage CI si < 80% |
| US-079 | DevOps: Dockerfiles multi-stage (API + Web) | 5 | Must | Images < 200 Mo, non-root user |
| US-080 | DevOps: GitHub Actions CI (lint, test, security) | 5 | Must | Cache pnpm, scan Trivy+Snyk |
| US-081 | DevOps: Helm charts + déploiement K8s staging | 8 | Should | HPA, ingress, cert-manager |
| US-082 | DevOps: observabilité (Sentry, Grafana, Prometheus) | 5 | Should | Logs structurés, alerting |
| US-083 | Documentation: README + runbook + API docs | 5 | Must | Swagger UI, postman collection |

**Total Sprint 8**: 59 SP

---

## Synthèse MVP

| Sprint | Thème | SP | Cumul |
|--------|-------|----|------|
| S1 | Auth & Multi-tenant | 42 | 42 |
| S2 | Entreprises & Employés | 46 | 88 |
| S3 | Contrats & Documents | 43 | 131 |
| S4 | Congés & Absences | 50 | 181 |
| S5 | Paie CNSS (critique) | 58 | 239 |
| S6 | Bulletins PDF | 50 | 289 |
| S7 | Dashboards & Exports | 60 | 349 |
| S8 | Audit & Déploiement | 59 | 408 |

**Total MVP**: 408 SP sur 16 semaines (5 devs × 16 sem × ~5 SP/sem = 400 SP capacitaire)

⚠️ Légère surcharge de 2% — prévoir buffer de 8 SP reportables au Sprint 9 (premium).

---

## Sprints Premium (post-MVP, semaines 17-32)

| Sprint | Module premium | SP |
|--------|---------------|----|
| S9-S10 | Recrutement & Onboarding | 65 |
| S11-S12 | Portail employé + Signature | 55 |
| S13-S14 | Notifications WhatsApp/SMS/email | 45 |
| S15-S17 | Application mobile employé (React Native) | 85 |
| S18-S20 | IA RH (génération contrats, lettres) | 75 |
| S21-S22 | Coffre-fort RH + e-signature | 50 |
| S23-S24 | Reporting DG avancé | 45 |

**Total premium**: 420 SP sur 16 semaines supplémentaires.
