# Part B: Words You Will Hear (Terms)

Technical definitions and operations terminology used across SpecV infrastructure.

| Word | Technical Meaning in SpecV Infrastructure |
| :--- | :--- |
| **Repository (repo)** | A project folder stored on GitHub, containing the complete history of changes. |
| **Git** | The version control tool tracking line-by-line file changes. |
| **Commit** | An immutable snapshot of changes, accompanied by a descriptive message. |
| **Branch** | An isolated copy of the code. Modifications on a branch do not touch production code. |
| **`main`** | The production branch. Whatever is merged into `main` automatically ships live. |
| **Push / Pull** | Push transmits local commits to GitHub. Pull fetches remote changes to your workspace. |
| **Pull Request (PR)** | A formal request to merge a branch into `main`. Review and automated CI occur here. |
| **Merge** | Integrating reviewed branch commits into `main`. |
| **CI** | Continuous Integration. Automated robots test your PR. A green <span class="status-tag pass">[PASS]</span> means clean; a red <span class="status-tag fail">[FAIL]</span> indicates a broken build or test. |
| **CD** | Continuous Delivery. Automated deployment pipelines that package and deploy merged code. |
| **GitHub Actions** | The automation engine that executes CI and CD workflows. |
| **Docker / Container / Image** | Standardized execution unit. The image is the immutable package; the container is the running process. |
| **Production ("prod")** | The live host and services accessed by real users. |
| **Dev / development** | Your isolated sandbox workspace. Safe for testing and breaking without consequences. |
| **Environment variable** | Configuration injected at runtime from outside the codebase (for example `DATABASE_URL` or `PORT`). |
| **Secret** | Sensitive runtime credential (database passwords, private API keys). Must never be placed in code. |
| **`.env` file** | Local plaintext file holding sandbox variables. Blocked from version control via `.gitignore`. |
| **Port** | A network communication channel. All SpecV web applications listen on internal port `3000`. |
| **Localhost** | Loopback network interface targeting the current machine (`127.0.0.1`). |
| **Health check / `/healthz`** | A zero-dependency probe returning `200 OK`. Polled by Docker every 30 seconds. |
| **Rollback** | Automated reversion to the previous stable container image when a new deploy fails health checks. |
| **Memory limit** | Kernel-level RAM ceiling assigned to a container. Crossing this causes an immediate container restart. |
| **RAM** | Random Access Memory: high-speed volatile storage. |
| **Memory leak** | Process flaw where allocated memory is not reclaimed, causing continuous consumption until crash. |
| **Heap** | The V8 memory space where Node.js stores JavaScript objects, closures, and arrays. |
| **Stream** | Reading or writing data sequentially in chunks rather than buffering everything into memory at once. |
| **Migration** | Version-controlled SQL file detailing incremental database schema changes. |
| **Rate limit** | Traffic throttle restricting client requests per unit of time to prevent abuse. |
| **Lint** | Static analysis tool that verifies syntax rules and catches standard code defects. |
| **API** | Application Programming Interface: structured HTTP endpoints returning structured JSON data. |
| **SSH** | Secure Shell: encrypted network protocol for remote terminal access via public key cryptography. |
| **Tailscale** | WireGuard mesh VPN providing access to internal development workspaces without public internet exposure. |
| **OWASP** | Open Worldwide Application Security Project: industry standard catalog of primary web vulnerabilities. |