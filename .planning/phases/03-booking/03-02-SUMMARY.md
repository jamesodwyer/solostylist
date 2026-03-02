---
phase: 03-booking
plan: 02
subsystem: ui
tags: [nextjs, react, css-grid, diary, appointments, server-component]

# Dependency graph
requires:
  - phase: 03-01
    provides: "Appointment types, AppointmentService types, WorkingHours types, formatTime, formatDiaryDate, formatDuration utilities, appointment Server Actions"
  - phase: 02-setup
    provides: "profiles table with working_hours JSONB and default_slot_minutes, Supabase server client"
provides:
  - "Diary page at /diary — Server Component that fetches profile and appointments for the selected date"
  - "DiaryView client component with sticky date navigation header and scrollable grid container"
  - "DiaryGrid CSS Grid slot layout with absolute-positioned appointment blocks and current time indicator"
  - "AppointmentBlock component with status colour coding and content density based on height"
  - "Date navigation: prev/next buttons, native date picker trigger, Today pill shortcut"
  - "Scroll-to-current-time on today, scroll-to-working-hours-start on other days"
  - "selectedSlotTime and selectedAppointment state in DiaryView ready for Plan 03-03 sheets"
affects: [03-03-booking-sheet, 03-04-appointment-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase joined row type cast (as unknown as Appointment[]) — Supabase JS infers many-to-one joins as arrays but our types expect single objects"
    - "Scroll-to-position via useEffect on [date] dependency — scrollContainerRef.scrollTop = targetPx - 100"
    - "CSS Grid slot layout: relative container, absolute appointment blocks, SLOT_HEIGHT_PX=60 constant"
    - "Native date picker trigger: visually hidden <input type='date'> with showPicker() called on label click"
    - "Working hours range: ±30 min padding around schedule, clamped to 06:00–22:00"

key-files:
  created:
    - src/components/diary/diary-view.tsx
    - src/components/diary/diary-grid.tsx
    - src/components/diary/appointment-block.tsx
  modified:
    - src/app/(app)/diary/page.tsx

key-decisions:
  - "Supabase joined rows cast as unknown as Appointment[] — Supabase infers one-to-many shape; our type uses single object (many-to-one FK); cast is the minimal fix without adding generated DB types"
  - "scrollContainerRef passed from DiaryView down to DiaryGrid for scroll targeting — keeps scroll logic co-located with date effect"
  - "SLOT_HEIGHT_PX=60 for comfortable touch targets; TIME_GUTTER_WIDTH=56 matching w-14 Tailwind class"

patterns-established:
  - "Diary grid pattern: relative container + absolute appointment positioning using (startMinutes - dayStartMinutes) / slotMinutes * slotHeightPx"

requirements-completed: [BOOK-01, BOOK-02]

# Metrics
duration: 4min
completed: 2026-03-02
---

# Phase 3 Plan 2: Diary UI Summary

**Diary page at /diary with CSS Grid slot layout, absolutely-positioned appointment blocks with status colour coding, date navigation via prev/next buttons and native date picker, current time red indicator line, and scroll-to-current-time on mount**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-02T20:45:21Z
- **Completed:** 2026-03-02T20:49:08Z
- **Tasks:** 2
- **Files modified:** 4 (1 modified, 3 created)

## Accomplishments
- Diary Server Component at /diary: awaits searchParams (Next.js 16), uses getUser() for security, fetches profile + appointments in parallel via Promise.all, redirects to /onboarding if no profile
- DiaryView client component: sticky date header with prev/next ChevronLeft/ChevronRight buttons (min-h-[44px] touch targets), tappable date label that triggers native date picker via showPicker(), Today pill shortcut when not on today, scrollable flex-1 grid container
- DiaryGrid: generates slot rows from working hours ±30min padding (clamped 06:00–22:00), SLOT_HEIGHT_PX=60, TIME_GUTTER_WIDTH=56, time labels on hour boundaries only, slot rows clickable (onSlotTap), day-off banner when schedule disabled, scrolls to current time on today or working hours start on other days
- AppointmentBlock: computes topPx and heightPx from starts_at/ends_at vs dayStartMinutes, minimum 24px height, content density (name only / name+service / name+service+time range), status colour coding (blue=booked, green=completed, gray=cancelled, amber=no_show), client name strikethrough for cancelled, stopPropagation on click
- Current time red indicator line with circle dot, only shown for today

## Task Commits

Each task was committed atomically:

1. **Task 1: Build diary Server Component page with data fetching and date param** - `a86967c` (feat)
2. **Task 2: Build diary view, CSS Grid, and appointment blocks** - `d5f38d8` (feat)

## Files Created/Modified
- `src/app/(app)/diary/page.tsx` — Full Server Component replacing placeholder: auth guard, parallel data fetch, date param, type cast
- `src/components/diary/diary-view.tsx` — Client component: date navigation header, scrollable container, slot/appointment state for 03-03 integration
- `src/components/diary/diary-grid.tsx` — CSS Grid layout with slot rows, appointment blocks, current time line, scroll effect
- `src/components/diary/appointment-block.tsx` — Individual appointment card with status styling and adaptive content density

## Decisions Made
- Supabase joined row type cast (`as unknown as Appointment[]`) used to bridge mismatch between Supabase's inferred array shape for joins and our single-object Appointment type — avoids importing generated Supabase DB types (added complexity) for a minimal MVP fix
- scrollContainerRef passed from DiaryView to DiaryGrid so scroll targeting can be triggered from DiaryGrid's useEffect while the actual scrollable element lives in DiaryView
- All appointments shown in the grid (including cancelled/no_show with reduced opacity) rather than filtering them out — keeps the diary informative

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type mismatch for Supabase joined rows**
- **Found during:** Task 2 build verification
- **Issue:** Supabase JS infers foreign key joins as arrays (`clients: { first_name, last_name }[]`) but our `Appointment` type declares `clients` as a single object `{ first_name: string; last_name: string | null }`. TypeScript refused to assign the result to `Appointment[]`.
- **Fix:** Added `as unknown as Appointment[]` cast after the query result. Also added all required fields (`owner_user_id`, `created_at`, `updated_at`, `id` fields for appointment_services) to the SELECT query.
- **Files modified:** `src/app/(app)/diary/page.tsx`
- **Commit:** included in Task 2 commit `d5f38d8`

## Issues Encountered

None beyond the auto-fixed TypeScript type mismatch above.

## User Setup Required

None.

## Next Phase Readiness
- DiaryGrid's `onSlotTap` and `onAppointmentTap` callbacks are wired to `selectedSlotTime` and `selectedAppointment` state in DiaryView — Plan 03-03 can import DiaryView and add BookingSheet + AppointmentDetailSheet without modifying the grid
- Appointment types and grid positioning logic are stable — Plan 03-04 appointment detail can render using the same Appointment interface

## Self-Check: PASSED

- FOUND: src/app/(app)/diary/page.tsx
- FOUND: src/components/diary/diary-view.tsx
- FOUND: src/components/diary/diary-grid.tsx
- FOUND: src/components/diary/appointment-block.tsx
- FOUND: .planning/phases/03-booking/03-02-SUMMARY.md
- FOUND: commit a86967c (feat(03-02): build diary Server Component page)
- FOUND: commit d5f38d8 (feat(03-02): build diary view, CSS Grid, and appointment blocks)

---
*Phase: 03-booking*
*Completed: 2026-03-02*
