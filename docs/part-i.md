# Part I: Memory and Speed Rules (Very Important)

Performance boundaries, memory cap architectures, stream pipelines, and load profiling protocols across containerized runtimes.

---

## I1. Host Resource Constraints

The production host operates under fixed resources (8 GB total memory shared across all services, databases, and system layers). Every container is assigned an explicit memory limit by the Linux kernel. 

If a process exceeds its assigned boundary, the kernel Out-Of-Memory (OOM) killer terminates the container immediately. The orchestrator cycles the container, resulting in dropped connections and cascading gateway 502 errors.

| Application Target | Container Limit | Node V8 Heap Cap (`--max-old-space-size`) |
| :--- | :--- | :--- |
| Static site (`landing`) | 32 MB | Not applicable (Static engine) |
| Standard Node application (`product`, `project`, `workshop`) | 300 MB | 192 MB |
| File processing and heavy ingestion (`pcb`, `printing`) | 384 MB | 256 to 320 MB |
| Learning management platform (`lms`) | 512 MB | 320 MB |

::: tip OPERATIONAL TARGET
A well-architected Node.js application must peak at or below 150 MB under load. DevOps configures container allocations at roughly 2x measured peak usage. If a service requires more than 300 MB, the application architecture must be optimized before requesting resource expansion.
:::

### RSS versus Heap Mechanics

- **Heap Memory:** Memory dynamically allocated for JavaScript objects, closures, and strings within V8.
- **Resident Set Size (RSS):** Total process memory footprint, including the V8 heap, runtime binary code, native extensions, and active Node.js `Buffer` allocations.
- **Enforcement Ratio:** The Linux kernel enforces limits against **RSS**. This is why the V8 heap cap is set to roughly 64% of the container allocation, reserving the remaining space for buffers and native stacks.

---

## I2. Memory Drain Patterns and Mitigations

| Anti-Pattern | Recommended Implementation |
| :--- | :--- |
| **Buffering large files in memory** (`fs.readFile`, `res.json(hugeArray)`) | Stream datasets in chunks or implement keyset pagination. |
| **In-memory multipart upload handlers** (`multer.memoryStorage()`) | Pipe streams directly to object storage (S3, Cloudflare R2), or issue presigned URLs for client-side direct uploads. |
| **Unbounded SQL queries** (`SELECT *` without `LIMIT`) | Enforce pagination limits and query only necessary columns. |
| **Unbounded global caches** (arrays or objects that grow indefinitely) | Enforce size bounds using an eviction policy (for example `lru-cache` configured with `max: 500`). |
| **Synchronous image or PDF rendering** | Process media off-thread during ingestion or offload processing to an external Redis worker queue. |
| **Oversized JSON request payloads** | Retain default `express.json({ limit: '100kb' })`. Expand the payload ceiling only on routes that explicitly require it. |
| **Uncleaned event listeners and intervals** | Remove `emitter.on()` handlers and invoke `clearInterval()` when tasks terminate. |
| **Heavy dependencies imported for minimal logic** | Audit dependency trees; use lightweight alternatives. |

::: danger THE `/tmp` STORAGE TRAP
In production containers, `/tmp` is mounted as a `tmpfs` RAM disk. Writing a 50 MB file to `/tmp` immediately consumes 50 MB of the container RAM allocation. Always stream data directly to remote object storage; do not stage heavy files in `/tmp`.
:::

---

## I3. The Streaming Paradigm

Never buffer an entire file into memory before transmission. Process data sequentially through stream pipelines:

```javascript
// <span class="status-tag fail">[PROHIBITED]</span> Buffering entire payload directly into process memory
const file = await getObjectFully(key);
res.send(file);

// <span class="status-tag pass">[PASS]</span> Sequential streaming: memory footprint remains minimal regardless of file size
import { pipeline } from 'node:stream/promises';

const obj = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
res.setHeader('Content-Type', obj.ContentType);
await pipeline(obj.Body, res);
```

### Direct-to-Storage Upload Pipeline

Stream incoming multi-part payloads directly to object storage:

