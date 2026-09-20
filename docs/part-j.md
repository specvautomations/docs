# Part J: Security Basics

Defensive engineering practices aligned with the OWASP Top 10 to protect applications and customer data from automated exploitation.

---

## J1. SQL Injection

SQL injection occurs when user-supplied input is directly concatenated into a query string, allowing an attacker to execute arbitrary database commands.

```javascript
// <span class="status-tag fail">[PROHIBITED]</span> Vulnerable: string interpolation allows arbitrary SQL execution
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);

// <span class="status-tag pass">[PASS]</span> Secure: PostgreSQL treats parameter placeholders as isolated literals
await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

::: danger IMMUTABLE SQL RULE
User-controlled variables must never be interpolated directly into raw SQL statements. Values must always be passed as distinct parameter elements inside the query array.
:::

---

## J2. Cross-Site Scripting (XSS)

XSS occurs when untrusted input is reflected back into client HTML documents without encoding, enabling malicious JavaScript execution in user browsers.

- Modern frontend frameworks (React, Vue) escape bound template values by default.
- <span class="status-tag fail">[PROHIBITED]</span> Avoid raw HTML rendering methods (`innerHTML`, `dangerouslySetInnerHTML`, `v-html`).
- If rendering user-authored rich text is an explicit requirement, sanitize the markup server-side using a trusted sanitizer library such as `DOMPurify`.
- Application-level defense headers added by `helmet()` block inline script execution and enforce Content Security Policies (CSP).

---

## J3. Password Security and Session Controls

- **Storage Hashing:** Never store passwords in plaintext. Use slow, salted cryptographic hashing functions: **`argon2`** (strongly preferred) or **`bcrypt`**.
- **No Custom Cryptography:** Use battle-tested, peer-reviewed libraries; never implement custom authentication primitives.
- **Enumeration Defense:** Authentication failure messages must remain generic. Return `Invalid email or password`, never `User does not exist`.
- **Credential Brute-Force Throttling:** Enforce strict rate limits on authentication endpoints (for example: maximum 5 attempts per minute per IP address).
- **Cookie Security Attributes:** Session cookies must enforce isolation flags:

```javascript
cookie: {
  httpOnly: true, // Blocks client JavaScript from accessing session tokens
  secure: true,   // Requires HTTPS transmission (requires app.set('trust proxy', 1))
  sameSite: 'lax',// Mitigates cross-site request forgery
  maxAge: 1000 * 60 * 60 * 8 // 8-hour session lifetime
}
```

---

## J4. Broken Access Control (Primary Vulnerability)

Verifying that a client is logged in is insufficient; your application logic must also verify that the authenticated user owns the specific entity being requested.

```javascript
// <span class="status-tag fail">[PROHIBITED]</span> Vulnerable: any authenticated user can read another account's order
app.get('/api/orders/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  res.json(rows[0]);
});

// <span class="status-tag pass">[PASS]</span> Secure: scope queries to both entity identifier and authenticated user session
app.get('/api/orders/:id', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
    [req.params.id, req.session.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'order_not_found' });
  res.json(rows[0]);
});
```

::: tip ACCESS CONTROL RULE
Authorize permissions on the server on every endpoint. Hiding an action button in the user interface is not security.
:::

---

## J5. Input Validation

Treat all external data as untrusted: request bodies, query strings, headers, route parameters, and file metadata. Validate data structures using schema validators such as `zod`:

```javascript
import { z } from 'zod';

const OrderPayload = z.object({
  email: z.string().email().max(200),
  quantity: z.number().int().min(1).max(100)
});

app.post('/api/orders', (req, res) => {
  const result = OrderPayload.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'invalid_payload_schema' });
  }

  const { email, quantity } = result.data;
  // Proceed with validated types
});
```

---

## J6. File Upload Controls

1. Validate file size and actual byte signatures (Magic Bytes). Never trust the MIME type or extension sent by the browser.
2. Discard original client file names. Generate unique UUIDs (`crypto.randomUUID()`) to store uploaded assets.
3. Upload directly to private object storage buckets. Never store user uploads in directories served directly by the web server.
4. Never execute or evaluate uploaded files on the application host.

---

## J7. CORS and CSRF Configuration

- **Cross-Origin Resource Sharing (CORS):** Explicitly declare authorized origins. Never use wildcards (`origin: '*'`) on endpoints that process session cookies or credentials:
  ```javascript
  import cors from 'cors';
  app.use(cors({ origin: 'https://shop.specvautomations.com' }));
  ```
- **Cross-Site Request Forgery (CSRF):** Protect state-changing HTTP operations (POST, PUT, DELETE) using strict `SameSite` cookie flags and verify incoming `Origin` / `Referer` headers.

---

## J8. Supply-Chain Security (npm Packages)

1. Minimize third-party dependencies. Audit weekly downloads, maintenance cadence, and repository health before adding a library.
2. Watch for typosquatting attacks (for example `expres` instead of `express`).
3. Execute vulnerability scans before pushing:
   ```bash
   npm audit
   ```
4. Commit `package-lock.json` and install with `npm ci` to guarantee identical dependency trees.

---

## J9. Error Handling and Logging Hygiene

- **Stack Trace Exposure:** Never return database errors, query texts, or stack traces in HTTP responses. Log full errors internally and return sanitized, generic error payloads to clients.
- **PII Scrubbing:** Never log authentication tokens, raw passwords, credit card numbers, or personally identifiable information.
- **Client Secrets:** Front-end JavaScript bundles are public. Never compile private API keys, master tokens, or database credentials into client-side code.

---

## J10. Pull Request Security Checklist

Every Pull Request must verify the following items before review:

- [ ] All database queries utilize `$1, $2` parameterized placeholders.
- [ ] Endpoint authorization confirms record ownership against the session user.
- [ ] Inbound request schemas are validated using typed parsers.
- [ ] No `.env` files, passwords, or private keys are exposed in the diff.
- [ ] Logging statements exclude credentials, authorization headers, and personal data.
- [ ] File uploads validate file sizes, enforce random UUID keys, and avoid memory buffering.
- [ ] `npm audit` returns zero high or critical vulnerabilities.