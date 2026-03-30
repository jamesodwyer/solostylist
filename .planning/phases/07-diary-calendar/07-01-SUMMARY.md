---
phase: 07-diary-calendar
plan: 01
subsystem: testing
tags: [jest, ts-jest, react-native, supabase, typescript, diary, calendar]

requires: []
provides:
  - "Jest test infrastructure configured for React Native (ts-jest, node environment, native module mocks)"
  - "timeGrid.ts: pure utility functions for diary grid layout (parseHHMM, generateSlots, appointmentBlockLayout, currentTimeTop, autoScrollTarget)"
  - "appointments.ts: Supabase actions for appointment CRUD (getAppointmentsForRange, getAppointmentsForMonth, createAppointment, updateAppointmentStatus, rescheduleAppointment, isWithinWorkingHours)"
  - "services.ts: enhanced with getServicesByCategory, CreateServiceInput, ServiceUpdateFields"
  - "AppointmentBlock.tsx: themed React Native component with status-based colour coding"
  - "Jest mocks for expo-secure-store, react-native, supabase"
affects:
  - 07-02-diary-week-view
  - 07-03-appointment-detail-sheet
  - 07-04-new-booking-flow

tech-stack:
  added:
    - react-native-calendars@1.1314.0
    - "@gorhom/bottom-sheet@5.2.8"
    - jest@29.7.0
    - ts-jest@29.4.6
    - "@testing-library/react-native@13.3.3"
    - "@types/jest@30.0.0"
  patterns:
    - "Pure utility functions in src/lib/utils/ tested with Jest in node environment"
    - "Supabase actions follow clients.ts pattern: import supabase, getUser() for auth, throw Error on failure"
    - "Jest mocks in src/__mocks__/ for native-incompatible modules (expo-secure-store, react-native, supabase)"
    - "testEnvironment: node (pure functions only) — no React component rendering in tests"

key-files:
  created:
    - native/jest.config.js
    - native/src/lib/utils/timeGrid.ts
    - native/src/lib/utils/__tests__/timeGrid.test.ts
    - native/src/lib/actions/appointments.ts
    - native/src/lib/actions/__tests__/appointments.test.ts
    - native/src/lib/actions/__tests__/services.test.ts
    - native/src/components/diary/AppointmentBlock.tsx
    - native/src/__mocks__/expo-secure-store.ts
    - native/src/__mocks__/react-native.ts
    - "native/src/__mocks__/@/lib/supabase.ts"
  modified:
    - native/package.json
    - native/src/lib/actions/services.ts

key-decisions:
  - "Used testEnvironment: node (not jsdom/react-native) — all tested code is pure functions; avoids React Native test renderer complexity"
  - "Mocked supabase client at @/lib/supabase path level so tests importing actions don't need Supabase running"
  - "isWithinWorkingHours exported as standalone function for UI pre-validation (not just internal use)"
  - "services.ts enhanced rather than replaced — existing getServices/updateService/deleteService/createService kept; added getServicesByCategory and plan types"
  - "AppointmentBlock uses useTheme() for all colours — dark mode automatic via theme system"

patterns-established:
  - "Jest mock path: src/__mocks__/@/lib/supabase.ts maps to @/lib/supabase import alias"
  - "Time grid constants (SLOT_HEIGHT_DP=60, TIME_GUTTER_DP=56) centralised in timeGrid.ts"
  - "Appointment block height minimum 28dp enforced in appointmentBlockLayout"

requirements-completed:
  - DIARY-09
  - DIARY-11
  - DIARY-12
  - DIARY-14
  - DIARY-15

duration: 6min
completed: 2026-03-29
---

# Phase 07 Plan 01: Data Foundation and Test Infrastructure Summary

