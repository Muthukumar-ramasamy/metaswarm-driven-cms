# Phase 10 — MCP Integrations

**Status**: ✅ Complete  
**Decision**: Neon MCP only (GitHub MCP and Figma MCP deferred post-MVP)

---

## Why Neon MCP

The CRM uses Neon (serverless PostgreSQL) as its database. The Neon MCP server gives Claude direct access to:

- Run arbitrary SQL against the live database (schema inspection, seed data, verification queries)
- Inspect the schema of any table
- Create and manage Neon branches (dev/test isolation)
- Run migrations and verify they applied correctly
- List all tables, their columns, and their indexes

This removes the manual step of running `psql` or `drizzle-kit studio` to verify database state during implementation and review.

---

## MCP not selected (and why)

| MCP | Decision | Reason |
|-----|----------|--------|
| GitHub MCP | Deferred | No GitHub remote needed until project is ready to share |
| Figma MCP | Deferred | UI specs are text-based; Figma designs not created yet |

---

## Configuration

### `.mcp.json` (project root — gitignored, contains credentials)

Uses `@modelcontextprotocol/server-postgres` installed globally. Connects directly to Neon via the pooler connection string — no API key needed.

```json
{
  "mcpServers": {
    "postgres": {
      "command": "node",
      "args": [
        "C:\\nvm4w\\nodejs\\node_modules\\@modelcontextprotocol\\server-postgres\\dist\\index.js",
        "postgresql://<user>:<password>@<pooler-host>/neondb?sslmode=require&channel_binding=require"
      ]
    }
  }
}
```

Install the server once:
```powershell
npm install -g @modelcontextprotocol/server-postgres
```

`.mcp.json` is in `.gitignore` — credentials are never committed.

### `backend/.env` (gitignored — app connection)

```
DATABASE_URL=postgresql://<user>:<password>@<host>/neondb?sslmode=require
DATABASE_POOLER_URL=postgresql://<user>:<password>@<pooler-host>/neondb?sslmode=require&channel_binding=require
JWT_SECRET=<32+ char secret>
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

`DATABASE_URL` = direct host (used by Drizzle Kit for migrations)  
`DATABASE_POOLER_URL` = pooler host (used by the app at runtime for connection pooling)

---

## Integration points

### During `/scaffold`

After creating `backend/src/db/index.ts`, use Neon MCP to verify the connection is live:

```
mcp_neon: list_databases
```

Expected: `neondb` appears in the list. If it doesn't, the connection string in `backend/.env` is wrong.

### During `/implement-feature`

After the Backend Agent generates `backend/drizzle/{timestamp}_create_{entity}.sql`:

1. Use Neon MCP to run the migration SQL:
   ```
   mcp_neon: run_sql
   sql: <contents of the migration file>
   ```

2. Verify the table was created with the correct columns:
   ```
   mcp_neon: describe_table
   table_name: <entity_name>
   ```

3. Cross-check the result against `db-spec.md` — every field in the spec should appear in the table description.

### During `/generate-tests`

Before generating integration tests, inspect the live schema to confirm test seed data will match the actual column constraints:

```
mcp_neon: run_sql
sql: SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = '<entity>'
     ORDER BY ordinal_position;
```

### During `/review-feature`

As part of the DB schema compliance check (Step 1 of `/review-feature`), use Neon MCP to query the live schema instead of relying solely on the Drizzle schema file:

```
mcp_neon: run_sql
sql: SELECT indexname, indexdef
     FROM pg_indexes
     WHERE tablename = '<entity>';
```

Confirm that partial unique indexes (e.g. `UNIQUE (organization_id, email) WHERE deleted_at IS NULL`) are present.

---

## Common MCP queries reference

```sql
-- List all tables in the database
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Show columns for a table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

-- Show indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'contacts';

-- Show foreign keys
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'contacts';

-- Count rows per org (quick data check)
SELECT organization_id, COUNT(*) FROM contacts WHERE deleted_at IS NULL GROUP BY 1;

-- Verify soft delete (should return 0 rows if hard-delete never happened)
SELECT COUNT(*) FROM contacts WHERE deleted_at IS NOT NULL;
```

---

## Neon branch workflow (optional, post-MVP)

Neon supports database branching — create a dev branch per feature to isolate migration development from the main branch:

```
mcp_neon: create_branch
branch_name: dev/lead-management
```

Run migrations against the branch, verify, then merge back to main. This prevents broken migrations from affecting other developers.

Not required for single-developer MVP — use the main branch for everything.

---

## Notes

- The Neon MCP uses the Management API (NEON_API_KEY), not the database password. Both are needed: the API key for MCP, the connection string for the app.
- Never commit either credential to git. `backend/.env` is already in `.gitignore`. For `.mcp.json`, the `NEON_API_KEY` is resolved from the shell environment at runtime, not stored in the file.
- The pooler connection string (`DATABASE_POOLER_URL`) is used at runtime to avoid connection exhaustion in serverless environments. The direct connection string (`DATABASE_URL`) is used by Drizzle Kit for migrations only.
