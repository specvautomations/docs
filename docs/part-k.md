# Part K: Your Daily Workflow (Step by Step)

Standard engineering routine for task execution. Follow these steps in sequence for every ticket or feature.

---

## Step 1: Establish Remote Connection

1. Launch Tailscale on your local machine and verify your status is connected.
2. Open VS Code, press `F1`, select **Remote-SSH: Connect to Host**, and choose `specv-dev`.
3. Open your project workspace directory (for example `/home/node/pcb`).

---

## Step 2: Synchronize with Upstream Main

Always baseline your work on top of the latest stable production commits:

```bash
cd ~/pcb

# Verify working directory is clean
git status

# Switch to main and pull latest remote changes
git switch main
git pull

# Ensure local packages match locked dependencies
npm ci
```

---

## Step 3: Create an Isolated Feature Branch

Cut a new branch using standard naming prefixes (`feature/`, `fix/`, `chore/`):

```bash
git switch -c feature/upload-size-check
```

---

## Step 4: Develop and Execute Locally

Launch the local development runtime:

```bash
npm run dev
```

Navigate to `http://localhost:3000` via VS Code automatic port forwarding. Test your changes manually and verify boundary edge cases:
- Empty payloads and boundary values.
- Malformed inputs, negative numbers, and unexpected data types.
- Unauthenticated requests and cross-account access attempts.

---

## Step 5: Execute Pre-Commit Verification

All static analysis and test vectors must pass locally prior to creating commits:

```bash
# Verify syntax and formatting rules
npm run lint

# Execute automated test suites
npm test

# Verify production build compilation
npm run build
```

::: tip PRE-COMMIT HYGIENE
Resolve all linting errors and test failures locally. Do not rely on GitHub Actions CI to catch syntax issues or broken unit tests.
:::

---

## Step 6: Verify Production Mode Execution

Run the compiled artifact using production environment flags and memory caps:

```bash
# Boot compiled production bundle under strict heap bounds
NODE_ENV=production NODE_OPTIONS=--max-old-space-size=192 node --env-file=.env dist/index.js

# In a secondary terminal, verify the probe returns HTTP 200:
curl -i http://localhost:3000/healthz
```

This verification step surfaces issues that only appear post-build (missing compilation targets in `dist/`, broken module resolution, or incorrect file imports). If your task involves file streaming or heavy datasets, execute the load profiling sequence described in [Part I: Memory and Speed Rules](/part-i).

---

## Step 7: Author Atomic Commits

```bash
# Review modified files
git status

# Inspect changes to ensure no debug statements or secrets are staged
git diff

# Stage specific target files
git add src/upload.js test/upload.test.js

# Commit with a descriptive conventional message
git commit -m "feat: reject uploads over 50 MB"
```

::: danger PRE-COMMIT SANITIZATION
Before committing, verify that no credentials, tokens, local development paths, or debug logs are included in your staged diff.
:::

---

## Step 8: Push Branch to Remote

```bash
git push -u origin feature/upload-size-check
```

The `-u` flag configures the upstream tracking branch. For subsequent commits on the same branch, run `git push`.

---

## Step 9: Open a Pull Request

1. Navigate to the repository on GitHub. Select **Compare & pull request**.
2. Complete the standardized PR template (context, testing steps, migrations, environment variables).
3. Monitor automated CI pipeline execution:
   - <span class="status-tag pass">[PASS]</span> **Green:** All tests, linting, and build steps completed successfully. Ready for peer review.
   - <span class="status-tag fail">[FAIL]</span> **Red:** CI failure. Select **Details**, trace the error, apply the fix, and push an updated commit to the branch. The PR updates automatically.

---

## Step 10: Code Review Lifecycle

- A DevOps engineer or peer reviews the code and may request modifications.
- Address comments directly and push fixes as additional commits to the same branch.
- Avoid merging your own Pull Requests unless explicitly authorized.

---

## Step 11: Post-Merge Verification and Cleanup

1. When the PR is merged into `main`, GitHub Actions packages the Docker container and deploys it within 2 to 3 minutes.
2. Open the production service domain and verify feature functionality.
3. If an outage occurs, notify DevOps immediately with timestamps and error messages. Do not attempt hotfix commits directly to `main`. DevOps can revert the release in under one minute.
4. Clean up the merged branch locally:
   ```bash
   git switch main
   git pull
   git branch -d feature/upload-size-check
   ```

---

## Handling Upstream Divergence (Rebasing and Merging)

If upstream `main` advances while you are developing, pull changes into your branch:

```bash
git fetch origin
git merge origin/main

# If conflicts occur, open conflicting files and resolve markers (<<<<<<<, =======, >>>>>>>)
git add .
git commit
npm ci && npm test
git push
```

If merge conflicts require clarification, coordinate with the author of the conflicting commit before pushing. Never force-push (`--force`) to resolve conflicts.