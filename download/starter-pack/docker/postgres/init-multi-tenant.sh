#!/bin/sh
# Initialize PostgreSQL for multi-tenant mode
set -e

echo "=== DataSphere RH Guinée — PostgreSQL initialization ==="

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS btree_gin;

    CREATE TABLE IF NOT EXISTS public.tenants (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name            VARCHAR(255) NOT NULL,
        slug            VARCHAR(100) UNIQUE NOT NULL,
        plan            VARCHAR(50) NOT NULL DEFAULT 'starter',
        status          VARCHAR(20) NOT NULL DEFAULT 'active',
        schema_name     VARCHAR(100) UNIQUE NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW(),
        metadata        JSONB DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
    CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

    CREATE TABLE IF NOT EXISTS public.plans (
        id              SERIAL PRIMARY KEY,
        code            VARCHAR(50) UNIQUE NOT NULL,
        name            VARCHAR(100) NOT NULL,
        price_gnf       DECIMAL(14,2) NOT NULL,
        max_employees   INT,
        max_companies   INT,
        features        JSONB DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    INSERT INTO public.plans (code, name, price_gnf, max_employees, max_companies, features) VALUES
        ('micro',     'Micro',      3000,  10,   1, '{"modules": ["auth","employees","payroll","payslips"]}'),
        ('starter',   'Starter',    5000,  50,   1, '{"modules": ["auth","employees","contracts","leaves","payroll","payslips","audit"]}'),
        ('business',  'Business',   8000,  500,  10, '{"modules": ["all_mvp","recruitment","portal","notifications","reporting"]}'),
        ('enterprise','Enterprise', 12000, NULL, NULL, '{"modules": ["all","sso","premium_support","on_premise_option"]}')
    ON CONFLICT (code) DO NOTHING;

    INSERT INTO public.tenants (name, slug, schema_name, plan)
    VALUES ('Demo SARL', 'demo', 'tenant_demo', 'business')
    ON CONFLICT (slug) DO NOTHING;

    CREATE SCHEMA IF NOT EXISTS tenant_demo;
EOSQL

echo "=== PostgreSQL prêt ==="
