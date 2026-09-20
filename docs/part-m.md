# Part M: When Something Goes Wrong (Diagnostic Matrix)

Procedures for diagnosing and resolving faults across connection gateways, local runtimes, CI pipelines, and production deployments.

::: tip ISOLATION PRINCIPLE
Nothing executed within an isolated feature branch or development workspace can disrupt the live production perimeter. When an error occurs, inspect the first and last lines of the terminal stack trace, then cross-reference this diagnostic matrix.
:::

---

## M1. Connection and Gateway Faults

| Symptom | Probable Root Cause | Resolution Procedure |
| :--- | :--- | :--- |
| **VS Code: `Connection timed out`** | Tailscale is disconnected or your client is not registered on the tailnet. | Verify Tailscale is active. Run `tailscale status` locally. Test reachability via `ping 100.x.y.z`. |
| **`Permission denied (publickey)` on SSH** | Public key is missing from server `authorized_keys`, or the SSH client selected an incorrect key. | Audit `IdentityFile` in `~/.ssh/config`. Ensure your public key (`.pub`) was provisioned by DevOps. |
| **`REMOTE HOST IDENTIFICATION HAS CHANGED`** | The workspace container was reprovisioned with a new host key. | Verify reprovisioning with DevOps. Clear stale keys via `ssh-keygen -R "[100.x.y.z]:2222"`. |
| **VS Code hung on `Installing server`** | Corrupted VS Code remote server agent installation. | Wait 2 minutes. Press `F1`, run `Remote-SSH: Kill VS Code Server on Host`, and reconnect. |
| **`git push` fails with `Permission denied (publickey)`** | The dev workspace internal SSH key is not authorized on GitHub. | Review Part D, Step 6. Verify `ssh -T git@github.com` succeeds from the remote workspace. |
| **`git push` rejected: `protected branch`** | Attempted direct commit push to `main`. | Commit changes to an isolated feature branch and submit a Pull Request. |
| **`git push` rejected: `non-fast-forward`** | Local branch state is behind the remote tracking branch. | Pull latest remote commits (`git pull` or `git fetch origin && git merge origin/main`), resolve conflicts, and re-push. Never force-push. |

---

## M2. Development Workspace Runtime Errors

| Symptom | Probable Root Cause | Resolution Procedure |
| :--- | :--- | :--- |
| **`EADDRINUSE: address already in use :::3000`** | An orphaned application instance is still occupying the port. | Identify process PID via `ss -tlnp \| grep 3000` and terminate it (`kill PID`), or bind to an alternate port: `PORT=3001 npm run dev`. |
| **`localhost:3000` fails to load in laptop browser** | Process crashed or VS Code port forwarding tunnel dropped. | Review terminal for fatal errors. Navigate to the VS Code **Ports** tab and manually forward port `3000`. |
| **`ECONNREFUSED 127.0.0.1:5432`** | Service is targeting PostgreSQL loopback instead of the network container. | Update `DATABASE_URL` to target `dev-postgres:5432` instead of `localhost`. |
| **`password authentication failed for user "dev"`** | Incorrect database credentials specified in `.env`. | Obtain updated sandbox credentials from DevOps. |
| **`database "pcb_dev" does not exist`** | Database has not been initialized. | Provision database via `createdb -h dev-postgres -U dev pcb_dev`. |
| **Process terminated (`Killed`) during install or build** | Out-of-memory error inside dev workspace (1.5 GB total cap). | Terminate idle processes and re-run. If issues persist, request workspace resource expansion from DevOps. |
| **`FATAL ERROR: JavaScript heap out of memory`** | V8 heap ceiling exceeded. | Analyze code for memory leaks, unbounded arrays, and missing pagination. Consult [Part I: Memory and Speed Rules](/part-i). |
| **`npm ci` fails: lock file out of sync** | `package.json` and `package-lock.json` versions diverge. | Re-generate lockfile locally (`npm install`) and commit updated `package-lock.json`. |
| **`EACCES` when installing global packages** | Global package installations are restricted. | Execute tools via `npx <package>` or save as project `devDependencies`. |

