---
phase: 01-foundation
plan: 01
subsystem: database
tags: [nextjs, tailwind, shadcn, supabase, postgresql, rls, typescript]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with TypeScript, Tailwind v4, ESLint, App Router
  - "@supabase/ssr and @supabase/supabase-js client libraries installed"
  - "react-hook-form, zod@^3, @hookform/resolvers form validation stack"
  - "shadcn/ui initialised with cn() utility in src/lib/utils.ts"
  - "Nunito font via next/font/google with CSS variable --font-nunito"
  - "12-table database schema with RLS, btree_gist, and profile trigger"
  - "supabase/migrations/20260301000000_initial_schema.sql migration file"
affects: [02-auth, 03-core-booking, 04-payments, 05-pwa]

# Tech tracking
tech-stack:
  added:
    - "next@16.1.6"
    - "react@19.2.3"
    - "tailwindcss@^4 with @tailwindcss/postcss"
    - "@supabase/supabase-js@^2.98.0"
    - "@supabase/ssr@^0.8.0"
    - "react-hook-form"
    - "@hookform/resolvers"
    - "zod@^3 (NOT v4 — hookform/resolvers incompatibility)"
    - "shadcn/ui (clsx, tailwind-merge, tw-animate-css)"
  patterns:
    - "All monetary values as INTEGER pennies (never float/decimal)"
    - "All timestamps as TIMESTAMPTZ"
    - "RLS policies use (select auth.uid()) subquery for optimised auth"
    - "Owner-scoped RLS on all tables: only owner can access their own data"
    - "audit_log is append-only: SELECT + INSERT policies only, no UPDATE/DELETE"
    - "btree_gist exclusion constraint prevents double-booking at DB level"
    - "Profile trigger auto-creates profiles row on auth.users INSERT"

key-files:
  created:
    - src/app/layout.tsx
    - src/app/globals.css
    - src/app/page.tsx
    - src/lib/utils.ts
    - package.json
    - tsconfig.json
    - next.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
    - components.json
    - .env.local.example
    - .gitignore
    - supabase/migrations/20260301000000_initial_schema.sql
  modified: []

key-decisions:
  - "Use zod@^3 not v4 due to @hookform/resolvers TypeScript incompatibility (active as of 2026-03)"
  - "shadcn/ui initialized with defaults — uses neutral/black-white theme matching project design"
  - "globals.css retains shadcn CSS variables alongside Nunito font override"
  - "audit_log has only SELECT + INSERT policies (no UPDATE/DELETE) to enforce immutability"
  - "btree_gist exclusion constraint added in Phase 1 migration (required before booking is built)"

patterns-established:
  - "Tailwind v4: use @import 'tailwindcss' not @tailwind directives"
  - "Font setup: next/font/google variable on html element, font-[family-name:var(--font-xxx)] on body"
  - "RLS pattern: (select auth.uid()) = owner_user_id in USING and WITH CHECK"
  - "Migration naming: YYYYMMDDHHMMSS_description.sql in supabase/migrations/"

requirements-completed: [DATA-01]

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 1 Plan 01: Foundation Scaffold Summary

**Next.js 16 with Tailwind v4 and shadcn/ui scaffolded alongside a 12-table Supabase schema with RLS, btree_gist double-booking prevention, and profile auto-creation trigger**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T21:27:48Z
- **Completed:** 2026-03-01T21:32:15Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Next.js 16 project with TypeScript, Tailwind v4, ESLint, App Router running and building
- All dependencies installed: @supabase/ssr, @supabase/supabase-js, zod@^3, react-hook-form, shadcn/ui
- Complete 12-table database schema with RLS policies (46 total), btree_gist extension, exclusion constraint, and profile trigger

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with all Phase 1 dependencies** - `76578b8` (feat)
2. **Task 2: Create database migration with all 12 tables, RLS, and btree_gist** - `d9be746` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `package.json` - Next.js 16 project with all dependencies
- `tsconfig.json` - TypeScript config with @/* import alias
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss
- `eslint.config.mjs` - ESLint config
- `components.json` - shadcn/ui configuration
- `.env.local.example` - Environment variable template (all 3 Supabase vars)
- `.gitignore` - Includes .env.local, .next/, node_modules/, etc.
- `src/app/layout.tsx` - Root layout with Nunito font, SoloStylist metadata
- `src/app/globals.css` - Tailwind v4 import, Nunito theme, shadcn CSS vars, pb-safe utility
- `src/app/page.tsx` - Minimal placeholder with "SoloStylist" heading
- `src/lib/utils.ts` - shadcn cn() merge utility (clsx + tailwind-merge)
- `supabase/migrations/20260301000000_initial_schema.sql` - Complete 12-table schema, 46 RLS policies, 7 indexes, btree_gist, profile trigger

## Decisions Made

- Used zod@^3 not v4 — @hookform/resolvers has verified TypeScript incompatibility with Zod v4 as of 2026-03 (GitHub issues #799, #813, #4992)
- shadcn/ui initialized with `--defaults` flag — auto-selected neutral base color matching black/white project theme
- Retained shadcn CSS variables in globals.css alongside Nunito font override — needed for shadcn component theming
- audit_log table intentionally has only SELECT + INSERT policies — no UPDATE/DELETE to enforce immutability of audit trail
- btree_gist exclusion constraint added in Phase 1 migration as required before appointment booking is built in Phase 3

## Deviations from Plan

None - plan executed exactly as written.

Note: `create-next-app@latest` could not scaffold in a non-empty directory. Applied Rule 3 (auto-fix blocking): scaffolded to /tmp/solostylist-scaffold and moved all files to project root. All intended files were created correctly; the workaround was transparent to the final output.

## Issues Encountered

- `create-next-app@latest` refused to scaffold into the existing solostylist directory because .claude/, .planning/, README.md, and context/ were already present. Resolved by scaffolding to /tmp/solostylist-scaffold and copying all generated files to the project root. No files were lost or corrupted.

## User Setup Required

**External services require manual configuration before running the app.**

### Supabase Setup

1. **Create Supabase project** (if not already done): https://supabase.com/dashboard -> New Project

2. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   Then fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase Dashboard -> Project Settings -> API -> Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Dashboard -> Project Settings -> API -> anon/public key
   - `NEXT_PUBLIC_SITE_URL` — Set to `http://localhost:3000` for development

3. **Run the migration** in Supabase SQL Editor:
   - Paste the contents of `supabase/migrations/20260301000000_initial_schema.sql`
   - Execute it to create all 12 tables, RLS policies, and the profile trigger

4. **Dashboard configuration:**
   - Authentication -> URL Configuration -> Redirect URLs -> Add `http://localhost:3000/auth/callback`
   - Authentication -> Settings -> JWT Expiry -> Set to `2592000` (30 days / 720 hours)

## Next Phase Readiness

- Next.js project builds and runs (`npm run build` passes, `npm run dev` starts on localhost:3000)
- All Phase 2 (auth) dependencies installed: @supabase/ssr for server-side auth
- Database schema ready for auth flow: profiles table with trigger, RLS enforced
- Requires Supabase project creation and env vars before auth can be tested
- Blockers: Custom SMTP must be configured before beta testing (Supabase free plan: 30 OTP emails/hour)

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
