# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-03-01 — Roadmap created

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: -

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All monetary values as integer pennies (never floats)
- Use zod@^3 not v4 (hookform/resolvers TypeScript incompatibility active as of 2026-03)
- TIMESTAMPTZ for all appointment timestamps; named timezone Europe/London
- Middleware must call getUser() not getSession() for session refresh
- PostgreSQL exclusion constraint (btree_gist) for double-booking prevention — must be in Phase 1 migration before booking is built

### Pending Todos

None yet.

### Blockers/Concerns

- Custom SMTP must be configured before any beta testing (Supabase free plan: 30 OTP emails/hour)
- Zod v4 upgrade blocked until @hookform/resolvers publishes verified patch (GitHub issues #799, #813, #4992)
- Phase 4 cash-up UX is a custom flow with no competitor reference — may benefit from UX wireframe before implementation

## Session Continuity

Last session: 2026-03-01
Stopped at: Roadmap created — ready to plan Phase 1
Resume file: None
