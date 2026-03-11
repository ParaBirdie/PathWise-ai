# PathWise AI — Security Review

**Date:** 2026-03-11
**Scope:** Full codebase audit (frontend React/Vite + Supabase schema)
**Reviewer:** Automated security review via Claude Code

---

## Summary

PathWise AI is a React/Vite SPA with a Supabase (PostgreSQL + RLS) backend. The attack surface is
relatively small — no file uploads, no custom API server, calculation logic runs entirely in the
browser — but several issues were found ranging from a broken security model on the database layer
to missing browser-side defences.

All findings below have been remediated in this commit unless marked **"Deployment fix required"**.

---

## Findings

### HIGH — Arbitrary School Names Accepted Without Allowlist Enforcement

**File:** `src/components/survey/Q1Schools.jsx` (original line 52–57)

`addSchool()` only checked that the value was non-empty, not already added, and under the 4-school
limit. It did **not** require the name to be in `ALL_UNIVERSITIES`. A user could type any string and
press Enter to submit it. The value was stored in Zustand state and forwarded to
`compareOffers()` and (if persistence was enabled) to `survey_sessions.schools[]` in Supabase.

Immediate consequences:
- Arbitrary strings stored in the database without sanitisation.
- If the rendering code ever uses `dangerouslySetInnerHTML` (not currently present, but possible in
  future iterations), this becomes a stored-XSS vector.
- Garbage input produces misleading NPV calculations because unknown school names silently fall back
  to the 'flagship' tier.

**Fix applied:** `addSchool()` now early-returns unless the trimmed name exists in
`ALL_UNIVERSITIES`. A `maxLength={120}` attribute was also added to the input element to set a hard
cap at the browser level.

---

### HIGH — Unrestricted `INSERT` on `survey_sessions` (Database Abuse / DoS)

**File:** `supabase/schema.sql` (original line 82–84)

```sql
-- BEFORE (insecure)
create policy "Insert survey session"
  on public.survey_sessions for insert with check (true);
```

The Supabase anon key is embedded in the production JS bundle (by design, via `VITE_SUPABASE_URL`
/ `VITE_SUPABASE_ANON_KEY`). Anyone who inspects the bundle can call the Supabase REST API
directly and insert unlimited rows — there is no authentication requirement, no rate limiting, and
no validation beyond what the column constraints enforce (previously: none).

An automated script could exhaust Supabase free-tier row quotas, inflate egress, or fill the table
with junk data that poisons any analytics built on top.

**Fix applied (schema.sql):**
1. The INSERT policy now requires `session_token = (auth.jwt() ->> 'sub')`, binding every inserted
   row to the caller's Supabase anonymous-auth identity.
2. `CHECK` constraints were added to the table itself:
   - `session_token` length 10–128 characters.
   - `schools` array cardinality 1–4.
   - `major`, `residency`, `income_bracket` capped at 100/50 characters respectively.

**Action required on the client side:** The application must call `supabase.auth.signInAnonymously()`
before inserting a session, and pass `auth.uid()` as the `session_token` value. This is not yet
implemented in the React code.

---

### HIGH — Broken Session Isolation (RLS SELECT policy always denied)

**File:** `supabase/schema.sql` (original line 86–89)

```sql
-- BEFORE (broken)
create policy "Read own survey session"
  on public.survey_sessions for select
  using (session_token = current_setting('request.jwt.claims', true)::json->>'sub');
```

Two problems:

1. **`current_setting` is unreliable.** The Supabase-recommended approach is `auth.jwt()`, not
   `current_setting('request.jwt.claims', true)`. The `true` flag makes the function return `NULL`
   (rather than raising an error) when the setting is absent, causing the expression to evaluate as
   `NULL = NULL` → `NULL`, which Postgres treats as false. In practice this means **no user can ever
   read back their own session**.

2. **`session_token` was not tied to the JWT `sub`.** The client generated an arbitrary token (or
   none at all in the current codebase — there is no `INSERT` call in the production React code),
   completely decoupled from the JWT identity. Even if the `current_setting` approach worked, the
   comparison would always fail because the token strings would never match.

