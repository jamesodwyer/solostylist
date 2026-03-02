---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-03-02T21:05:48Z"
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 12
  completed_plans: 11
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.
**Current focus:** Phase 3 — Booking

## Current Position

Phase: 3 of 5 (Booking)
Plan: 3 of 4 in current phase (03-03 complete)
Status: In progress
Last activity: 2026-03-02 — Plan 03-03 completed (BookingSheet, AppointmentSheet, DiaryView wiring)

Progress: [████████░░] 65%

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
- Last 5 plans: 02-01 (23 min), 02-03 (4 min), 02-02 (5 min), 02-04 (3 min), 03-01 (2 min), 03-02 (4 min), 03-03 (12 min)
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
- Working hours validation returns { error: null, warning } (soft warning, not hard error) so UI can offer override checkbox
- Rollback orphaned appointment by deleting it if appointment_services insert fails — Supabase JS client does not support DB-level transactions
- 23P01 exclusion constraint error caught explicitly in createAppointment and rescheduleAppointment for user-friendly double-booking messages
- Supabase joined row type cast (as unknown as Appointment[]) — Supabase JS infers one-to-many shape for foreign key joins; our Appointment type uses single object (many-to-one FK); minimal fix without adding generated DB types
- CSS Grid diary slot layout: SLOT_HEIGHT_PX=60, TIME_GUTTER_WIDTH=56, absolute appointment positioning using (startMinutes - dayStartMinutes) / slotMinutes * slotHeightPx
- Native date picker trigger: visually hidden input[type=date] with showPicker() called on label click — avoids custom date picker library
- notes field passed as empty string (not undefined) to createAppointment — zod z.string().optional().default('') infers string output type, not string | undefined
- Notes update in AppointmentSheet uses Supabase browser client direct update (RLS enforced) — no Server Action needed for single nullable field update
- Multi-step bottom sheet pattern: useState<'client'|'services'|'confirm'> drives conditional rendering within a single SheetContent component

### Pending Todos

None yet.

### Blockers/Concerns

- Custom SMTP must be configured before any beta testing (Supabase free plan: 30 OTP emails/hour)
- Zod v4 upgrade blocked until @hookform/resolvers publishes verified patch (GitHub issues #799, #813, #4992)
- Phase 4 cash-up UX is a custom flow with no competitor reference — may benefit from UX wireframe before implementation

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 03-03-PLAN.md (BookingSheet, AppointmentSheet, DiaryView wiring)
Resume file: .planning/phases/03-booking/03-04-PLAN.md
