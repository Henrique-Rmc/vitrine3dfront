# Deploy — Production Readiness Checklist

Run this skill with `/deploy` to validate the project before shipping to production.

Execute every check below in order. Stop and report the first **blocking** failure immediately; collect all **warnings** and show them together at the end.

---

## 1. Environment Variables

Check `.env.local` and any `.env.production` file:

- `VITE_API_BASE_URL` must NOT be empty in production — an empty value causes every API call to hit the same origin with no base path, which works in dev (Vite proxy) but silently breaks in production.
  - Read `.env.local`. If `VITE_API_BASE_URL=` (empty), emit a **BLOCKING** error:
    > `VITE_API_BASE_URL` is empty. Set it to the production backend URL (e.g. `https://api.vitrine3d.com`) before deploying.
  - If a `.env.production` exists, read it and verify the variable is set there instead. If so, the `.env.local` empty value is acceptable (it is dev-only).

---

## 2. TypeScript — type check

Run:
```
npx tsc -b --noEmit
```
- Exit 0 → pass.
- Any errors → **BLOCKING**. Show the full error list and do NOT proceed to the build step.

---

## 3. ESLint

Run:
```
npm run lint
```
- Zero errors → pass.
- Errors → **BLOCKING**. Show the error list.
- Warnings only → **WARNING** (non-blocking). Note them at the end.

---

## 4. Production Build

Run:
```
npm run build
```
(`npm run build` runs `tsc -b && vite build` per package.json — TypeScript errors block it automatically.)

- Exit 0 and `dist/` directory created → pass.
- Any build failure → **BLOCKING**. Show the error output.

---

## 5. Bundle size sanity check

After a successful build, run:
```
npx vite build --mode production 2>&1 | grep -E "dist/|kB|gzip"
```
Or simply list the dist output sizes from the previous build output.

- If any single JS chunk exceeds **500 kB gzipped**, emit a **WARNING**:
  > Chunk `<name>` is `<size>` gzipped. Consider code-splitting with `React.lazy` / dynamic `import()`.

---

## 6. Hardcoded localhost / dev URLs

Search the source for development URLs that should not reach production:

```
grep -rn "localhost\|127\.0\.0\.1\|:8080\|:3000" src/
```

- Any match in a non-comment, non-test file → **WARNING**:
  > Hardcoded dev URL found at `<file>:<line>`. Ensure it is guarded by an env variable.

---

## 7. Console.log left in source

```
grep -rn "console\.log" src/
```

- Matches → **WARNING** (non-blocking). List each file and line.
- `console.error` and `console.warn` are acceptable; only flag `console.log`.

---

## 8. Uncommitted changes

Run:
```
git status --short
```
- Clean working tree → pass.
- Uncommitted changes → **WARNING**:
  > There are uncommitted changes. Commit or stash them before deploying so the deployed artifact matches the repository state.

---

## 9. Git tag / version check (optional but recommended)

Run:
```
git log --oneline -5
```
Show the last 5 commits so the user can confirm the HEAD is the intended release commit.

---

## Final Report

Print a summary table:

```
╔══════════════════════════════════════╗
║        DEPLOY READINESS REPORT       ║
╠══════════════════════════════════════╣
║ BLOCKING FAILURES                    ║
║   ✗ <item>  (if any)                ║
╠══════════════════════════════════════╣
║ WARNINGS                             ║
║   ⚠ <item>  (if any)                ║
╠══════════════════════════════════════╣
║ PASSED                               ║
║   ✓ <item>                          ║
╚══════════════════════════════════════╝
```

- If there are **blocking failures**: end with `DEPLOY BLOCKED — fix the issues above before shipping.`
- If there are only warnings: end with `DEPLOY READY (with warnings) — review warnings above.`
- If everything passed: end with `DEPLOY READY — all checks passed.`