---

## M3. Continuous Integration (CI) Failure Modes

When a GitHub Actions workflow returns <span class="status-tag fail">[FAIL]</span>, select **Details** adjacent to the failed pipeline job and review the primary error message:

| Failed CI Stage | Probable Root Cause | Resolution Procedure |
| :--- | :--- | :--- |
| **`npm ci`** | Out-of-sync dependency lockfile. | Execute `npm install` locally and commit the resulting `package-lock.json`. |
| **`npm run lint`** | Code formatting violations or static analysis rules failed. | Execute `npm run lint` locally and apply automated fixes: `npm run lint -- --fix`. |
| **`npm test`** | Automated test failure or environment variable deficiency. | Execute `npm test` locally. Ensure test suites run independently of execution order and system clocks. |
| **`npm run build`** | Compilation or module resolution error. | Execute `npm run build` locally to identify broken imports or syntax errors. |
| **`npm audit`** | Dependency contains a high or critical CVE vulnerability. | Update vulnerable dependencies (`npm update <pkg>`), or escalate to DevOps for triage. |
| **Docker build** | Build target `dist/index.js` missing or Dockerfile was modified. | Verify `npm run build` generates `dist/index.js`. Do not modify template Dockerfiles without DevOps approval. |

---

## M4. Development versus Production Divergence

When a service functions inside the development workspace but fails once deployed live:

| Divergence Factor | Root Cause Detail | Resolution Procedure |
| :--- | :--- | :--- |
| **Missing Environment Variable** | New variable added to local `.env` but not configured on the production host. | Ensure variable is declared in `.env.example` and request host configuration from DevOps prior to merge. |
| **Host Loopback Binding** | Application binds listener to `127.0.0.1` instead of all interfaces. | Configure server to listen on `0.0.0.0` and read `process.env.PORT`. |
| **Filesystem Write Failure** | Process attempts file write to read-only container root (`EROFS`). | Use PostgreSQL or object storage. Write ephemeral buffers only to `/tmp`. |
| **Misplaced Dependency** | Runtime library declared in `devDependencies`. Production containers install only `dependencies`. | Move package to `dependencies` in `package.json`: `npm install --save <pkg>`. |
| **Filesystem Casing Divergence** | File imports use incorrect letter casing. Linux host filesystems are case-sensitive. | Ensure file imports exactly match disk casing (`Logo.png` versus `logo.png`). |
| **Health Check Failure** | `/healthz` takes too long to respond or requires database connectivity. | Ensure `GET /healthz` responds with `200 OK` instantly without external checks. |
| **Container Memory OOM** | Application exceeds production memory allocation under load. | Audit heap usage and stream file payloads as specified in [Part I: Memory and Speed Rules](/part-i). |
| **Database Query Timeout** | Production statement exceeds the 15-second database execution limit. | Add indexes on queried columns and optimize query plans using `EXPLAIN ANALYZE`. |
| **Timezone Inconsistency** | Production host clock operates strictly in UTC. | Store timestamps in UTC (`timestamptz`) and handle localized display formatting on the client. |
| **Hardcoded Host URLs** | Code references `localhost` or dev workspace ports in redirects or links. | Use relative URL paths or dynamic environment configuration (`BASE_URL`). |

---

## M5. Incident Protocol: Post-Merge Outage Recovery

If a production service degrades or fails following a merge into `main`:

1. **Notify DevOps Immediately:** Report target site domain, failure symptoms, and deployment timestamp.
2. **Execute Rapid Rollback:** DevOps can roll back the host container to the previous stable release tag in approximately 60 seconds.
3. **Isolate and Reproduce:** Branch from `main`, author a test reproducing the defect, and implement the fix.
4. **Author Incident Postmortem:** Document the root cause, detection failure, and automated guardrails introduced to prevent recurrence.