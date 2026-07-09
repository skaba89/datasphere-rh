# Prompt 09 — Module Audit Trail

## CONTEXTE

Implémente le module Audit Trail immuable dans `apps/api/src/audit/`. Ce module
est transverse à tous les autres modules et journalise chaque mutation.

## ENTITÉ PRISMA (déjà dans schema.prisma)

- AuditLog: id BIGSERIAL, tenant_id, user_id, action, entity_type, entity_id,
  diff JSONB, ip_address, user_agent, created_at

## MÉCANISMES D'AUDIT

### 1. Trigger PostgreSQL (déjà fourni dans init-multi-tenant.sh)

```sql
CREATE OR REPLACE FUNCTION tenant_{slug}.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tenant_{slug}.audit_logs
        (tenant_id, user_id, action, entity_type, entity_id, diff)
    VALUES (current_setting('app.tenant_id', true)::uuid,
            current_setting('app.user_id', true)::uuid,
            TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
            jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger à toutes les tables métier
CREATE TRIGGER audit_companies   AFTER INSERT OR UPDATE OR DELETE
  ON tenant_{slug}.companies   FOR EACH ROW EXECUTE FUNCTION tenant_{slug}.audit_trigger_fn();
CREATE TRIGGER audit_employees   AFTER INSERT OR UPDATE OR DELETE
  ON tenant_{slug}.employees   FOR EACH ROW EXECUTE FUNCTION tenant_{slug}.audit_trigger_fn();
CREATE TRIGGER audit_contracts   AFTER INSERT OR UPDATE OR DELETE
  ON tenant_{slug}.contracts   FOR EACH ROW EXECUTE FUNCTION tenant_{slug}.audit_trigger_fn();
-- ... etc pour toutes les tables sensibles
```

### 2. Variables de session PostgreSQL

Le middleware NestJS doit positionner les variables de session avant chaque requête:

```typescript
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as User;
    const tenantId = user?.tenantId || req.headers['x-tenant-id'];

    // Prisma middleware: SET LOCAL avant chaque transaction
    prisma.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
    prisma.$executeRaw`SET LOCAL app.user_id = ${user?.id || 'null'}`;
    next();
  }
}
```

### 3. Application-level audit (actions non-DB)

Pour les actions qui ne touchent pas la DB (login, export, download PDF),
audit explicite via service:

```typescript
@Injectable()
export class AuditService {
  async log(action: string, entityType: string, entityId: string, diff?: any) {
    await prisma.auditLog.create({
      data: {
        tenantId: this.tenantContext.id,
        userId: this.userContext.id,
        action,
        entityType,
        entityId,
        diff,
        ipAddress: this.request.ip,
        userAgent: this.request.headers['user-agent'],
      }
    });
  }
}

// Usage
await auditService.log('LOGIN', 'user', user.id);
await auditService.log('EXPORT', 'employees', null, { format: 'xlsx', count: 150 });
await auditService.log('DOWNLOAD', 'payslip', payslip.id);
```

## ACTIONS AUDITÉES

| Action | Entity type | Description |
|--------|-------------|-------------|
| CREATE | employees, contracts, ... | Création d'entité |
| UPDATE | employees, contracts, ... | Modification |
| DELETE | employees, contracts, ... | Suppression |
| VALIDATE | contracts, leaves, payroll_periods | Validation workflow |
| LOGIN | user | Connexion réussie |
| LOGIN_FAILED | user | Échec de connexion |
| LOGOUT | user | Déconnexion |
| EXPORT | employees, payslips, audit | Export Excel/CSV/PDF |
| DOWNLOAD | payslip, document | Téléchargement fichier |
| SIGN | contract, document | Signature électronique |
| LOCK | payroll_period | Clôture période |
| CONFIG_CHANGE | cnss_params, leave_policies | Modification config |

## ENDPOINTS API

- GET /audit (paginé, filtrable)
  - filter[user_id]
  - filter[entity_type]
  - filter[action]
  - filter[from] / filter[to] (date range)
  - sort=created_at:desc (par défaut)
- GET /audit/:id (détail avec diff before/after formaté)
- GET /audit/export (export Excel paginé)
- GET /audit/timeline/:entityType/:entityId (historique d'une entité)

## FRONTEND

```
apps/web/app/audit/
├── page.tsx                    # liste avec filtres avancés
├── [id]/page.tsx               # détail log (diff before/after côte à côte)
└── timeline/[entityType]/[entityId]/page.tsx  # historique d'une entité
```

### Visualisation du diff

```tsx
<DiffViewer
  before={log.diff.before}
  after={log.diff.after}
  format="side-by-side"  // ou "inline"
  highlightChanges={true}
/>
```

## IMMUABILITÉ

- Pas d'UPDATE ni DELETE sur la table audit_logs au niveau application
- Permission PostgreSQL: `REVOKE UPDATE, DELETE ON audit_logs FROM app_user;`
- Trigger additionnel qui bloque UPDATE/DELETE:
  ```sql
  CREATE OR REPLACE FUNCTION prevent_audit_modification()
  RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'Audit logs are immutable';
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER prevent_audit_update BEFORE UPDATE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
  CREATE TRIGGER prevent_audit_delete BEFORE DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
  ```

## RÉTENTION LÉGALE

- Rétention: 10 ans (loi guinéenne + RGPD)
- Pas de suppression automatique
- Partitionnement RANGE par created_at (partition mensuelle) pour performance
- Archive: au bout de 5 ans, déplacer partitions vers table `audit_logs_archive`
  (même schéma, compressé)

## EXPORT AUDIT

- Endpoint GET /audit/export génère Excel signé
- Signature: hash SHA-256 du fichier + horodatage
- Métadonnées dans Excel: tenant, période, count, généré par, généré le
- Archivage MinIO bucket `exports`

## TESTS

- Unit: AuditService.log, formatage diff
- Integration: UPDATE sur employee → audit log créé avec diff correct
- Integration: tentative UPDATE/DELETE sur audit_logs → erreur PostgreSQL
- E2E: connexion → action → audit visible → export

## PERFORMANCE

- Index: (tenant_id, created_at DESC), (entity_type, entity_id)
- Pagination obligatoire (limit max 100)
- Recherche full-text sur `action` et `entity_type` via pg_trgm
- Pour requêtes analytiques: materialized view `mv_audit_stats` refreshée daily

Génère triggers SQL complets + service NestJS + frontend + tests.