**Fix applied:** The SELECT policy now uses `auth.jwt() ->> 'sub'`, and the INSERT policy enforces
the same binding, ensuring the two values are always identical.

---

### MEDIUM — `probablyInState` Heuristic Produces Wrong In-State Tuition Determinations

**File:** `src/components/survey/Q3Residency.jsx` (original line 33–35)

```js
// BEFORE (buggy)
const probablyInState = isUS && schools.some((s) =>
  s.toLowerCase().includes(location.toLowerCase().slice(0, 4))
)
```

Slicing the first 4 characters of the state name and doing a substring match produces systematic
false positives that cause materially incorrect NPV calculations:

| State selected | 4-char prefix | False match |
|---|---|---|
| Georgia | `geor` | Georgetown University (DC private) |
| Virginia | `virg` | West Virginia University (different state) |
| New Hampshire | `new ` | New York University, New Mexico schools |

A Georgia resident selecting Georgetown University would be incorrectly labelled in-state. Since
Georgetown is a private university, `estimateTuition()` ignores the `isInState` flag for elite
schools anyway, but the error propagates through the state model and would affect any future code
that branches on `isInState`.

**Fix applied:** Replaced with an explicit `STATE_SCHOOL_PREFIXES` map that lists the canonical
lowercase `startsWith` prefixes for each state's public universities. Unknown states produce no
false positives (empty prefix array → `probablyInState = false`).

---

### MEDIUM — No Content Security Policy

**File:** `index.html` (original — no CSP present)

Without a CSP, any XSS that does occur — whether from a compromised npm dependency, a future
`dangerouslySetInnerHTML` usage, or a browser extension injection — runs with full access to the
page: it can read the Supabase anon key from the JS bundle globals, exfiltrate user survey data,
and make arbitrary Supabase API calls.

**Fix applied:** A `Content-Security-Policy` meta tag was added to `index.html`:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
img-src 'self' data:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

Note: `'unsafe-inline'` in `style-src` is required because Tailwind CSS generates inline style
attributes. If the project migrates to a build-time Tailwind setup that avoids inline styles, this
can be tightened further with a nonce.

**Deployment fix also required:** CSP set via `<meta>` does not cover HTTP response headers. Your
hosting provider (Vercel / Netlify / nginx) should also set this header in the HTTP response for
defense-in-depth. A `<meta>` tag cannot enforce `frame-ancestors` in all browsers.

---

### MEDIUM — Missing HTTP Security Headers

**File:** `vite.config.js` (original — no `server.headers`)

The following headers were absent from the dev server and production deployment:

| Header | Risk |
|---|---|
| `X-Content-Type-Options: nosniff` | MIME-type confusion attacks |
| `X-Frame-Options: DENY` | Clickjacking |
| `Referrer-Policy: strict-origin-when-cross-origin` | URL leakage to third parties |
| `Permissions-Policy` | Unnecessary browser capability access |

**Fix applied:** Added `server.headers` to `vite.config.js` for the dev server, and added
corresponding `<meta>` equivalents to `index.html`.

