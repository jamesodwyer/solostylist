---
phase: 03-booking
plan: 01
subsystem: api
tags: [typescript, supabase, zod, server-actions, appointments, diary]

# Dependency graph
requires:
  - phase: 02-setup
    provides: "profiles table with working_hours JSONB, clients table, services table, Supabase client createClient()"
  - phase: 01-foundation
    provides: "Initial schema migration with appointments and appointment_services tables including exclusion constraint"
provides:
  - "Appointment, AppointmentService, AppointmentStatus TypeScript interfaces in database.ts"
  - "createAppointment Server Action with double-booking prevention and working hours validation"
  - "updateAppointmentStatus Server Action for status transitions"
  - "rescheduleAppointment Server Action with overlap detection"
  - "formatTime, formatDiaryDate, formatDuration diary formatting utilities"
affects: [03-02-diary-ui, 03-03-booking-form, 03-04-appointment-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Warning vs error return type for working hours soft validation (override_working_hours flag)"
    - "Manual rollback pattern for appointment_services: delete orphaned appointment on service insert failure"
    - "23P01 exclusion constraint error code caught at application layer for user-friendly messaging"

key-files:
  created:
    - src/lib/actions/appointments.ts
  modified:
    - src/lib/types/database.ts
    - src/lib/utils.ts

key-decisions:
  - "Working hours validation returns { error: null, warning } (not a hard error) so UI can show warning and offer override"
  - "Rollback orphaned appointment by deleting it if appointment_services insert fails — no DB transactions available via Supabase client"
  - "23P01 PostgreSQL exclusion constraint error caught explicitly for both create and reschedule actions"

patterns-established:
  - "Soft validation pattern: return { error: null, warning } to distinguish advisory warnings from hard failures"
  - "Appointment mutation pattern: getUser() → safeParse → working hours check → insert → revalidatePath('/diary')"

requirements-completed: [BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 3 Plan 1: Appointment Data Layer Summary

**Appointment TypeScript types, three Server Actions (create/status/reschedule) with double-booking prevention via Postgres exclusion constraint (23P01), working hours soft validation with override flag, and diary formatting utilities (formatTime, formatDiaryDate, formatDuration)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T20:41:16Z
- **Completed:** 2026-03-02T20:42:47Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Appointment, AppointmentService, and AppointmentStatus types added to database.ts matching SQL schema exactly
- Three Server Actions in appointments.ts following established project patterns (getUser, zod v3, revalidatePath)
- Double-booking prevention handled at both DB level (exclusion constraint) and application level (23P01 error catch)
- Working hours validation returns soft warning with override support — UI can prompt user to confirm out-of-hours booking
- Manual rollback deletes orphaned appointment row if appointment_services batch insert fails
- formatTime, formatDiaryDate, formatDuration utilities added to utils.ts for diary rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Add appointment types and diary formatting utilities** - `269d5c6` (feat)
2. **Task 2: Create appointment Server Actions with working hours validation** - `3610193` (feat)

## Files Created/Modified
- `src/lib/types/database.ts` - Added AppointmentStatus, Appointment, AppointmentService interfaces
- `src/lib/utils.ts` - Added formatTime, formatDiaryDate, formatDuration utilities
- `src/lib/actions/appointments.ts` - New file: createAppointment, updateAppointmentStatus, rescheduleAppointment Server Actions

## Decisions Made
- Working hours validation returns `{ error: null, warning: string }` (not a hard error) — the diary form will display the warning and offer an "Override" checkbox that re-submits with `override_working_hours: true`
- Rollback on appointment_services failure: delete the orphaned appointment row manually — Supabase JS client does not support DB-level transactions
- 23P01 exclusion constraint error caught explicitly in both createAppointment and rescheduleAppointment for clear user messaging

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All data contracts and mutation logic are in place for diary UI (03-02) and booking form (03-03)
- Diary components can import Appointment types directly from database.ts
- Server Actions are ready to be called from diary components with no additional wiring needed

---
*Phase: 03-booking*
*Completed: 2026-03-02*