**Jest test suite, time grid pure utilities (5 functions), appointment/service Supabase actions (11 functions), and AppointmentBlock component with 4 status colour variants — all TypeScript clean with 19 passing tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-29T20:51:57Z
- **Completed:** 2026-03-29T20:57:31Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Jest configured for React Native (ts-jest, node env, @/* path alias) with 19 passing tests
- timeGrid.ts delivers 5 pure functions + 2 constants used by all downstream diary views
- appointments.ts ports web server actions to native: createAppointment with 23P01 handling and rollback, isWithinWorkingHours standalone for pre-validation, reschedule with working hours soft warnings
- AppointmentBlock renders 4 status variants (blue/green/grey/amber) with conditional content per block height, strikethrough on cancelled, dark mode via useTheme()

## Task Commits

1. **Task 1: Install deps, set up Jest, time grid utilities** - `98ab4d8` (feat)
2. **Task 2: Appointment and service Supabase actions** - `f52b8bb` (feat)
3. **Task 3: AppointmentBlock component** - `1e8570d` (feat)

## Files Created/Modified
- `native/jest.config.js` - ts-jest preset, node env, @/* mapper, native module mocks
- `native/package.json` - added test script, react-native-calendars, @gorhom/bottom-sheet, jest devDeps
- `native/src/lib/utils/timeGrid.ts` - SLOT_HEIGHT_DP, TIME_GUTTER_DP, parseHHMM, generateSlots, appointmentBlockLayout, currentTimeTop, autoScrollTarget
- `native/src/lib/utils/__tests__/timeGrid.test.ts` - 12 tests covering all 5 functions
- `native/src/lib/actions/appointments.ts` - getAppointmentsForRange, getAppointmentsForMonth, createAppointment, updateAppointmentStatus, rescheduleAppointment, isWithinWorkingHours
- `native/src/lib/actions/__tests__/appointments.test.ts` - 4 isWithinWorkingHours tests
- `native/src/lib/actions/services.ts` - added getServicesByCategory, CreateServiceInput, ServiceUpdateFields
- `native/src/lib/actions/__tests__/services.test.ts` - 3 service grouping tests
- `native/src/components/diary/AppointmentBlock.tsx` - React Native port of appointment-block.tsx
- `native/src/__mocks__/expo-secure-store.ts` - Jest mock for expo-secure-store
- `native/src/__mocks__/react-native.ts` - Jest mock for react-native (Platform)
- `native/src/__mocks__/@/lib/supabase.ts` - Jest mock for Supabase client

## Decisions Made
- Used `testEnvironment: node` — all tested logic is pure functions or standalone exports; avoids React Native renderer complexity
- Mocked supabase at the `@/lib/supabase` import alias path so all action imports work without native dependencies
- Exported `isWithinWorkingHours` as a standalone public function — UI booking flow can call it for pre-validation before hitting the server
- Enhanced existing `services.ts` rather than replacing — preserves existing `getService`, `getServiceCountActive`, `getOrCreateCategory` functions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Jest mocks for native modules**
- **Found during:** Task 2 (appointments tests)
- **Issue:** `expo-secure-store` uses ESM `import` statements that fail in Jest's Node environment; `supabase.ts` imports it transitively
- **Fix:** Created `src/__mocks__/` directory with mocks for expo-secure-store, react-native (Platform), and the supabase client; added moduleNameMapper entries in jest.config.js
- **Files modified:** jest.config.js, src/__mocks__/expo-secure-store.ts, src/__mocks__/react-native.ts, src/__mocks__/@/lib/supabase.ts
- **Verification:** All 19 tests pass after adding mocks
- **Committed in:** f52b8bb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test infrastructure to work with React Native native modules. No scope creep.

## Issues Encountered
- `expo-secure-store` ESM syntax incompatible with Jest's CommonJS transform — resolved by mocking at the moduleNameMapper level (standard Jest pattern for React Native)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All diary data utilities and actions verified and ready
- AppointmentBlock component is the core rendering primitive for the week view
- Plan 07-02 (week view), 07-03 (appointment detail sheet), 07-04 (booking flow) can all import from this foundation
- No blockers

---
*Phase: 07-diary-calendar*
*Completed: 2026-03-29*
