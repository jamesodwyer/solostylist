---
phase: 06-booking-client-notes
plan: 01
subsystem: ui
tags: [react, supabase, tailwind, diary, client-notes, colour-formulas, sheets]

# Dependency graph
requires:
  - phase: 03-booking
    provides: BookingSheet and AppointmentSheet multi-step sheet components
  - phase: 04-client-management
    provides: client_notes and colour_formulas tables with RLS enforced

provides:
  - ClientNotesPreview shared read-only component (collapsible, defaults collapsed)
  - Client notes and colour formula display in BookingSheet services step
  - Client notes and colour formula display in AppointmentSheet view mode

affects:
  - diary
  - client-management

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy browser-client notes fetch in useEffect when entity ID becomes known (matches hasPayment check pattern)
    - cancelled flag pattern in BookingSheet to prevent setState after unmount
    - Collapsible section with useState + Tailwind rotate-180 chevron (no animation library)

key-files:
  created:
    - src/components/diary/client-notes-preview.tsx
  modified:
    - src/components/diary/booking-sheet.tsx
    - src/components/diary/appointment-sheet.tsx

key-decisions:
  - "ClientNotesPreview defaults to collapsed (expanded=false) — keeps sheet compact and non-blocking per requirement"
  - "Notes displayed in services step only (not confirm step) — confirm step is focused on booking details; notes most relevant when choosing services"
  - "limit(3) for general notes, limit(1) for colour formulas in preview context — prevents wall-of-text on clients with many notes"
  - "No owner_user_id filter on notes/formula queries — RLS enforces auth.uid() = owner_user_id automatically (established project pattern)"
  - "cancelled flag in BookingSheet useEffect prevents setState on unmounted component (Pitfall 3 from research)"

patterns-established:
  - "Pattern 1: Shared read-only preview component (ClientNotesPreview) — zero DB types import, self-contained inline prop types"
  - "Pattern 2: Client-state notes fetch on entity selection — fires browser client query in useEffect when relevant ID becomes known"

requirements-completed: [CLNT-08]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 6 Plan 01: Booking Client Notes Summary

**Collapsible client notes and colour formula preview surfaced inside BookingSheet (services step) and AppointmentSheet (view mode) via shared ClientNotesPreview component**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-10T22:41:24Z
- **Completed:** 2026-03-10T22:43:04Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- Created `ClientNotesPreview` shared component: collapsible section defaulting to collapsed, shows colour formula in purple highlight, general/treatment notes with line-clamp-3 truncation, and optional "View all" link to client profile
- Integrated into BookingSheet: fetches latest 3 notes + 1 colour formula on client selection with cancelled flag for cleanup, resets on client change and sheet open
- Integrated into AppointmentSheet: fetches notes on appointment open in existing useEffect, renders below appointment notes in view mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ClientNotesPreview shared component** - `59b422a` (feat)
2. **Task 2: Integrate ClientNotesPreview into BookingSheet and AppointmentSheet** - `5c29be1` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `src/components/diary/client-notes-preview.tsx` - New shared read-only collapsible notes preview component
- `src/components/diary/booking-sheet.tsx` - Added notes state, fetch useEffect, and ClientNotesPreview in services step
- `src/components/diary/appointment-sheet.tsx` - Added notes state, fetch into appointment useEffect, and ClientNotesPreview in view mode

## Decisions Made
- ClientNotesPreview defaults to collapsed — satisfies "compact and non-blocking" requirement; stylist expands on demand
- Notes displayed in services step only, not confirm step — confirm is about booking details; notes inform service selection
- Self-contained inline prop types in ClientNotesPreview — no database.ts import, component stays portable
- cancelled flag in BookingSheet useEffect only (not AppointmentSheet) — sheet stays mounted while appointment prop changes, making cancellation unnecessary

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `.next/types/validator.ts` (missing module references for removed auth routes) are unrelated to this phase and were present before execution. All new code compiles cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLNT-08 requirement complete: client notes visible during both booking and appointment view
- Phase 6 plan 01 delivered; system ready for any additional gap-closure work
- No blockers

## Self-Check: PASSED

- FOUND: src/components/diary/client-notes-preview.tsx
- FOUND: src/components/diary/booking-sheet.tsx (modified)
- FOUND: src/components/diary/appointment-sheet.tsx (modified)
- FOUND: .planning/phases/06-booking-client-notes/06-01-SUMMARY.md
- FOUND commit 59b422a: feat(06-01): create ClientNotesPreview shared component
- FOUND commit 5c29be1: feat(06-01): integrate ClientNotesPreview into BookingSheet and AppointmentSheet
