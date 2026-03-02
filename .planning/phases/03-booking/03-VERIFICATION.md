---
phase: 03-booking
verified: 2026-03-02T21:30:00Z
status: human_needed
score: 12/12 automated must-haves verified
re_verification: false
human_verification:
  - test: "Open /diary on a mobile device and verify today's slot grid renders with the current time red line at the correct position"
    expected: "Slot-based grid with time labels every hour, red indicator line at current clock time, grid scrolled so current time is visible"
    why_human: "CSS layout, scroll position, and visual accuracy of the time indicator cannot be verified programmatically"
  - test: "Tap left/right chevrons and the date label to navigate between days"
    expected: "Prev/next buttons navigate one day; tapping the date label triggers the native date picker; selecting a date navigates to it"
    why_human: "Date picker `showPicker()` and URL-driven navigation require browser interaction"
  - test: "Tap an empty time slot, search for a client, select services, confirm, and book"
    expected: "Booking sheet opens at Step 1; client search returns results; totals update in Step 2; confirmation summary shows correct data; appointment appears in diary after booking"
    why_human: "Multi-step flow, Supabase browser client search, and diary re-render require end-to-end testing"
  - test: "Attempt to book a second appointment at the exact same time as an existing one"
    expected: "Error message: 'This time slot overlaps an existing appointment. Please choose a different time.' Sheet stays open."
    why_human: "Requires two real appointments and a live Supabase connection to trigger the exclusion constraint"
  - test: "Tap an existing appointment block and verify the detail sheet"
    expected: "Sheet slides up showing client name, status badge, time/duration, services list with prices, and notes"
    why_human: "UI layout and data display accuracy requires visual inspection"
  - test: "From the appointment detail sheet, tap Complete, then cancel another appointment"
    expected: "Complete changes the block to green; Cancel shows confirmation prompt, then greys out the block"
    why_human: "Status transitions and diary re-rendering require live state verification"
  - test: "From the appointment detail sheet, tap Reschedule and move the appointment to a different time"
    expected: "Date and time inputs appear; confirming reschedule moves the block in the diary grid"
    why_human: "Reschedule flow and grid repositioning require browser interaction"
  - test: "Book an appointment before working hours start (e.g. 7:00am when hours start at 9:00am)"
    expected: "Warning banner appears with text about being outside working hours; checking the override checkbox and re-submitting creates the appointment successfully"
    why_human: "Working hours warning flow and override checkbox require an actual out-of-hours scenario"
  - test: "Tap the floating + FAB button"
    expected: "Booking sheet opens with a pre-filled slot time matching the next rounded-up slot boundary from the current time"
    why_human: "FAB slot pre-fill and visual button position require mobile browser testing"
---

# Phase 3: Booking Verification Report

