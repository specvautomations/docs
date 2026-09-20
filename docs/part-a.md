# Part A: The Big Picture

## A1. What We Are Building

The company operates 7 websites. Each one lives in its **own GitHub repository** and runs in its **own container** on our server:

| Website | Address | Repository |
| :--- | :--- | :--- |
| Landing (main page) | `specvautomations.com` | `landing` |
| Product (shop) | `shop.specvautomations.com` | `product` |
| Projects | `projects.specvautomations.com` | `project` |
| Workshop | `workshop.specvautomations.com` | `workshop` |
| PCB | `pcb.specvautomations.com` | `pcb` |
| 3D printing | `3dprinting.specvautomations.com` | `printing` |
| LMS (learning / edu) | `edu.specvautomations.com` | `lms` |

---

## A2. How Your Code Travels

```
   YOUR JOB                                    ROBOTS + DEVOPS
 +----------------------------+        +------------------------------------------+
 | 1. Write code in the dev   |        | 4. GitHub Actions runs tests (CI)        |
 |    workspace (VS Code)     |        | 5. DevOps reviews your Pull Request      |
 | 2. Test it there           |  push  | 6. DevOps merges it into "main"          |
 | 3. Push to YOUR BRANCH,    +------->| 7. Robots build a Docker image           |
 |    open a Pull Request     |        | 8. Robots deploy it to the server        |
 +----------------------------+        | 9. Unhealthy? Automatic rollback         |
                                       +------------------------------------------+
```

::: tip THE CORE PRINCIPLE
You can push to your own branch as often as you like. **Nothing you push to a branch can break the live website.** Only a reviewed merge into `main` goes live.
:::

---

## A3. Who Does What

| Task | You | DevOps |
| :--- | :---: | :---: |
| Write website code | <span class="status-tag pass">[PASS]</span> | |
| Run and test the code in the dev workspace | <span class="status-tag pass">[PASS]</span> | |
| Push to a branch, open a Pull Request | <span class="status-tag pass">[PASS]</span> | |
| Fix things when tests fail | <span class="status-tag pass">[PASS]</span> | |
| Review and merge Pull Requests | | <span class="status-tag pass">[PASS]</span> |
| Server, firewall, domains, HTTPS | | <span class="status-tag pass">[PASS]</span> |
| Production database and passwords | | <span class="status-tag pass">[PASS]</span> |
| Production environment variables | | <span class="status-tag pass">[PASS]</span> (you ask) |
| Memory and CPU limits | | <span class="status-tag pass">[PASS]</span> (you tell them needs) |
| Installing new system software | | <span class="status-tag pass">[PASS]</span> (you ask) |
| Rolling back a bad release | | <span class="status-tag pass">[PASS]</span> |

You have **no access** to the production server. That is on purpose, not a lack of trust. It means nothing you do by accident can take the company offline, and nobody can blame you (or suspect you) if something breaks.

---

## A4. What You DO Have

- **A dev workspace:** a private computer on our server, made for you. It has Node.js 24, Git, npm, and a database client.
- **A dev database:** a practice database, safe to break.
- **Access to your repos on GitHub:** Write access (push to branches, open Pull Requests).