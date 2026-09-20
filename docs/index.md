---
layout: doc
---

# SpecV Automations: Developer Handbook

Internal engineering standard for website developers. You write website code, test it, and push it to GitHub. Automated pipelines and the DevOps engineer handle deployment and perimeter security.

Language: simple English. Every technical term is defined in the lexicon.

This is Document 2 of 2. (Document 1 is reserved for DevOps engineering.)

<div class="telemetry-card">
  <div class="telemetry-node">
    <span class="telemetry-key">Runtime Baseline</span>
    <span class="telemetry-val">Node.js 24 LTS</span>
  </div>
  <div class="telemetry-node">
    <span class="telemetry-key">App Listener Port</span>
    <span class="telemetry-val">0.0.0.0:3000</span>
  </div>
  <div class="telemetry-node">
    <span class="telemetry-key">Container Filesystem</span>
    <span class="telemetry-val">Read-Only Root</span>
  </div>
  <div class="telemetry-node">
    <span class="telemetry-key">Access Perimeter</span>
    <span class="telemetry-val">Tailscale Mesh</span>
  </div>
</div>

---

## Handbook Contents

| Section | Domain Scope | Focus Area |
| :--- | :--- | :--- |
| [Part A: The Big Picture](/part-a) | Architecture | Multi-site fleet topology and deployment trajectory |
| [Part B: Stack Lexicon](/part-b) | Terminology | Definitions for internal operations and tools |
| [Part C: Policy and Rules](/part-c) | Governance | Required directives and prohibited patterns |
| [Part D: Workspace Setup](/part-d) | Provisioning | SSH keygen, Tailscale, and dev databases |
| [Part E: Git & PR Lifecycle](/part-e) | Collaboration | Branch naming, commit formats, and PR rules |
| [Part F: Project Contract](/part-f) | Standardization | Baseline repository structure and bootstrap code |
| [Part G: Secrets & Variables](/part-g) | Security | Managing environment variables without leaking credentials |
| [Part H: Database Operations](/part-h) | Storage | Connection pooling, queries, and safe migrations |
| [Part I: Memory & Speed Rules](/part-i) | Performance | Container memory ceilings, streaming, and event loop limits |
| [Part J: Security Basics](/part-j) | Defensive Code | SQL injection, XSS, auth hygiene, and input validation |
| [Part K: Daily Workflow](/part-k) | Operational Loop | Step-by-step development and local verification sequence |
| [Part L: Verification & Testing](/part-l) | Quality Assurance | Test suites, manual test matrices, and health checks |
| [Part M: Diagnostic Matrix](/part-m) | Troubleshooting | Debugging connection faults, crashes, and pipeline failures |
| [Part N: DevOps Requests](/part-n) | Support Escalation | Standardized templates for infra and configuration requests |
| [Part O: Reference Cheat Sheets](/part-o) | Quick Reference | Essential commands for Git, Node.js, and PostgreSQL |