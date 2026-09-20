# Part G: Secrets and Environment Variables

Operational rules for managing application configuration, credential isolation, and emergency procedures for secret exposure.

---

## G1. Principles

An environment variable is a runtime setting read via `process.env.NAME`. Development and production environments supply different values for the same key names, allowing the code to remain identical across environments.

```javascript
// <span class="status-tag pass">[PASS]</span> Correct: dynamic runtime value
const dbUrl = process.env.DATABASE_URL;

// <span class="status-tag fail">[PROHIBITED]</span> Critical defect: hardcoded credentials
const dbUrl = 'postgres://admin:pass@...';
```

---

## G2. The `.env` File (Development Sandbox Only)

- Resides exclusively in your project root on the dev workspace: `.env`.
- Contains only sandbox development credentials.
- Must be explicitly declared in `.gitignore` to prevent commits to source control.
- `.env.example` must be kept up to date and committed with placeholder tokens:

```text
# .env.example
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://dev:CHANGEME@dev-postgres:5432/pcb_dev
SESSION_SECRET=CHANGEME
```

---

## G3. Production Ingress of Environment Values

DevOps provisions isolated configuration files directly on the host server for each container. Developers never receive or handle production credentials.

When adding a new configuration requirement:

1. Add the variable key to `.env.example` and update the codebase with boot assertions.
2. Declare the dependency in your Pull Request description: `New env var: STRIPE_KEY, required for checkout`.
3. Coordinate with DevOps to configure the production host value before merging the PR (consult [Part N: DevOps Requests](/part-n)). Merging before configuration causes container boot crashes, failed health checks, and deployment rollbacks.

### Fail Fast Assertion Pattern

Enforce strict boot validation so missing variables halt execution before requests are accepted:

```javascript
const required = ['DATABASE_URL', 'SESSION_SECRET'];
for (const name of required) {
  if (!process.env[name]) {
    console.error(`Missing env var: ${name}`);
    process.exit(1);
  }
}
```

---

## G4. Incident Protocol: Accidental Secret Exposure

If an API key, database credential, or private certificate is committed to Git:

1. **Notify DevOps immediately:** Immediate escalation is the required protocol.
2. **Secret Invalidation:** DevOps will rotate the credential at the upstream provider. Deleting or rewriting the Git commit does not neutralize the leak, as automated scrapers index commits immediately upon push.
3. **No Blame Culture:** Honest and immediate reporting prevents outages and breaches. Concealing an exposure exposes infrastructure to compromise.

GitHub repository scanning is enabled to flag exposed credential formats automatically.