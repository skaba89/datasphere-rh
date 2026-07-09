# Seed Data — DataSphere RH Guinée

> Le script `seed/index.ts` (à créer dans `packages/db/`) utilise ces données
> pour peupler le tenant `demo` lors de `pnpm db:seed`.

## Tenant de démonstration

```json
{
  "name": "Demo SARL",
  "slug": "demo",
  "schema_name": "tenant_demo",
  "plan": "business"
}
```

## Société de démonstration

```json
{
  "raison_sociale": "Demo SARL",
  "sigle": "DS",
  "nif": "GN-CONAKRY-001-2024",
  "rc": "RC/Conakry/2024/A-001",
  "cnss_numero": "CNSS-001-2024",
  "adresse": "Hamdallaye, Route Le Prince, Conakry",
  "ville": "Conakry",
  "telephone": "+224 622 000 000",
  "email": "contact@demo.gn",
  "devise_principale": "GNF"
}
```

## Paramètres CNSS par défaut (Guinée 2024)

```json
{
  "taux_cnss_salarie": 0.05,
  "taux_cnss_employeur": 0.08,
  "plafond_cnss": 4640000,
  "smig": 580000,
  "taux_rts": 0.01,
  "taux_versement_forfaitaire": 0.04,
  "taux_taxe_apprentissage": 0.01,
  "taux_formation_pro": 0.03,
  "taux_accident_travail": 0.02,
  "periodicite": "MENSUEL",
  "date_effet": "2024-01-01"
}
```

## Utilisateurs de démonstration

| Rôle | Email | Mot de passe (hash bcrypt) | 2FA |
|------|-------|---------------------------|-----|
| SUPER_ADMIN | superadmin@datasphererh.gn | Demo1234! | Activé (code: voir logs) |
| ADMIN_ENTREPRISE | admin@demo.gn | Demo1234! | Activé |
| RH | rh@demo.gn | Demo1234! | Désactivé |
| COMPTABLE | comptable@demo.gn | Demo1234! | Désactivé |
| MANAGER | manager@demo.gn | Demo1234! | Désactivé |
| EMPLOYE | employe@demo.gn | Demo1234! | Désactivé |

⚠️ Pour les comptes 2FA activés, le code TOTP est imprimé dans la console
lors du seed (mode dev uniquement — ne jamais faire ça en production).

## Employés de démonstration (5 employés)

### Employé 1: Diallo Mamadou (CDI, Manager)
```json
{
  "matricule": "DS-001",
  "nom": "Diallo",
  "prenoms": "Mamadou",
  "cnss_numero": "1234567890",
  "date_embauche": "2020-03-15",
  "sexe": "M",
  "statut": "actif",
  "contract": {
    "type": "CDI",
    "poste": "Directeur Technique",
    "salaire_base": 5000000,
    "date_debut": "2020-03-15"
  }
}
```

### Employé 2: Camara Aïssatou (CDI, RH)
```json
{
  "matricule": "DS-002",
  "nom": "Camara",
  "prenoms": "Aïssatou",
  "cnss_numero": "1234567891",
  "date_embauche": "2021-06-01",
  "sexe": "F",
  "statut": "actif",
  "contract": {
    "type": "CDI",
    "poste": "Responsable RH",
    "salaire_base": 3500000,
    "date_debut": "2021-06-01"
  }
}
```

### Employé 3: Bah Ousmane (CDD, Développeur)
```json
{
  "matricule": "DS-003",
  "nom": "Bah",
  "prenoms": "Ousmane",
  "cnss_numero": "1234567892",
  "date_embauche": "2024-01-15",
  "sexe": "M",
  "statut": "actif",
  "contract": {
    "type": "CDD",
    "poste": "Développeur Senior",
    "salaire_base": 4000000,
    "date_debut": "2024-01-15",
    "date_fin": "2025-12-31",
    "motif_cdd": "Remplacement congé maternité"
  }
}
```

### Employé 4: Touré Fatoumata (CDI, Comptable)
```json
{
  "matricule": "DS-004",
  "nom": "Touré",
  "prenoms": "Fatoumata",
  "cnss_numero": "1234567893",
  "date_embauche": "2019-09-01",
  "sexe": "F",
  "statut": "actif",
  "contract": {
    "type": "CDI",
    "poste": "Comptable",
    "salaire_base": 2800000,
    "date_debut": "2019-09-01"
  }
}
```

### Employé 5: Sylla Ibrahima (Stage, Junior)
```json
{
  "matricule": "DS-005",
  "nom": "Sylla",
  "prenoms": "Ibrahima",
  "cnss_numero": "1234567894",
  "date_embauche": "2024-09-01",
  "sexe": "M",
  "statut": "actif",
  "contract": {
    "type": "STAGE",
    "poste": "Stagiaire RH",
    "salaire_base": 350000,
    "date_debut": "2024-09-01",
    "date_fin": "2025-02-28"
  }
}
```

## Jours fériés guinéens 2025

```json
[
  { "date": "2025-01-01", "name": "Jour de l'An", "type": "LEGAL" },
  { "date": "2025-03-08", "name": "Journée de la Femme", "type": "LEGAL" },
  { "date": "2025-04-03", "name": "Lundi de Pâques", "type": "RELIGIEUX" },
  { "date": "2025-04-10", "name": "Maouloud", "type": "RELIGIEUX" },
  { "date": "2025-05-01", "name": "Fête du Travail", "type": "LEGAL" },
  { "date": "2025-05-29", "name": "Ascension", "type": "RELIGIEUX" },
  { "date": "2025-06-09", "name": "Lundi de Pentecôte", "type": "RELIGIEUX" },
  { "date": "2025-06-16", "name": "Aïd el-Fitr", "type": "RELIGIEUX" },
  { "date": "2025-08-15", "name": "Assomption", "type": "RELIGIEUX" },
  { "date": "2025-08-23", "name": "Aïd el-Kébir", "type": "RELIGIEUX" },
  { "date": "2025-10-02", "name": "Fête de l'Indépendance", "type": "LEGAL" },
  { "date": "2025-11-01", "name": "Toussaint", "type": "RELIGIEUX" },
  { "date": "2025-12-25", "name": "Noël", "type": "RELIGIEUX" }
]
```

## Politiques de congés par défaut

```json
[
  { "type": "CONGE_PAYE", "name": "Congés payés annuels", "default_days": 30, "is_paid": true, "needs_approval": true, "carry_over": true },
  { "type": "MALADIE", "name": "Congé maladie", "default_days": 0, "is_paid": true, "needs_approval": false, "needs_justificatif": true, "carry_over": false },
  { "type": "MATERNITE", "name": "Congé maternité", "default_days": 98, "is_paid": true, "needs_approval": false, "needs_justificatif": true, "carry_over": false },
  { "type": "PATERNITE", "name": "Congé paternité", "default_days": 21, "is_paid": true, "needs_approval": false, "carry_over": false },
  { "type": "MARIAGE", "name": "Congé mariage", "default_days": 3, "is_paid": true, "needs_approval": true, "carry_over": true },
  { "type": "DECES", "name": "Congé décès proche", "default_days": 3, "is_paid": true, "needs_approval": true, "carry_over": false },
  { "type": "SANS_SOLDE", "name": "Congé sans solde", "default_days": 0, "is_paid": false, "needs_approval": true, "carry_over": false }
]
```
