---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [supabase, ssr, magic-link, otp, nextjs, middleware, proxy, tailwind, typescript]

# Dependency graph
requires:
  - phase: 01-01
    provides: "@supabase/ssr and @supabase/supabase-js installed, Next.js 16 App Router scaffold, profiles table with onboarding_completed column and auto-create trigger"
provides:
  - "src/lib/supabase/server.ts: async createClient() factory using createServerClient with await cookies()"
  - "src/lib/supabase/client.ts: createClient() factory using createBrowserClient"
  - "src/proxy.ts: auth guard using getUser() redirecting unauthenticated users to /login (Next.js 16 proxy convention)"
  - "src/app/(auth)/login: branded black login page with LoginForm client component and signInWithMagicLink server action"
  - "src/app/(auth)/check-email: confirmation page with mail icon, resend link, back to login"
  - "src/app/auth/callback/route.ts: magic link code exchange with new/returning user routing"
  - "src/app/onboarding/page.tsx: lightweight welcome placeholder (Phase 2 builds real flow)"
affects: [02-auth, 03-core-booking, 04-payments, 05-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase server client: async createClient() using await cookies() (Next.js 16 async API)"
    - "Supabase browser client: createClient() using createBrowserClient"
    - "Auth guard: src/proxy.ts with export function proxy() — Next.js 16 replaces middleware.ts"
    - "Auth check: supabase.auth.getUser() (never getSession() — insecure server-side)"
    - "Magic link: signInWithOtp with emailRedirectTo pointing to /auth/callback"
    - "New user detection: query profiles.onboarding_completed after exchangeCodeForSession"
    - "Route groups: (auth) group for login/check-email (no app shell), onboarding outside any group"

key-files:
  created:
    - src/lib/supabase/server.ts
    - src/lib/supabase/client.ts
    - src/proxy.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/login-form.tsx
    - src/app/(auth)/login/actions.ts
    - src/app/(auth)/check-email/page.tsx
    - src/app/auth/callback/route.ts
    - src/app/onboarding/page.tsx
  modified: []

key-decisions:
  - "Next.js 16 renamed middleware.ts to proxy.ts with export function proxy() — auto-fixed during Task 2"
  - "LoginForm is a separate client component in the (auth)/login/ directory — keeps page.tsx a Server Component"
  - "check-email resend link routes to /login (simple, allows fresh email entry) rather than calling server action directly"
  - "auth/callback queries profiles table to detect new vs returning users (profiles row auto-created by DB trigger)"

patterns-established:
  - "proxy.ts auth guard pattern: export async function proxy(request: NextRequest) with getUser() check"
  - "Server action + client form split: actions.ts (server) + login-form.tsx (client) + page.tsx (server)"
  - "Magic link redirect uses NEXT_PUBLIC_SITE_URL env var for portability across environments"

requirements-completed: [AUTH-01, DATA-04]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 02: Auth Summary

**Supabase magic link auth with branded black login UI, check-email confirmation, PKCE callback with new/returning user routing, and Next.js 16 proxy auth guard using getUser()**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T21:35:00Z
- **Completed:** 2026-03-01T21:38:11Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Full magic link auth flow: login -> send OTP -> check-email -> click link -> callback -> onboarding or diary
- Branded login page: full-bleed black background, "SoloStylist" logo, "Welcome back, gorgeous", white email input, loading spinner on submit
- Next.js 16 proxy auth guard: all routes protected, auth routes excluded, getUser() (not getSession()) for secure session validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase client factories and auth middleware** - `d65dcfd` (feat)
2. **Task 2: Build magic link login flow with branded UI** - `9fcd1e7` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/lib/supabase/server.ts` - Async createClient() factory with await cookies() for SSR
- `src/lib/supabase/client.ts` - Browser createClient() factory using createBrowserClient
- `src/proxy.ts` - Auth guard (Next.js 16 convention) — getUser() check, redirects unauthenticated users to /login
- `src/app/(auth)/login/page.tsx` - Server Component: black login page with logo and branding
- `src/app/(auth)/login/login-form.tsx` - Client Component: email input, loading state, error display
- `src/app/(auth)/login/actions.ts` - Server action: signInWithMagicLink calling signInWithOtp, redirects to /check-email
- `src/app/(auth)/check-email/page.tsx` - Confirmation page: mail icon, "Check your inbox", resend link
- `src/app/auth/callback/route.ts` - Route handler: exchangeCodeForSession + profile check + routing
- `src/app/onboarding/page.tsx` - Placeholder welcome page (Phase 2 builds real onboarding flow)

## Decisions Made

- Used a separate `login-form.tsx` client component to keep `page.tsx` as a Server Component — follows Next.js App Router best practices
- `check-email` resend link navigates back to `/login` rather than calling the server action inline — simpler UX, allows user to enter a different email if needed
- Auth callback queries `profiles.onboarding_completed` to route new vs returning users — relies on the auto-create trigger from Plan 01-01's migration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js 16 renamed middleware.ts to proxy.ts with export function proxy()**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** Build warned "The middleware file convention is deprecated. Please use proxy instead." Then build failed when proxy.ts exported `middleware` — error stated proxy.ts must export `proxy` or a default function
- **Fix:** Renamed src/middleware.ts to src/proxy.ts and changed exported function name from `middleware` to `proxy`. The `config` export with matcher remains unchanged
- **Files modified:** src/proxy.ts (renamed from src/middleware.ts)
- **Verification:** npm run build passes with no warnings; proxy listed as "Proxy (Middleware)" in route output
- **Committed in:** 9fcd1e7 (Task 2 commit, git detected as rename)

---

**Total deviations:** 1 auto-fixed (1 blocking/convention change)
**Impact on plan:** Fix essential — middleware.ts would stop working in a future Next.js 16 point release. No scope creep. All plan requirements met.

## Issues Encountered

- Next.js 16.1.6 (installed) uses `proxy.ts` with `export function proxy()` instead of `middleware.ts` with `export function middleware()`. The research was based on Next.js 15. Resolved automatically per Rule 3.

## User Setup Required

The Supabase project must be configured before the auth flow can be tested end-to-end:

1. **Environment variables** — Ensure `.env.local` contains:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g., `http://localhost:3000` for local dev)

2. **Supabase redirect URL** — Dashboard > Authentication > URL Configuration:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

3. **Custom SMTP** (before beta) — Supabase free plan sends max 2 magic link emails/hour. Configure custom SMTP (Resend, SendGrid) in Supabase Dashboard > Authentication > SMTP Settings.

## Next Phase Readiness

- Auth flow is complete and compiles cleanly
- Supabase client factories ready for use in any Server Component, Server Action, or Route Handler
- Proxy auth guard protects all non-auth routes at the edge
- Phase 3 (core booking) can import `createClient` from `@/lib/supabase/server` directly
- Blocker: Custom SMTP required before any real testing (see STATE.md blockers)

---
*Phase: 01-foundation*
*Completed: 2026-03-01*

## Self-Check: PASSED

All files verified present:
- src/lib/supabase/server.ts: FOUND
- src/lib/supabase/client.ts: FOUND
- src/proxy.ts: FOUND
- src/app/(auth)/login/page.tsx: FOUND
- src/app/(auth)/login/actions.ts: FOUND
- src/app/(auth)/login/login-form.tsx: FOUND
- src/app/(auth)/check-email/page.tsx: FOUND
- src/app/auth/callback/route.ts: FOUND
- src/app/onboarding/page.tsx: FOUND
- .planning/phases/01-foundation/01-02-SUMMARY.md: FOUND

All task commits verified:
- d65dcfd: feat(01-02): create Supabase client factories and auth middleware
- 9fcd1e7: feat(01-02): build magic link auth flow with branded UI
