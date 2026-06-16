DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales_rep');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'pending', 'deactivated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name                VARCHAR(255) NOT NULL,
  last_name                 VARCHAR(255),
  email                     VARCHAR(255) NOT NULL,
  password_hash             VARCHAR(255) NOT NULL,
  role                      user_role   NOT NULL DEFAULT 'admin',
  status                    user_status NOT NULL DEFAULT 'active',
  invite_token              VARCHAR(255),
  invite_token_expires_at   TIMESTAMPTZ,
  password_reset_token      VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  deactivated_at            TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS users_org_idx
  ON users (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS users_org_email_unique_idx
  ON users (organization_id, email)
  WHERE deleted_at IS NULL;