**Phase Goal:** A stylist can book any client for any service on any day from the diary
**Verified:** 2026-03-02T21:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Appointment types exported and usable by diary components | VERIFIED | `AppointmentStatus`, `Appointment`, `AppointmentService` in `src/lib/types/database.ts` lines 108-137; all diary components import from this file |
| 2 | `createAppointment` inserts appointment + appointment_services with rollback on failure | VERIFIED | `appointments.ts` lines 109-154: inserts into `appointments`, then `appointment_services`, deletes orphaned row if services insert fails |
| 3 | `createAppointment` catches 23P01 and returns user-friendly message | VERIFIED | `appointments.ts` line 123: `if (apptError.code === '23P01')` returns friendly string |
| 4 | `updateAppointmentStatus` changes status between all four values | VERIFIED | `appointments.ts` lines 157-185: updates `status` and `updated_at`, validates via zod enum |
| 5 | `rescheduleAppointment` updates times and catches 23P01 on new time | VERIFIED | `appointments.ts` lines 187-243: updates `starts_at`/`ends_at`, catches `23P01` at line 235; no booked-only filter (removed in 03-04 fix) |
| 6 | Working hours validation warns when outside hours, accepts override flag | VERIFIED | `appointments.ts` lines 37-70 (`isWithinWorkingHours`), used in both `createAppointment` (line 97) and `rescheduleAppointment` (line 212); returns `{ warning }` not hard error |
| 7 | Diary formatting utilities exported from utils.ts | VERIFIED | `src/lib/utils.ts` lines 20-45: `formatTime`, `formatDiaryDate`, `formatDuration` all exported |
| 8 | User opens app and sees today's diary in slot-based grid | VERIFIED (automated) | `diary/page.tsx` fetches profile + appointments for today; `DiaryGrid` generates slot rows; `? HUMAN` for visual correctness |
| 9 | Appointments appear as positioned blocks at correct time and height | VERIFIED (automated) | `appointment-block.tsx` computes `topPx` and `heightPx` from timestamps vs `dayStartMinutes`; `? HUMAN` for pixel accuracy |
| 10 | User can navigate to other days via date navigation | VERIFIED (automated) | `diary-view.tsx` has prev/next buttons + native date picker; `? HUMAN` for interaction |
| 11 | Booking sheet walks through client → services → confirm with notes | VERIFIED (automated) | `booking-sheet.tsx` 480 lines: three-step flow with debounced search, checkbox services, confirmation + notes; `? HUMAN` for flow |
| 12 | Appointment detail sheet: view, status change, reschedule, edit notes | VERIFIED (automated) | `appointment-sheet.tsx` 422 lines: three modes (view/reschedule/edit-notes), status buttons, working hours override; `? HUMAN` for flow |

**Score:** 12/12 automated must-haves verified (9 truths also need human visual/interaction confirmation)

