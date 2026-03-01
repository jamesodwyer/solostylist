# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.
**Current focus:** Phase 2 — Setup

## Current Position

Phase: 2 of 5 (Setup)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-03-01 — Plan 01-03 completed

Progress: [███░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: ~18 min (includes human-verify checkpoints)
- Total execution time: ~52 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | ~52 min | ~17 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (3 min), 01-03 (~45 min with checkpoint wait)
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

### Pending Todos

None yet.

### Blockers/Concerns

- Custom SMTP must be configured before any beta testing (Supabase free plan: 30 OTP emails/hour)
- Zod v4 upgrade blocked until @hookform/resolvers publishes verified patch (GitHub issues #799, #813, #4992)
- Phase 4 cash-up UX is a custom flow with no competitor reference — may benefit from UX wireframe before implementation

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 01-03-PLAN.md (App shell + PWA — Phase 1 complete)
Resume file: .planning/phases/02-setup/ (Phase 2 not yet planned)
