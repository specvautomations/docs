# Part H: Working with the Database

Guidelines for PostgreSQL connection pooling, transactional integrity, query efficiency, and zero-downtime schema migrations.

---

## H1. Operating Context

- **Development:** You connect to `dev-postgres`. This is your sandboxed database cluster where you have full permissions to create, modify, and drop schemas.
- **Production:** Each service has its own dedicated database and distinct credentials. Services cannot inspect or query data across application boundaries.
- **Credential Delivery:** Production database credentials are managed exclusively by DevOps and injected at container boot via `DATABASE_URL`.
- **Host Resource Limits:**
  - **Connection Ceiling:** Maximum 10 connections per container (configure pool `max: 5`).
  - **Statement Timeout:** Any query executing longer than 15 seconds is terminated by PostgreSQL.
  - **Idle Transaction Timeout:** Transactions left open without activity for over 30 seconds are forcibly disconnected.

---

## H2. Connection Pools and Parameterized Queries

Always query through the connection pool. Never concatenate user variables directly into query strings.

```javascript
// <span class="status-tag pass">[PASS]</span> Correct: pool manages client checkout and return automatically
const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

// <span class="status-tag pass">[PASS]</span> Correct: manual client checkout with mandatory release in finally block
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query(
    'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
    [amount, fromId]
  );
  await client.query(
    'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
    [amount, toId]
  );
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  // Omitting client.release() is the primary cause of connection pool exhaustion
  client.release();
}

// <span class="status-tag fail">[PROHIBITED]</span> Critical defect: string concatenation leads directly to SQL injection
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

::: tip TRANSACTION ATOMICITY
Wrap operations in explicit transactions (`BEGIN` / `COMMIT`) whenever two or more state mutations must succeed together (such as debiting and crediting ledger balances). Unhandled failures mid-operation will leave the database in an inconsistent, corrupt state.
:::

---

## H3. Query Optimization and Indexing

| Technique | Operational Justification |
| :--- | :--- |
| **Enforce LIMIT clauses (pagination)** | Unbounded `SELECT * FROM table` on growing datasets exhausts Node.js heap memory. |
| **Select specific columns** | Reduces network transfer overhead, disk I/O, and serialization CPU costs. |
| **Index filtering and join targets** | Omitting indexes forces PostgreSQL into full sequential table scans. |
| **Eliminate N+1 query loops** | Executing queries inside loops amplifies 100 records into 101 network roundtrips. Use `JOIN` or `WHERE id = ANY($1)`. |
| **Use `EXPLAIN ANALYZE`** | Inspects the query execution plan, revealing sequential scans and node bottlenecks. |
| **Target sub-second queries** | The database statement ceiling is 15s, but web clients disconnect if responses exceed 3s. |
| **Delegate bulk reports to workers** | HTTP requests must complete quickly before edge timeouts abort connections (Cloudflare terminates at ~100s). |

### Keyset / Offset Pagination Pattern

```javascript
const page = Math.max(1, Number(req.query.page) || 1);
const limit = 20;
const offset = (page - 1) * limit;

const { rows } = await pool.query(
  'SELECT id, name FROM products ORDER BY id LIMIT $1 OFFSET $2',
  [limit, offset]
);
```

---

## H4. Safe Database Migrations

Manual schema edits on production databases are prohibited. Every modification must be committed as an incremental, numbered SQL migration script.

### Migration File Organization

Store migration files inside `src/migrations/`. Build scripts copy these files into `dist/migrations/` during compilation:

```text
src/migrations/001_create_items.sql
src/migrations/002_add_price_to_items.sql
```

Sample migration (`src/migrations/001_create_items.sql`):

```sql
CREATE TABLE items (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Automated Migration Runner (`src/migrate.js`)

The continuous deployment pipeline executes `node dist/migrate.js` before releasing new containers:

```javascript
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  // Migrations on large tables may exceed default statement timeout thresholds
  await client.query('SET statement_timeout = 0');
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // Advisory lock prevents concurrent migration executions across redundant workers
  await client.query('SELECT pg_advisory_lock(727274)');

  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map(r => r.name));

  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    
    console.log(JSON.stringify({ level: 'info', msg: 'applying_migration', file }));
    const sql = await fs.readFile(path.join(dir, file), 'utf8');
    
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err; // Halts deployment; current stable release continues running
    }
  }
  
  console.log(JSON.stringify({ level: 'info', msg: 'migrations_complete' }));
} finally {
  await client.end();
}
```

Add the development migration script target to `package.json`:

```json
"scripts": {
  "migrate": "node --env-file=.env src/migrate.js"
}
```

::: tip NON-TRANSACTIONAL DDL
`CREATE INDEX CONCURRENTLY` cannot run inside a PostgreSQL transaction block. Coordinate with DevOps if concurrent indexing is required.
:::

---

## H5. The 6 Migration Directives

1. **Immutable History:** Never edit a merged migration file. It has already executed on production. Create a new sequential migration instead.
2. **Atomic Units:** One schema mutation per migration file.
3. **Additive Changes First:** Additive changes are safe for running code: creating new tables, adding nullable columns, adding default-valued columns, and adding indexes.
4. **Zero Destructive Syncs:** Never rename or drop a column in the same deployment that removes code usage. The prior container version remains active during rolling restarts and rollbacks; dropping columns immediately breaks active containers.
5. **The Expand-and-Contract Pattern (Multi-Phase Deployments):**
   - **Phase 1 (Expand):** Add the new column and deploy code that writes to both old and new columns.
   - **Phase 2 (Migrate):** Backfill data from the old column to the new column, then switch application reads to the new column.
   - **Phase 3 (Contract):** Stop writing to the old column and execute a migration dropping the legacy column.
6. **Dual Verification:** Validate every migration against both a clean database and a populated seed database. Mark `Migration: yes` on your Pull Request description so DevOps can create a pre-merge database snapshot.

---

## H6. Synthetic Test Data

Use synthetic data generators (such as `@faker-js/faker` or a local `seed.sql`) inside development environments. Copying production records to local sandboxes is prohibited.