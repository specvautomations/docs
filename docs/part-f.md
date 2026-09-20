# Part F: What Every Project Must Contain (The Contract)

Because we deploy all 7 sites with the same robot, every repository must adhere to the exact same architectural shape. If a repository deviates from this contract, the deployment pipeline will fail.

---

## F1. The Checklist

| # | Requirement | Architectural Reason |
| :---: | :--- | :--- |
| 1 | Use **Node 24** and **npm** with a committed `package-lock.json`. | The Dockerfile relies on `npm ci` and Node 24 runtime environments. |
| 2 | `npm run build` compiles into a **`dist/`** directory; **`dist/index.js`** starts the server. | The production Dockerfile copies `dist/` and runs `node dist/index.js`. |
| 3 | The application listens on **`process.env.PORT`** (default 3000) and binds to **`0.0.0.0`**. | Within a container, binding to `localhost` makes the process unreachable from the host proxy. |
| 4 | **`GET /healthz`** returns `200 ok` immediately without authentication or database locks. | Docker and orchestrators poll this endpoint to verify container liveliness. |
| 5 | All dynamic runtime values are read from **environment variables**. | Development, staging, and production configurations require distinct values. |
| 6 | Application logs are written directly to **`stdout` / `stderr`** (`console.log`). | Docker collects standard streams automatically. Writing to local disk logs is prohibited. |
| 7 | The application writes **no persistent files to disk**, except temporary buffers in `/tmp`. | Production container root filesystems are mounted read-only. |
| 8 | Clean process termination on **`SIGTERM`**. | Deployment rollouts cycle containers without terminating active requests. |
| 9 | **`.env.example`** documents every required configuration key. | Provides developers and DevOps with the required variable schema. |
| 10 | Lifecycle scripts are defined: `dev`, `build`, `lint`, and `test`. | The automated CI pipeline calls these exact npm targets. |
| 11 | Pool size restricted to **5 to 8 connections maximum** (`max` in the pool config). | The shared PostgreSQL instance serves all 7 sites under connection limits. |
| 12 | Trust the edge reverse proxy: `app.set('trust proxy', 1)`. | Allows `req.ip` and protocol checks to reflect the real client instead of the proxy. |

---

## F2. Recommended File Layout

```text
my-app/
  src/
    index.js        # Bootstraps listener, telemetry, and signal handlers
    app.js          # Configures Express middleware and routes (no app.listen here)
    db.js           # Shared database client pool
  test/
    app.test.js
  package.json
  package-lock.json
  .env.example
  .gitignore        # Must include: node_modules, dist, .env
  Dockerfile        # Inherited from repository template; do not alter without DevOps approval
  .dockerignore
  .github/workflows/ci.yml, deploy.yml
```

If you use TypeScript, author your source in `src/` and ensure your `tsconfig.json` directs build output (`"build": "tsc"`) into `dist/`.

---

## F3. Canonical `package.json`

```json
{
  "name": "pcb",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev":   "node --env-file=.env --watch src/index.js",
    "build": "mkdir -p dist && cp -r src/. dist/",
    "start": "node dist/index.js",
    "lint":  "eslint .",
    "test":  "node --test"
  }
}
```

- `--env-file=.env` loads your local configuration natively without external packages.
- `--watch` provides automatic process restart upon file modification.
- The `build` script above is for standard ECMAScript. TypeScript or bundling workflows will replace this with their compilation step.

---

## F4. Reference Implementation

### `src/db.js`

```javascript
import pg from 'pg';

// A connection pool keeps connections open for reuse across requests.
// Setting max: 5 keeps resource utilization bounded across all 7 applications.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
```

### `src/app.js`

```javascript
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { pool } from './db.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);          // Application resides behind Caddy edge proxy
  app.disable('x-powered-by');        // Suppress server fingerprinting

  // Health probe declared first: bypasses rate limits, auth, and database dependencies
  app.get('/healthz', (req, res) => res.status(200).send('ok'));

  app.use(helmet());                                  // Standard security headers
  app.use(express.json({ limit: '100kb' }));          // Restrict request body payload size
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

  // Sample parameterized query: $1 is an isolated parameter, never a string concat
  app.get('/api/items/:id', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT id, name FROM items WHERE id = $1', [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'not found' });
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // Global error handler: log operational detail internally, return clean error to client
  app.use((err, req, res, next) => {
    console.error(JSON.stringify({ level: 'error', msg: err.message, path: req.path }));
    res.status(500).json({ error: 'internal error' });
  });

  return app;
}
```

### `src/index.js`

```javascript
import { createApp } from './app.js';
import { pool } from './db.js';

const PORT = Number(process.env.PORT ?? 3000);
const server = createApp().listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ level: 'info', msg: 'listening', port: PORT }));
});

// Periodic telemetry logging: prints memory statistics once per minute
setInterval(() => {
  const m = process.memoryUsage();
  console.log(JSON.stringify({
    level: 'info',
    msg: 'mem',
    rssMB: Math.round(m.rss / 1048576),
    heapMB: Math.round(m.heapUsed / 1048576)
  }));
}, 60_000).unref();

// Graceful drain lifecycle: reject new connections, complete active tasks, close DB pool
function shutdown(signal) {
  console.log(JSON.stringify({ level: 'info', msg: 'shutting down', signal }));
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();    // Force exit after 10s timeout
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Uncaught errors: log fatal error and restart cleanly via container manager
process.on('unhandledRejection', (err) => { console.error(err); process.exit(1); });
process.on('uncaughtException',  (err) => { console.error(err); process.exit(1); });
```

---

## F5. Architectural Rationale

| Implementation Element | Justification |
| :--- | :--- |
| `listen(PORT, '0.0.0.0')` | Exposes the container network interface to the ingress reverse proxy. |
| `/healthz` precedence | Guarantees liveliness responses remain operational even under database saturation. |
| `helmet()` | Appends standard defensive HTTP headers (CSP, HSTS, frame protections). |
| `limit: '100kb'` | Blocks memory exhaustion denial-of-service via massive JSON body ingestion. |
| `rateLimit` | Protects API pathways from bot exhaustion and malicious request flooding. |
| `pool max: 5` | Enforces equitable connection sharing against the fixed PostgreSQL limit. |
| `SIGTERM` handler | Prevents mid-flight request dropped packets during rolling container deploys. |
| Termination on uncaught exceptions | Allows Docker orchestrators to instantly recycle degraded workers into clean state. |