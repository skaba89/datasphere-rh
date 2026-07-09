# Prompt 02 — Module Auth & RBAC

## CONTEXTE

Dans le monorepo DataSphere RH Guinée (initialisé via prompt 01), implémente le
module Authentification complet dans `apps/api/src/auth/`.

## FONCTIONNALITÉS

1. POST /api/v1/auth/login (email, password, 2FA optionnel)
2. POST /api/v1/auth/refresh (rotation du refresh token, blacklist ancien)
3. POST /api/v1/auth/logout (révocation refresh)
4. POST /api/v1/auth/2fa/setup (QR code TOTP)
5. POST /api/v1/auth/2fa/verify (validation code 6 chiffres)
6. POST /api/v1/auth/password/forgot + /reset (email reset token, expiry 1h)
7. GET /api/v1/auth/me (profil + permissions)
8. 6 rôles RBAC: super_admin, admin_entreprise, rh, manager, comptable, employé
9. Guards NestJS: @Roles() decorator + JwtAuthGuard + TenantGuard
10. Refresh token stocké hashé en Redis (rotation + détection de réutilisation)

## SÉCURITÉ

- Bcrypt (cost 12) pour password hashing
- JWT signé HS256, claims: `{sub, tenant_id, role, permissions[]}`
- Access token: 15 min
- Refresh token: 7 jours, rotation à chaque usage, blacklist Redis en cas de révocation
- Rate limiting: 5 login/min/IP (Redis)
- Lock compte après 5 échecs (unlock par admin, durée 15 min)
- 2FA obligatoire pour super_admin et admin_entreprise
- Reset password: token JWT signé séparément, expiry 1h, usage unique

## STRUCTURE NESTJS

```
apps/api/src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── tenant.guard.ts
├── decorators/
│   ├── roles.decorator.ts
│   ├── current-user.decorator.ts
│   └── tenant.decorator.ts
├── dto/
│   ├── login.dto.ts
│   ├── refresh.dto.ts
│   ├── 2fa-setup.dto.ts
│   ├── 2fa-verify.dto.ts
│   └── password-reset.dto.ts
└── __tests__/
    ├── auth.service.spec.ts
    ├── auth.e2e-spec.ts
    └── fixtures.ts
```

## PERMISSIONS (matrice RBAC)

```typescript
const PERMISSIONS = {
  SUPER_ADMIN: ['*:*'], // tous droits
  ADMIN_ENTREPRISE: [
    'tenants:read', 'companies:*', 'users:*', 'roles:*', 'cnss-params:*',
    'employees:*', 'contracts:*', 'payroll:*', 'audit:read'
  ],
  RH: [
    'employees:*', 'contracts:*', 'leaves:*', 'documents:*',
    'payroll:read', 'payslips:read', 'audit:read:own-tenant'
  ],
  MANAGER: [
    'employees:read:team', 'leaves:approve', 'leaves:read:team',
    'payslips:read:team', 'dashboard:read:team'
  ],
  COMPTABLE: [
    'payroll:*', 'payslips:*', 'employees:read', 'exports:*',
    'audit:read:payroll'
  ],
  EMPLOYE: [
    'profile:read:own', 'leaves:create:own', 'leaves:read:own',
    'payslips:read:own', 'documents:read:own'
  ],
};
```

## TESTS

- Unit tests: AuthService, JwtStrategy, RolesGuard
- E2E: flow complet login → 2FA → refresh → logout → reuse détecté (doit échouer)
- E2E: forgot password → reset → login avec nouveau password
- E2E: 5 échecs → lock → unlock après 15 min

## DÉPENDANCES NPM

```json
{
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "passport-jwt": "^4.0.1",
  "bcrypt": "^5.1.1",
  "otplib": "^12.0.1",
  "qrcode": "^1.5.3",
  "@nestjs/throttler": "^5.2.0"
}
```

Génère le code complet NestJS + tests + documentation Postman collection.
