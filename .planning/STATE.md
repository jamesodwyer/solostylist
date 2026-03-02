---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-02T19:59:59.605Z"
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 8
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.
**Current focus:** Phase 2 — Setup

## Current Position

Phase: 2 of 5 (Setup)
Plan: 4 of 5 in current phase (02-02, 02-03, 02-04 complete)
Status: In progress
Last activity: 2026-03-01 — Plan 02-04 completed (client detail page)

Progress: [█████░░░░░] 48%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~20 min (includes human-verify checkpoints)
- Total execution time: ~75 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | ~52 min | ~17 min |
| 02-setup | 4 | ~35 min | ~9 min |

**Recent Trend:**
- Last 5 plans: 01-03 (~45 min with checkpoint wait), 02-01 (23 min), 02-03 (4 min), 02-02 (5 min), 02-04 (3 min)
- Trend: Auto tasks fast; human-verify checkpoints dominate wall-clock time

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All monetary values as integer pennies (never floats)
- Use zod@^3 not v4 (hookform/resolvers TypeScript incompatibility active as of 2026-03)
- TIMESTAMPTZ for all appointment timestamps; named timezone Europe/London
- Auth guard uses getUser() not getSession() — getSession() is insecure server-side (unverified cached data)
- PostgreSQL exclusion constraint (btree_gist) for double-booking prevention — must be in Phase 1 migration before booking is built
- Next.js 16 uses proxy.ts with export function proxy() — middleware.ts is deprecated (rename required for builds without warnings)
- PWA manifest route (/manifest.webmanifest) must be excluded from auth proxy matcher — without exclusion the manifest returns 302 to /login, breaking PWA installability
- Onboarding completion check lives in Server Component (not client) — prevents flash of wizard for already-completed users, no JS guard needed
- completeOnboarding and updateProfile are separate Server Action exports — completeOnboarding seeds preset tags and sets onboarding_completed=true; updateProfile is a clean reusable helper for Settings without those side effects
- Client search uses browser Supabase client with RLS — no explicit owner_user_id filter needed (auth.uid() enforced by RLS)
- zodResolver as any cast required for zod@3 + @hookform/resolvers TS incompatibility — apply to all useForm calls with zodResolver
- Colour formulas stored in separate table but merged into notes timeline; dedicated view on Colour tab for formula lookup
- createTag uses upsert (onConflict: 'owner_user_id,name') — returns existing row if name already exists, no error thrown
- addTagToClient handles Postgres unique constraint error (23505) as idempotent success

### Pending Todos

None yet.

### Blockers/Concerns

- Custom SMTP must be configured before any beta testing (Supabase free plan: 30 OTP emails/hour)
- Zod v4 upgrade blocked until @hookform/resolvers publishes verified patch (GitHub issues #799, #813, #4992)
- Phase 4 cash-up UX is a custom flow with no competitor reference — may benefit from UX wireframe before implementation

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 02-04-PLAN.md (Client detail page)
Resume file: .planning/phases/02-setup/02-05-PLAN.md
