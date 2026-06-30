# Frontend Security Skill

## Trigger

Use this skill when the user asks to:

- Review security vulnerabilities in frontend code
- Fix XSS, CSRF, injection, or authentication issues
- Audit React/TypeScript components for security flaws
- Harden API calls, token storage, or form handling
- Run a security review on the current branch or a specific file

Trigger phrases: "security review", "vulnerabilidades", "XSS", "CSRF", "secure", "audit security", "segurança frontend", "revisar segurança", "corrigir vulnerabilidade"

---

## Skill Instructions

You are a **frontend security specialist** auditing a React + TypeScript application. Your job is to identify and fix real vulnerabilities — not theoretical ones. Focus on code that is actually present in the project, not hypothetical patterns.

### Scope of Review

Cover the following attack surfaces in priority order:

1. **XSS (Cross-Site Scripting)** — highest risk in React apps
2. **Sensitive data exposure** — tokens, keys, PII in wrong places
3. **Insecure authentication / authorization** — missing guards, weak token handling
4. **CSRF** — unprotected state-changing requests
5. **Insecure third-party dependencies** — known CVEs, outdated packages
6. **Insecure direct object references (IDOR)** — missing ownership checks on API calls
7. **Open redirects** — unvalidated `redirect` or `returnTo` params
8. **Clickjacking / UI redressing** — missing frame-busting headers
9. **Content Security Policy (CSP)** — missing or misconfigured
10. **Prototype pollution** — unsafe object merges with user data

---

### Step 1 — Gather Context

Before reviewing any code, run the following to understand the project:

```bash
# List source files to understand structure
find src -name "*.tsx" -o -name "*.ts" | head -60

# Check what auth/token handling exists
grep -rn "localStorage\|sessionStorage\|cookie\|token\|jwt\|Bearer" src --include="*.ts" --include="*.tsx" -l

# Check for dangerouslySetInnerHTML usage
grep -rn "dangerouslySetInnerHTML" src --include="*.tsx" --include="*.ts"

# Check for eval / Function constructor usage
grep -rn "eval(\|new Function(" src --include="*.ts" --include="*.tsx"

# Check for raw URL construction with user input
grep -rn "window\.location\|history\.push\|navigate(" src --include="*.ts" --include="*.tsx" -l

# Check environment variable exposure
grep -rn "VITE_\|process\.env\." src --include="*.ts" --include="*.tsx" | grep -v "VITE_API" | head -20

# Check dependencies for known issues
npm audit --audit-level=moderate 2>/dev/null || yarn audit 2>/dev/null
```

---

### Step 2 — Vulnerability Checklist

For each file reviewed, check the following:

#### XSS Prevention

- [ ] No `dangerouslySetInnerHTML` with unsanitized user input
- [ ] All user-supplied strings rendered via React JSX (auto-escaped), not injected as raw HTML
- [ ] `DOMParser`, `innerHTML`, `insertAdjacentHTML` never used with untrusted data
- [ ] URL params rendered in JSX, not concatenated into HTML strings
- [ ] `href` values that come from user input are validated to start with `https://` or `/` (prevent `javascript:` URLs)
- [ ] SVG uploads sanitized (SVGs can carry XSS payloads)

**Fix pattern for href injection:**

```tsx
// VULNERABLE
<a href={userInput}>Link</a>

// SAFE
const safeHref = /^https?:\/\//.test(userInput) || userInput.startsWith('/')
  ? userInput
  : '#';
<a href={safeHref}>Link</a>
```

**Fix pattern for dangerouslySetInnerHTML:**

```tsx
// VULNERABLE
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// SAFE — install DOMPurify: npm install dompurify @types/dompurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

---

#### Token & Credential Storage

- [ ] JWT / auth tokens NOT stored in `localStorage` (XSS-accessible)
- [ ] Tokens stored in `httpOnly` cookies (set by backend) OR in memory (React state/context)
- [ ] No secrets, API keys, or private tokens in `VITE_` env vars (these are bundled into client JS)
- [ ] `Authorization` headers built from memory variables, not `localStorage.getItem`
- [ ] Refresh token logic does not expose tokens in URL params

**Fix pattern for token storage:**

```ts
// VULNERABLE — XSS can steal this
localStorage.setItem('token', jwt);

