# Part O: Technical Cheat Sheets and Summary

Fast reference tables for Git commands, Node.js scripts, container diagnostics, and database operations.

---

## O1. Git Command Reference

```bash
# Inspection and State
git status                        # Check working tree state and staged diffs
git diff                          # Inspect unstaged changes
git diff --staged                 # Inspect staged changes
git log --oneline -10             # Display recent 10 commits concisely

# Branching and Synchronization
git switch main                   # Switch to the primary production branch
git pull                          # Fetch and integrate remote upstream commits
git switch -c feature/name        # Cut and switch to a new feature branch
git fetch origin && git merge origin/main # Bring latest main commits into your branch
git branch -d feature/name        # Delete local branch following merge

# Staging and Committing
git add path/to/file              # Stage specific file
git add -p                        # Interactively stage specific change chunks
git commit -m "feat: summary"     # Record commit with conventional description
git restore path/to/file          # Discard uncommitted edits to a working file
git stash                         # Temporarily shelve uncommitted working edits
git stash pop                     # Re-apply shelved edits

# Remote Transport
git push -u origin feature/name   # Publish local branch to remote repository
git push                          # Push subsequent commits to tracking branch
```

::: danger PROHIBITED GIT ACTIONS
- Never run `git push --force` on shared development or production branches.
- Never run `git reset --hard` unless you fully understand that uncommitted work will be permanently lost.
- Never run `git add .` without first inspecting `git status` to verify no secrets or `.env` files are present.
:::

---

## O2. npm and Runtime Commands

```bash
npm ci                            # Install exact locked dependency tree (required)
npm install <pkg>                 # Add dependency (updates package.json and lockfile)
npm install -D <pkg>              # Add development-only tooling dependency
npm run dev                       # Launch local server with live watch restart
npm run build                     # Compile production output into dist/
npm test                          # Run automated test suites via node --test
npm audit                         # Scan dependency tree for CVE vulnerabilities
node -v                           # Verify active Node.js engine (must be >= 24.x)
```

---

## O3. Process and Network Diagnostics

```bash
# Health Probe Verification (-i flag includes HTTP response headers)
curl -i http://localhost:3000/healthz

# JSON API Route Inspection with jq formatting
curl -s http://localhost:3000/api/items/1 | jq

# POST Mutation Test
curl -X POST http://localhost:3000/api/items \
  -H 'Content-Type: application/json' \
  -d '{"name":"test_item"}'

# Identify Process Occupying Port 3000
ss -tlnp | grep 3000

# Inspect Resident Memory Footprint of Node Processes (in KB)
ps -o rss,cmd -C node
```

---

## O4. PostgreSQL CLI Reference (Sandbox Database)

Connect to the sandboxed development cluster from your workspace terminal:

```bash
psql -h dev-postgres -U dev -d pcb_dev
```

Common internal `psql` meta-commands:

```text
\dt                               # List all tables in current schema
\d tablename                      # Describe table columns, data types, and indexes
\l                                # List all databases on server
\q                                # Exit psql prompt
EXPLAIN ANALYZE SELECT ...;       # Profile query execution plan and runtime costs
```

---

## O5. VS Code Keybindings

| Action | Shortcut (macOS) | Shortcut (Windows / Linux) |
| :--- | :--- | :--- |
| **Command Palette** | `Cmd+Shift+P` / `F1` | `Ctrl+Shift+P` / `F1` |
| **Integrated Terminal** | `Ctrl+` ` | `Ctrl+` ` |
| **Quick Open File** | `Cmd+P` | `Ctrl+P` |
| **Global File Search** | `Cmd+Shift+F` | `Ctrl+Shift+F` |
| **Ports Panel** | View > Terminal Panel > Ports | View > Terminal Panel > Ports |

---

## O6. The One-Page Engineering Summary

1. **Connection:** Activate Tailscale and connect VS Code to remote workspace `specv-dev`.
2. **Branching:** Ensure baseline is synchronized (`git switch main && git pull`), then create a focused branch for every task.
3. **Development:** Develop incrementally. Verify locally by hand, then ensure static analysis and tests pass (`npm run lint && npm test && npm run build`).
4. **Production Simulation:** Run the built artifact under production memory bounds. Verify `GET /healthz` responds with `200 OK`.
5. **Resource Boundaries:** Target sub-150 MB peak memory. Stream file uploads directly to object storage. Enforce database pagination. Avoid unbounded in-memory caches.
6. **Credential Hygiene:** Never commit secrets or `.env` files to Git. Coordinate production environment variables with DevOps ahead of merge.
7. **Database Safety:** Use `$1` parameter placeholders exclusively. Ship schema mutations as incremental, backward-compatible migrations.
8. **Pull Request Protocol:** Push commits to your branch, open a small PR, ensure continuous integration checks show <span class="status-tag pass">[PASS]</span>, and address code review feedback.
9. **Deployment:** DevOps merges authorized PRs into `main`. The automation pipeline compiles the Docker container and rolls out the release. Verify the live website.
10. **Incident Escalation:** If a defect appears on production, report it to DevOps immediately. Rapid honesty prevents extended downtime.

---

*When in doubt, always ask.*