---

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `src/lib/types/database.ts` | — | 138 | VERIFIED | Exports `AppointmentStatus`, `Appointment`, `AppointmentService`; all existing types preserved |
| `src/lib/actions/appointments.ts` | — | 243 | VERIFIED | Exports `createAppointment`, `updateAppointmentStatus`, `rescheduleAppointment`; `'use server'` directive present |
| `src/lib/utils.ts` | — | 46 | VERIFIED | Exports `formatTime`, `formatDiaryDate`, `formatDuration`; existing utils preserved |
| `src/app/(app)/diary/page.tsx` | 30 | 61 | VERIFIED | Server Component with auth guard, parallel data fetch, date param, DiaryView render |
| `src/components/diary/diary-view.tsx` | 60 | 166 | VERIFIED | Client Component with date nav, scrollable grid, BookingSheet and AppointmentSheet wired |
| `src/components/diary/diary-grid.tsx` | 80 | 179 | VERIFIED | CSS Grid slot layout, absolute appointment blocks, current time indicator, scroll effect |
| `src/components/diary/appointment-block.tsx` | 30 | 97 | VERIFIED | Position calculation, status colour coding, content density, freed-slot tap-through + `...` button |
| `src/components/diary/booking-sheet.tsx` | 120 | 480 | VERIFIED | 3-step booking flow, `createAppointment` wired, working hours warning + override |
| `src/components/diary/appointment-sheet.tsx` | 100 | 422 | VERIFIED | view/reschedule/edit-notes modes, `updateAppointmentStatus` + `rescheduleAppointment` wired |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `appointments.ts` | `supabase.from('appointments')` | insert with owner_user_id and 23P01 handling | WIRED | Lines 109-127: insert, `.select('id').single()`, 23P01 catch |
| `appointments.ts` | `supabase.from('appointment_services')` | batch insert of service snapshots | WIRED | Lines 130-150: `.from('appointment_services').insert(...)` with rollback on failure |
| `appointments.ts` | `supabase.from('profiles')` | fetches `working_hours` for validation | WIRED | Lines 85-94 and 200-209: `.from('profiles').select('working_hours')` |
| `diary/page.tsx` | `supabase.from('appointments')` | Server Component fetches appointments for selected day | WIRED | Lines 34-44: `.from('appointments').select(...).gte('starts_at', dayStart).lt('starts_at', dayEnd)` |
| `diary/page.tsx` | `supabase.from('profiles')` | Server Component fetches profile for slot size and working hours | WIRED | Lines 29-33: `.from('profiles').select('default_slot_minutes, working_hours, timezone')` |
| `diary-view.tsx` | `diary/page.tsx` | URL `?date=YYYY-MM-DD` triggers Server Component re-fetch | WIRED | `router.push('/diary?date=${...}')` in prev/next handlers and date picker |
| `diary-grid.tsx` | `appointment-block.tsx` | Grid renders appointment blocks at calculated CSS positions | WIRED | Line 155-163: `<AppointmentBlock ... />` with dayStartMinutes, slotMinutes, slotHeightPx |
| `booking-sheet.tsx` | `src/lib/actions/appointments.ts` | `createAppointment` called on confirm step submit | WIRED | Line 13 import, line 144 call in `handleSubmit` |
| `appointment-sheet.tsx` | `src/lib/actions/appointments.ts` | `updateAppointmentStatus` and `rescheduleAppointment` called | WIRED | Line 13 import, line 102 and 121 calls |
| `diary-view.tsx` | `booking-sheet.tsx` | `onSlotTap` opens booking sheet | WIRED | Lines 150-155: `<BookingSheet open={selectedSlotTime !== null} ...>` |
| `diary-view.tsx` | `appointment-sheet.tsx` | `onAppointmentTap` opens detail sheet | WIRED | Lines 158-163: `<AppointmentSheet open={selectedAppointment !== null} ...>` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BOOK-01 | 03-02 | User can view today's diary with slot-based schedule | SATISFIED | `DiaryGrid` generates slot rows from working hours; `diary/page.tsx` defaults to today |
| BOOK-02 | 03-02 | User can navigate to other days via date picker | SATISFIED | `DiaryView` has prev/next buttons + native `<input type="date">` with `showPicker()` |
| BOOK-03 | 03-01, 03-03 | User can create appointments by selecting client and one or more services | SATISFIED | `BookingSheet` 3-step flow; `createAppointment` Server Action with service snapshot insert |
| BOOK-04 | 03-01, 03-03 | User can add notes to appointments | SATISFIED | Notes textarea in `BookingSheet` confirm step; `editedNotes` in `AppointmentSheet` with Supabase direct update |
| BOOK-05 | 03-01, 03-03 | User can update appointment status (booked, completed, cancelled, no-show) | SATISFIED | `AppointmentSheet` status buttons wired to `updateAppointmentStatus`; all four statuses supported |
| BOOK-06 | 03-01, 03-03 | User can move or reschedule appointments | SATISFIED | `AppointmentSheet` reschedule mode with date/time inputs; `rescheduleAppointment` Server Action |
| BOOK-07 | 03-01 | System prevents double-booking (PostgreSQL exclusion constraint) | SATISFIED | 23P01 error caught in `createAppointment` and `rescheduleAppointment`; user-friendly message returned |
| BOOK-08 | 03-01, 03-03 | Appointments respect working hours with manual override option | SATISFIED | `isWithinWorkingHours` helper; soft `{ warning }` return; override checkbox in both booking and reschedule sheets |

**Note on REQUIREMENTS.md:** The traceability table still marks BOOK-03 through BOOK-08 as "Pending" and the requirement checkboxes are unchecked. This is a documentation gap only — the implementation is complete and human-verified. The `REQUIREMENTS.md` file should be updated to mark these requirements complete.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `appointment-sheet.tsx` | 82 | `if (!appointment) return null` | INFO | Safety guard for when sheet is closed; not a stub — the real implementation follows this guard |

No other anti-patterns found. All placeholder comments from Plan 03-02 were removed in Plan 03-03. No empty handlers, no `TODO` comments, no stub implementations.

---

### Commit Verification

All commits documented in SUMMARYs are present in git history:

| Commit | Description |
|--------|-------------|
| `269d5c6` | feat(03-01): add appointment types and diary formatting utilities |
| `3610193` | feat(03-01): create appointment Server Actions with working hours validation |
| `a86967c` | feat(03-02): build diary Server Component page with data fetching and date param |
| `d5f38d8` | feat(03-02): build diary view, CSS Grid, and appointment blocks |
| `02fb6b3` | feat(03-03): build multi-step booking sheet with client and service selection |
| `f0d97b8` | feat(03-03): build appointment detail sheet and wire sheets into diary view |
| `e27a536` | fix(03-04): allow rebooking cancelled/no-show slots and reschedule any status |

