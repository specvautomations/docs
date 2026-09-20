# Part C: The Rules (DO and DON'T)

Operational policies enforced across all SpecV repositories and execution environments.

---

## C1. DO (Mandatory Patterns)

1. <span class="status-tag pass">[REQUIRED]</span> **Work on a branch:** Every task must be developed on a distinct branch cut from an up-to-date `main`.
2. <span class="status-tag pass">[REQUIRED]</span> **Keep Pull Requests small:** Target focused PRs under 300 changed lines. Small reviews finish faster and isolate regressions.
3. <span class="status-tag pass">[REQUIRED]</span> **Execute pre-push verification:** Always run linting, test suites, and build scripts before pushing (`npm run lint`, `npm test`, `npm run build`).
4. <span class="status-tag pass">[REQUIRED]</span> **Isolate environment variance:** Read every setting that differs between dev and production (and every secret) from `process.env`.
5. <span class="status-tag pass">[REQUIRED]</span> **Maintain `.env.example`:** Keep variable keys synchronized with example values only.
6. <span class="status-tag pass">[REQUIRED]</span> **Enforce deterministic dependencies:** Always use `npm ci` and commit `package-lock.json` to lock dependency versions across machines.
7. <span class="status-tag pass">[REQUIRED]</span> **Implement the `/healthz` probe:** Expose an unauthenticated, zero-dependency health endpoint on every service.
8. <span class="status-tag pass">[REQUIRED]</span> **Emit logs to standard output:** Direct runtime logs to `stdout` and `stderr` using `console.log` or structured JSON. Never write log files to local disk.
9. <span class="status-tag pass">[REQUIRED]</span> **Use parameterized SQL:** Pass all runtime query values as parameters (`$1`, `$2`). Never concatenate strings into queries.
10. <span class="status-tag pass">[REQUIRED]</span> **Stream large payloads:** Stream file transfers directly to avoid buffering large payloads into process RAM.
11. <span class="status-tag pass">[REQUIRED]</span> **Coordinate infrastructure requirements early:** Notify DevOps ahead of time if your branch requires new environment variables, system packages, or database changes.
12. <span class="status-tag pass">[REQUIRED]</span> **Author backward-compatible migrations:** Database changes must remain compatible with the preceding release version.
13. <span class="status-tag pass">[REQUIRED]</span> **Push commits frequently:** Workspace instances are not backed up. Git remote branches serve as your offsite backup.
14. <span class="status-tag pass">[REQUIRED]</span> **Report security exposures immediately:** If an API key or password is committed, alert DevOps immediately to rotate the secret.

---

## C2. DON'T (Prohibited Actions)

1. <span class="status-tag fail">[PROHIBITED]</span> **Never commit secrets:** Never commit passwords, tokens, private keys, or `.env` files. Public and private repositories are scanned by automated crawlers.
2. <span class="status-tag fail">[PROHIBITED]</span> **Never commit directly to `main`:** All code enters `main` via reviewed Pull Requests.
3. <span class="status-tag fail">[PROHIBITED]</span> **Never force-push shared branches:** Avoid `git push --force` on shared development branches.
4. <span class="status-tag fail">[PROHIBITED]</span> **Never hardcode dynamic configuration:** Do not hardcode URLs, internal ports, or database connection strings into source files.
5. <span class="status-tag fail">[PROHIBITED]</span> **Never write files to container disks:** Production containers use read-only root filesystems. Writes outside `/tmp` will fail with kernel errors.
6. <span class="status-tag fail">[PROHIBITED]</span> **Never buffer upload payloads in RAM:** Avoid `multer.memoryStorage()` for large payloads. It leads directly to container memory limits being exceeded.
7. <span class="status-tag fail">[PROHIBITED]</span> **Never construct dynamic SQL using string interpolation:** Combining SQL fragments with user input exposes the application to SQL injection.
8. <span class="status-tag fail">[PROHIBITED]</span> **Never install unverified dependencies:** Only introduce well-maintained, necessary packages to limit supply-chain attack vectors.
9. <span class="status-tag fail">[PROHIBITED]</span> **Never expose dev instances to the public internet:** Do not bridge your dev container or share SSH credentials and Tailscale tokens.
10. <span class="status-tag fail">[PROHIBITED]</span> **Never test with real customer records:** Use synthetic mock datasets and seeding scripts inside dev environments.
11. <span class="status-tag fail">[PROHIBITED]</span> **Never request reviews on failing CI:** Fix failing test checks before requesting engineering review.
12. <span class="status-tag fail">[PROHIBITED]</span> **Never log sensitive fields:** Never emit tokens, passwords, session cookies, or personally identifiable information into logs.
13. <span class="status-tag fail">[PROHIBITED]</span> **Never commit build artifacts:** Keep `node_modules/` and `dist/` out of version control.

---

## C3. Rule Justification Matrix

| Rule | Failure Outcome |
| :--- | :--- |
| **No secrets in git** | Unauthorized database access and customer data exfiltration. |
| **Mandatory PR review** | Unchecked regressions and broken deployments reach production. |
| **Read-only container root** | Ephemeral file loss during deployment cycles; increased vulnerability to persistent rootkits. |
| **Strict memory limits** | Process crashes due to memory limits, triggering cascading gateway 502 errors. |
| **Parameterized SQL** | Arbitrary database execution and irreversible table drops. |
| **Small PR scopes** | Increased review complexity and inability to cleanly revert regressions. |