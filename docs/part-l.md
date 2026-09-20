# Part L: How to Test That Everything Works

Verification methodologies for preventing defects from reaching production. Testing operates in structured layers to isolate specific failure modes.

---

## Testing Layers

| Layer | Objective | Execution Phase | Tooling |
| :--- | :--- | :--- | :--- |
| **1. Manual Exploratory** | Validate functionality and stress edge cases directly | Local development | Web browser, `curl` |
| **2. Automated Unit/Integration** | Fast, repeatable programmatic assertions | Pre-commit and CI | Node.js built-in test runner (`node --test`) |
| **3. Production Mode Verification** | Catch module resolution and build artifact errors | Pre-Pull Request | `node dist/index.js` under production flags |
| **4. Load and Memory Profiling** | Verify process memory limits and event loop stability | Tasks handling files or bulk data | `autocannon`, `ps` |
| **5. Continuous Integration (CI)** | Automated enforcement of linting, builds, and tests | Pull Request lifecycle | GitHub Actions |
| **6. Post-Deployment Smoke Test** | Live verification on the target domain | Immediate post-merge | Production browser, live probe |

---

## L1. Manual Edge-Case Checklist

When testing features manually in your development environment, verify both nominal and hostile cases:

- **Nominal Flow:** The expected input and usage pattern.
- **Malformed Input:** Empty payloads, excessively long strings, and special characters (`'`, `"`, `<`, `>`, `&`, `%`).
- **Type Violations:** Passing alphabetic characters into integer fields, negative values, and zero.
- **Authentication Boundaries:** Unauthenticated states and access attempts using another user account.
- **Race Conditions:** Submitting forms twice rapidly and interrupting requests mid-flight.
- **Responsive Viewports:** Inspecting layout rendering on narrow mobile viewports.
- **Navigation Flow:** Browser back and forward button navigation during multi-step forms.

---

## L2. Automated Testing Suite

Automated tests execute in seconds using Node.js built-in test runner. The project contract isolates Express initialization inside `createApp()` so test suites can bind to ephemeral ports without conflicting with existing dev servers:

### `test/app.test.js`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

test('GET /healthz returns 200 ok', async () => {
  // Binding to port 0 instructs the operating system to assign an ephemeral free port
  const server = createApp().listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'ok');
  } finally {
    server.close();
  }
});
```

Execute tests via npm:

```bash
npm test
```

### Test Value Priorities

1. **Liveliness Probe:** Guarantee `GET /healthz` always answers `200 OK`.
2. **HTTP Status Codes:** Verify routes return accurate status codes (`200` for success, `400` for invalid payloads, `401`/`403` for unauthorized access, `404` for missing entities).
3. **Business Logic Invariants:** Calculations, pricing ledgers, access control checks, and data mutations.
4. **Regression Coverage:** Every resolved bug must include an accompanying automated test reproducing the defect to prevent future regressions.

::: tip DATABASE TEST ISOLATION
Tests requiring database access must target isolated development databases (for example `pcb_dev` or `pcb_test`). Automated tests must never connect to production instances.
:::

---

## L3. The `/healthz` Probe Contract

The `/healthz` route is the heartbeat monitor for container orchestration. Following deployment, the server polls this endpoint continuously. If it fails to return `200 OK` within 90 seconds, the deployment triggers an automated rollback to the prior release.

- **Zero External Dependencies:** Must not query databases, cache layers, or external third-party APIs.
- **No Authentication:** Must remain accessible without session tokens, cookies, or API keys.
- **Local Verification:**
  ```bash
  curl -i http://localhost:3000/healthz
  ```

---

## L4. Definition of Done

Do not open a Pull Request until every verification item below is satisfied:

- [ ] Manual edge-case verification completed, including boundary values.
- [ ] `npm run lint`, `npm test`, and `npm run build` pass without warnings or errors.
- [ ] Built application runs cleanly in production mode and `/healthz` returns `200 OK`.
- [ ] Automated unit or integration tests accompany new application logic.
- [ ] Memory footprint validated under load for tasks handling files or bulk datasets.
- [ ] Diff audited: zero secrets, no `.env` files, no `node_modules/`, and no `dist/` staged.
- [ ] Required new environment variable keys added to `.env.example` and communicated to DevOps.
- [ ] Schema changes committed as numbered migrations, tested on clean and populated databases.
- [ ] Pull Request description clearly documents what changed, why, and exact steps to test.