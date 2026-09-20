# Part N: How to Ask DevOps for Things

Standardized ticket formats and operational escalation protocols for requesting infrastructure modifications, configuration changes, and resource allocations.

Because developers have zero direct access to production hosts, all server-side mutations are executed by DevOps. Submitting structured requests eliminates operational back-and-forth and prevents deployment blockers.

---

## N1. Canonical Request Template

When submitting requests via internal ticketing or communication channels, structure requests using this schema:

```text
Repo/app:    [target repository or service name]
What I need: [single sentence describing the exact operational requirement]
Why:         [the business feature, defect resolution, or performance objective]
Urgency:     [blocking merge of PR #XX / target date / non-critical backlog]
Details:     [variable identifiers, schema names, package names, evidence]
```

---

## N2. Structured Examples

### 1. Provisioning a New Environment Variable

```text
Repo/app:    pcb
What I need: New environment variable STRIPE_KEY configured on production container
Why:         Payment processing integration authored in PR #12 reads this value
Urgency:     Required before merge of PR #12
Details:     Schema declared in .env.example. Value transmitted via encrypted vault (not in chat or PR).
```

::: danger CREDENTIAL TRANSMISSION DIRECTIVE
Never transmit real passwords, secret keys, or authentication tokens through Slack, email, GitHub Issues, or Pull Request descriptions. Deliver secrets exclusively through internal encrypted password managers or private channels coordinated with DevOps.
:::

### 2. High-Risk Database Migration Coordination

```text
Repo/app:    lms
What I need: Dedicated database snapshot before merging PR #31
Why:         Schema migration adds a new column and backfills 2,000,000 existing records
Urgency:     Targeting merge tomorrow at 10:00 UTC
Details:     Migration script 007_add_course_slug.sql verified on seeded dev database. Execution duration ~30s.
```

### 3. System Package Installation in Dev Workspace

```text
Repo/app:    dev workspace
What I need: Install ffmpeg binary inside dev workspace environment
Why:         Required to test server-side video thumbnail generation locally
Urgency:     Non-critical / backlog
Details:     Need standard ffmpeg package from Alpine / Debian repository
```

### 4. Container Resource Expansion (Memory or CPU)

Requests for memory expansion must be accompanied by profiling evidence:

```text
Repo/app:    printing
What I need: Increase container memory ceiling from 384 MB to 512 MB
Why:         STL geometric parser peaks at 340 MB RSS during 20 concurrent sessions
Evidence:    Autocannon profiling (-c 20 -d 30) data attached; heap recovers to 120 MB post-test
What I tried: Streamed multipart upload, limited maximum file intake ceiling to 30 MB
```

### 5. Urgent Production Incident Escalation

When an active production outage occurs post-merge:

```text
URGENT:      shop.specvautomations.com returning HTTP 502 Bad Gateway
Occurred:    Since 14:32 UTC
Last merge:  PR #44 merged at 14:28 UTC by @username
Symptom:     Container failing liveliness probe; upstream edge proxy dropped active routes
```

---

## N3. Operational Expectations

- **Response SLA:** DevOps will acknowledge requests with confirmation of completion or technical clarification questions.
- **Lead Times:** Complex infrastructure operations (provisioning new database clusters, edge DNS subdomains, or external storage buckets) require planning. Submit requirements early in your feature branch cycle.
- **Architecture Reviews:** If DevOps declines a request or specifies an alternate pattern, the rejection is driven by memory constraints, security boundaries, or operational safety. Coordinate to adopt the approved design.