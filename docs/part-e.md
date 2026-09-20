# Part E: Git, Branches, and Pull Requests

Operational rules for version control, branch isolation, commit naming standards, and code review lifecycles.

---

## E1. Branch Topology

```
main:        A---B---C---------------+---F---> (Production: Deployed Live)
                      \             /
your branch:           D---E-------           (Sandbox: Safe to push continuously)
                            |
                     Pull Request -> Automated CI -> Peer Review -> Merge = F -> Deploy
```

---

## E2. Branch Naming Conventions

- **Scope:** One repository corresponds to one website. Work within one repository per task.
- **Base:** Cut branches exclusively from an up-to-date `main`.
- **Format:** Use lowercase letters, hyphens, and standard prefixes:

| Prefix | Scope | Example |
| :--- | :--- | :--- |
| `feature/` | New product functionality | `feature/upload-pcb-files` |
| `fix/` | Bug fixes and defects | `fix/login-redirect` |
| `chore/` | Maintenance and dependencies | `chore/update-dependencies` |
| `docs/` | Documentation additions | `docs/readme-setup` |

---

## E3. Commit Message Standards

Author commit messages so their intent is clear in future audit logs. Use the conventional commit standard: `type: what you did` in present tense.

```text
feat: add file size check to PCB upload
fix: stop login redirect loop
chore: update express to latest patch
```

**Prohibited Commit Messages:** `update`, `fix stuff`, `asdf`, `final final 2`.

---

## E4. Pull Request Standards

- **Single Objective:** One feature or fix per PR. Separate unrelated tasks into distinct pull requests.
- **Diff Constraints:** Keep reviews focused (target under 300 changed lines).
- **PR Context:** Detail the context, changes, test steps, database migrations, and new environment variables.
- **Green CI Verification:** Wait for continuous integration checks to show <span class="status-tag pass">[PASS]</span> before requesting review.
- **Review Updates:** Push additional commits to the existing branch to address review feedback. GitHub synchronizes the PR diff automatically.

### PR Description Template

```markdown
## What changed
(1-3 sentences)

## Why
(the problem or task)

## How to test
1. ...
2. ...

## Checklist
- [ ] `npm run lint`, `npm test`, `npm run build` pass
- [ ] Ran the built app locally (`node dist/index.js`) and `/healthz` returns ok
- [ ] No secrets or `.env` in the diff
- [ ] Database migration? (yes/no):
- [ ] New environment variable? (yes/no, name it):
- [ ] Needs more memory or a new package on the server? (yes/no):
```

---

## E5. What Happens After You Merge

1. DevOps reviews and merges the PR into `main`.
2. GitHub Actions compiles the production Docker image and uploads it to the container registry.
3. The production host pulls the new image and initializes the container.
4. The orchestration monitor polls `GET /healthz`. If the probe fails to answer `200 OK` within the startup threshold, the deployment aborts and rolls back to the prior stable container image automatically.
5. Verify the live domain. Report regressions to DevOps immediately with timestamps and console errors.

::: tip REVIEW INVARIANT
You cannot impact production using a feature branch. Regressions only occur if broken code is merged into `main`, which is why peer review and green CI checks are mandatory.
:::