```javascript
import busboy from 'busboy';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'node:crypto';

app.post('/api/upload', (req, res, next) => {
  const bb = busboy({
    headers: req.headers,
    limits: { files: 1, fileSize: 50 * 1024 * 1024 }
  });

  bb.on('file', (field, file, info) => {
    // Generate an isolated server identifier; never trust client-provided file paths
    const key = `uploads/${crypto.randomUUID()}`;

    new Upload({
      client: s3,
      params: { Bucket: process.env.BUCKET, Key: key, Body: file }
    })
      .done()
      .then(() => res.status(201).json({ key }))
      .catch(next);

    file.on('limit', () => file.destroy(new Error('file_size_exceeded')));
  });

  req.pipe(bb);
});
```

---

## I4. Application Speed Directives

1. **Protect the Single-Threaded Event Loop:** Synchronous blocking freezes request handling for all concurrent users.
   - <span class="status-tag fail">[PROHIBITED]</span> `fs.readFileSync`, `bcrypt.hashSync`, parsing massive JSON strings synchronously, or heavy iterative loops inside request cycles.
   - <span class="status-tag pass">[PASS]</span> Utilize asynchronous non-blocking equivalents, or offload CPU-bound calculations to worker threads.
2. **Enforce Outbound Request Timeouts:** Upstream APIs must not tie up application resources:
   ```javascript
   const res = await fetch('https://api.example.com/data', {
     signal: AbortSignal.timeout(5000)
   });
   ```
3. **Do Not Add Compression Middleware:** Compression (Gzip / Zstandard) is terminated at the edge by Caddy. Do not install the `compression` npm package.
4. **Leverage Cache Busting on Static Assets:** Generate version-hashed file names (`app.3f9a1c.js`). This allows Cloudflare and Caddy to cache assets for 1 year.
5. **Optimize Asset Payloads:** Serve modern image encodings (WebP, AVIF), configure lazy-loading for offscreen assets, and audit JavaScript bundles.

---

## I5. Traffic Spike Defenses

When incoming traffic surges, the application must shed load predictably rather than crashing:

- **Rate Limiting:** Drops malicious traffic bursts with `429 Too Many Requests`.
- **Database Statement Timeouts:** Abort long-running queries quickly to prevent connection pool exhaustion.
- **Connection Pool Bounds (`max: 5`):** Queues incoming database queries predictably rather than overloading the database cluster.
- **Crash Fast, Restart Clean:** If an unhandled exception corrupts process state, terminate the process. The container manager will spin up a fresh process within seconds.
- **Avoid Tight Retry Loops:** Retrying failed external network requests without backoff compounds traffic spikes.

---

## I6. Local Load and Leak Profiling

Because your dev workspace provides 1.5 GB of RAM, it will not natively trigger the 300 MB production ceiling. Simulate production heap limits locally before opening large Pull Requests:

```bash
# Terminal 1: Compile and run under production V8 heap limits
npm run build
NODE_ENV=production NODE_OPTIONS=--max-old-space-size=192 node --env-file=.env dist/index.js

# Terminal 2: Monitor RSS memory consumption (KB)
ps -o rss,cmd -C node

# Terminal 3: Execute load test against local listener
npx autocannon -c 20 -d 30 http://localhost:3000/
```

### Diagnostic Evaluation Matrix

| Load Test Observation | System Diagnostic |
| :--- | :--- |
| RSS peaks between 100 and 150 MB and settles back down | <span class="status-tag pass">[HEALTHY]</span> Normal memory reclamation. |
| RSS steadily increases and never reclaims | <span class="status-tag fail">[LEAK]</span> Memory leak present. Must be resolved before merge. |
| Process halts with `JavaScript heap out of memory` | <span class="status-tag fail">[FAIL]</span> The heap allocation boundary was breached. |
| High request failure rate or multi-second latency | <span class="status-tag fail">[FAIL]</span> Event loop blocking or database bottleneck. |

::: tip THE REPEAT LEAK TEST
Execute the load testing command 3 times sequentially. Inspect the RSS metrics between runs. Memory must stabilize at roughly the same baseline. If baseline memory increases on each test run, trace your closures, arrays, and global caches.
:::