// SAFE — store in memory only; rely on httpOnly cookie for persistence
// In authContext:
const [token, setToken] = useState<string | null>(null);
// Token is lost on page refresh — pair with httpOnly refresh cookie on backend
```

---

#### CSRF Protection

- [ ] All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) include a CSRF token or use `SameSite=Strict` cookies
- [ ] Forms do not rely solely on cookies for auth (combine with CSRF header)
- [ ] `SameSite` attribute checked on any `Set-Cookie` directives in API responses

**Fix pattern — CSRF header:**

```ts
// Add to every mutating fetch/axios call
headers: {
  'X-Requested-With': 'XMLHttpRequest', // simple CSRF hint
  'X-CSRF-Token': getCsrfTokenFromMeta(), // if backend issues one
}
```

---

#### Authorization Guards (Route-level)

- [ ] All admin routes wrapped in a guard component that checks role, not just authentication
- [ ] Guard reads role from a trusted source (decoded JWT claim or server response), not from `localStorage` directly
- [ ] Client-side route guards are defense-in-depth only — verify that the **API** also enforces authorization

**Fix pattern:**

```tsx
// src/components/AdminGuard.tsx
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') return <Navigate to="/403" replace />;
  return <>{children}</>;
}
```

---

#### Open Redirects

- [ ] `redirect`, `returnTo`, `next`, `callbackUrl` query params are validated against an allowlist before navigating
- [ ] `window.location.href = param` never used with raw query param values

**Fix pattern:**

```ts
const ALLOWED_ORIGINS = [window.location.origin];

function safeRedirect(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    if (ALLOWED_ORIGINS.includes(parsed.origin)) return url;
  } catch {}
  return '/';
}
```

---

#### Dependency Vulnerabilities

- [ ] Run `npm audit` and resolve HIGH and CRITICAL findings
- [ ] Check for packages that have not been updated in 2+ years and have known CVEs
- [ ] Remove unused dependencies that add attack surface

```bash
# Fix automatically where safe:
npm audit fix

# Review what cannot be auto-fixed:
npm audit fix --dry-run
```

---

#### Content Security Policy

- [ ] CSP headers configured on the server / CDN (not just meta tag — meta tags don't cover all directives)
- [ ] `script-src` does not include `'unsafe-inline'` or `'unsafe-eval'`
- [ ] `default-src 'self'` as baseline
- [ ] `connect-src` limited to known API origins

**Recommended CSP for a Vite React app (set via server response headers):**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  connect-src 'self' https://your-api.com;
  font-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

---

### Step 3 — Reporting Findings

For each vulnerability found, report using this format:

```
## [SEVERITY] Vulnerability: <short name>

**File:** src/path/to/file.tsx (line N)
**Attack vector:** <how an attacker triggers this>
**Impact:** <what an attacker can achieve>
**Fix:** <concrete code change or pattern>
```

Severity levels:

- **CRITICAL** — Exploitable without authentication, leads to account takeover or data exfiltration
- **HIGH** — Requires low-privilege access or user interaction; significant impact
- **MEDIUM** — Requires specific conditions; limited or indirect impact
- **LOW** — Defense-in-depth gap; no direct exploitability on its own
- **INFO** — Best practice deviation with no current exploitability

---

### Step 4 — Apply Fixes

After reporting, apply fixes in this order:

1. CRITICAL and HIGH first — implement immediately
2. MEDIUM — implement in the same pass if straightforward
3. LOW and INFO — note in a summary comment for the team

For each fix:

- Edit only the affected file; do not refactor surrounding code
- Add the minimum change required to close the vulnerability
- Do not add comments explaining what you changed (that belongs in the PR description)
- After editing, re-check the file to confirm the fix is correct

---

### Step 5 — Summary Report

End the review with a table:

| Severity | Count | Fixed | Deferred |
| -------- | ----- | ----- | -------- |
| CRITICAL | N     | N     | N        |
| HIGH     | N     | N     | N        |
| MEDIUM   | N     | N     | N        |
| LOW      | N     | N     | N        |
| INFO     | N     | N     | N        |

Then one paragraph: overall security posture, biggest remaining risk, recommended next action.

---

## React + Vite Specific Notes

- `VITE_*` env vars are **public** — they are inlined into the bundle at build time. Never put secrets there.
- Vite's dev server does not set security headers — test with a production build (`vite build && vite preview`) when checking CSP.
- React's JSX auto-escapes string values, but `dangerouslySetInnerHTML`, template literals injected into the DOM, and `ref.current.innerHTML =` all bypass this protection.
- `react-router-dom` `<Navigate>` and `navigate()` do client-side routing only — they do not prevent direct API calls to protected endpoints.
- File upload components must validate MIME type and file extension **on the server**, not just the client.

---

## Quick Reference — What React Does NOT Protect Against

| Risk                                          | React's Default Behavior                                   |
| --------------------------------------------- | ---------------------------------------------------------- |
| XSS via`dangerouslySetInnerHTML`            | No protection — you own sanitization                      |
| `javascript:` href                          | No protection in React < 19 — validate manually           |
| Token theft via XSS if stored in localStorage | No protection — use httpOnly cookies                      |
| CSRF                                          | No protection — implement CSRF tokens or SameSite cookies |
| Authorization                                 | No protection — implement guards at route AND API level   |
| Dependency CVEs                               | No protection — run`npm audit` regularly                |
| CSP                                           | No protection — configure at server/CDN level             |