---

### Human Verification Required

The automated codebase checks confirm that all required code exists, is substantive, and is properly wired. The following items require a human to test on a mobile device or simulator (run `npm run dev`, open `http://localhost:3000/diary`):

**1. Diary slot grid renders correctly**
**Test:** Open /diary and verify the layout
**Expected:** Slot-based grid with hour labels on the left, current time red indicator line visible, page scrolled so current time is in view
**Why human:** CSS layout and scroll position cannot be verified programmatically

**2. Date navigation works**
**Test:** Tap the left chevron, right chevron, and the date label in the header
**Expected:** Left/right navigate one day; tapping the date opens the native date picker; selecting a date navigates to it
**Why human:** `showPicker()` and URL-driven navigation require browser interaction

**3. Create a new appointment end-to-end**
**Test:** Tap an empty time slot, search for a client by name, select one or more services, confirm the booking
**Expected:** Sheet progresses through three steps; appointment block appears in the diary at the correct position and height
**Why human:** Multi-step flow, live Supabase search, and diary re-rendering require end-to-end testing

**4. Double-booking prevention**
**Test:** Try to book a second appointment at the exact same time as an existing one
**Expected:** Error message "This time slot overlaps an existing appointment. Please choose a different time." — sheet stays open
**Why human:** Requires live Supabase exclusion constraint violation

**5. Appointment detail sheet**
**Test:** Tap an existing appointment block; verify the detail sheet content
**Expected:** Sheet shows client name, status badge, time/duration, services list with prices and total, notes section
**Why human:** Data display accuracy requires visual confirmation

**6. Status changes**
**Test:** Complete one appointment; cancel another (check confirmation prompt appears)
**Expected:** Completed block turns green; cancelled block greys out; confirmation prompt on cancel
**Why human:** UI state transitions and diary refresh require live testing

**7. Reschedule an appointment**
**Test:** Tap an appointment block, tap Reschedule, change the date and/or time, confirm
**Expected:** Appointment block moves to the new position in the diary
**Why human:** Reschedule flow and grid repositioning require browser interaction

**8. Working hours warning and override**
**Test:** Book an appointment outside working hours (e.g. 7:00am if hours start at 9:00am)
**Expected:** Yellow warning banner appears; checking the override checkbox and re-submitting creates the appointment
**Why human:** Requires an actual out-of-hours scenario and checkbox interaction

**9. Floating + FAB button**
**Test:** Tap the floating + button (bottom-right of diary)
**Expected:** Booking sheet opens with the slot time pre-filled to the next rounded-up boundary from now
**Why human:** Visual button presence and pre-fill value require mobile browser testing

---

### Documentation Gap (Non-blocking)

**REQUIREMENTS.md not updated for BOOK-03 through BOOK-08**

The `REQUIREMENTS.md` traceability table and checklist still show BOOK-03 through BOOK-08 as "Pending". All eight requirements are implemented and human-verified (03-04 checkpoint). This is a documentation-only gap and does not affect goal achievement.

**Recommended fix:** Update `.planning/REQUIREMENTS.md` to:
- Mark `[x]` for BOOK-03 through BOOK-08
- Update the traceability table status from "Pending" to "Complete (03-03)" for BOOK-03 through BOOK-08
- Update the last-updated timestamp

---

### Summary

All 12 automated must-haves are verified. Every artifact exists, is substantive (not a stub), and is wired correctly. All 8 required BOOK requirements have clear implementation evidence. Human verification (Plan 03-04 checkpoint) was already conducted and signed off. The 9 human verification items above are for completeness — confirming the UI/UX works as intended on a real mobile device.

**Phase goal: A stylist can book any client for any service on any day from the diary — ACHIEVED by the codebase.**

---

_Verified: 2026-03-02T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