**Deployment fix required:** These headers must also be set at the CDN / hosting layer. Add
to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options",  "value": "nosniff" },
        { "key": "X-Frame-Options",         "value": "DENY" },
        { "key": "Referrer-Policy",         "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",      "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security","value": "max-age=63072000; includeSubDomains; preload" }
      ]
    }
  ]
}
```

---

### MEDIUM — Alumni Count Input Has No Maximum Bound

**File:** `src/components/survey/Q6Alumni.jsx` (original line 50–57)

`<input type="number" min="0">` had no `max` attribute. The browser's HTML constraint only applies
to UI interaction — a user can bypass it via DevTools or by constructing a raw DOM event. The raw
string from `e.target.value` was stored directly in state without parsing or clamping.

While alumni data is not currently used in NPV calculations, it is stored via `setAlumniData()` and
could influence future scoring. An absurd value like `9999999999999` would produce `Infinity` or
NaN in floating-point arithmetic if passed to a calculation function.

**Fix applied:**
- `max="1000000"` added to the `<input>` element.
- `handleChange` now parses with `parseInt(..., 10)` and clamps to `[0, 1_000_000]` before storing.

---

### MEDIUM — Silent Failure When Environment Variables Are Missing

**File:** `src/lib/supabase.js` (original line 3–4)

```js
// BEFORE (silently broken)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'
```

If a deployment omits the environment variables, the app starts successfully but every Supabase
call fails at runtime with an opaque network error. This makes misconfiguration hard to diagnose and
could cause users to think the app is broken, or worse, silently lose submitted data.

**Fix applied:** The fallbacks were removed. The module now throws an explicit, actionable error at
import time if either variable is missing.

---

### LOW — Google Fonts Loaded Without Subresource Integrity

**File:** `index.html` (original line 10)

```html
<link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" />
```

External stylesheets loaded without an `integrity` attribute cannot be verified by the browser. If
the Google Fonts CDN were compromised or a MITM downgrade occurred (unlikely given HSTS on
googleapis.com, but theoretically possible in corporate proxy environments), malicious CSS could be
injected.

**Note:** SRI on Google Fonts is architecturally difficult because the URL is dynamic and the
response varies by user-agent. The practical risk is very low. A full mitigation would be to
self-host the Inter font (e.g., via the `fontsource` npm package).

**Not fixed in code** — trade-off between complexity and low probability risk. Flagged for awareness.

---

### LOW — Sensitive Financial Data Stored as Plaintext JSONB

**File:** `supabase/schema.sql` line 63

`result_snapshot jsonb` stores the full NPV result including income bracket, selected schools, and
40-year financial projections. Income bracket and school choice could be considered personal
financial information. There is no application-layer encryption.

Supabase provides encryption at rest for the underlying PostgreSQL storage, but this does not
protect data from a Supabase-level breach where a malicious actor has database access. Consider
encrypting `result_snapshot` with `pgcrypto` if the data sensitivity warrants it.

**Not fixed** — requires a product decision on data retention and sensitivity classification.

---

### INFORMATIONAL — Dependency `^` Semver Ranges

**File:** `package.json`

All dependencies use caret ranges (`^`). An unreviewed minor/patch update to a compromised package
(e.g., via a supply-chain attack) would be automatically pulled in on the next `npm install`.

Recommendation: pin exact versions for production, run `npm audit` in CI, and use Dependabot or
Renovate to manage controlled updates.

---

### INFORMATIONAL — `VITE_` Credentials Are Public by Design

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are statically embedded in the production JS
bundle. This is intentional for Supabase anonymous-access patterns, but it means the anon key is
fully visible to any user who inspects the source.

The entire security boundary is therefore Supabase's Row-Level Security. If RLS is misconfigured
(as it was in findings 2 and 3 above), the exposed key provides a direct path to data abuse.
Ensure RLS is correct and regularly audited.

---

## Fixes Applied in This Commit

| File | Change |
|---|---|
| `src/components/survey/Q1Schools.jsx` | Enforce `ALL_UNIVERSITIES` allowlist in `addSchool()`; add `maxLength={120}` |
| `src/components/survey/Q6Alumni.jsx` | Add `max="1000000"`, parse+clamp in `handleChange` |
| `src/components/survey/Q3Residency.jsx` | Replace 4-char substring heuristic with explicit `STATE_SCHOOL_PREFIXES` map |
| `supabase/schema.sql` | Add column `CHECK` constraints; fix INSERT/SELECT RLS policies to use `auth.jwt()` |
| `src/lib/supabase.js` | Remove placeholder fallbacks; throw on missing env vars |
| `index.html` | Add `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` meta tags |
| `vite.config.js` | Add `server.headers` with security headers for dev server |

## Actions Still Required

1. **Anonymous auth before INSERT:** Add `supabase.auth.signInAnonymously()` call in the app, and
   use `session.user.id` as the `session_token` when persisting survey sessions.
2. **Hosting-layer security headers:** Add `vercel.json` / `netlify.toml` / nginx config to set
   `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and CSP as HTTP
   response headers (meta tags are a partial mitigation only).
3. **Consider self-hosting Inter font** to eliminate the Google Fonts dependency.
4. **Run `npm audit`** and establish a process for reviewing dependency updates.
