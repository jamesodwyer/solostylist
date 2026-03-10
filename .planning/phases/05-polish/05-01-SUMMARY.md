---
phase: 05-polish
plan: 01
subsystem: api
tags: [csv, export, route-handler, next-js, supabase, settings]

# Dependency graph
requires:
  - phase: 04-payments
    provides: payments table + RLS enforced owner_user_id filter pattern
  - phase: 03-booking
    provides: appointments + appointment_services tables
  - phase: 02-setup
    provides: client_notes + colour_formulas tables
provides:
  - GET /api/export/[entity] Route Handler for CSV downloads (clients, appointments, payments, notes)
  - Export Data section in Settings page with 4 download anchor links
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route Handler for file download: new Response(csv, { headers: { 'Content-Type': 'text/csv' } }) — NOT Server Actions"
    - "RFC 4180 CSV building: escape() + buildCsv() inline utility, no npm library"
    - "UTF-8 BOM prepend (\\uFEFF) for Excel Windows compatibility"
    - "Defence-in-depth: explicit .eq('owner_user_id', user.id) in all export queries even though RLS enforces it"
    - "Supabase join type cast: (a.clients as unknown) as ClientShape — Supabase JS infers array for FK joins"

key-files:
  created:
    - src/app/api/export/[entity]/route.ts
  modified:
    - src/app/(app)/settings/page.tsx

key-decisions:
  - "Inline buildCsv utility (not npm csv-stringify) — 4 fixed schemas don't need a library; 30 lines total"
  - "Merge colour_formulas into notes export with note_type='colour_formula' — single download simpler for user"
  - "Anchor <a> tags (not buttons) in Settings — browser handles Content-Disposition download natively in Server Components"
  - "CRLF line endings (\\r\\n) in CSV — Excel-friendly per RFC 4180"

patterns-established:
  - "Route Handler auth pattern: createClient() + getUser() + NextResponse.redirect for 401"
  - "Export filename pattern: solostylist-{entity}-{YYYY-MM-DD}.csv"

requirements-completed: [DATA-02]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 5 Plan 01: CSV Data Export Summary

**RFC 4180 CSV export Route Handler at /api/export/[entity] serving 4 entity types, with Export Data section added to Settings page**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T20:38:11Z
- **Completed:** 2026-03-10T20:41:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- GET /api/export/[entity] Route Handler with auth guard, 4 entity types, and 404 for unknown entities
- Inline buildCsv utility with RFC 4180 escaping and UTF-8 BOM for Excel Windows compatibility
- Appointments export flattens client_name and pipe-separated service names from join tables
- Payments export converts integer pennies to amount_gbp decimal string
- Notes export merges client_notes and colour_formulas sorted by created_at
- All queries include explicit owner_user_id filter as defence-in-depth alongside RLS
- Export Data card in Settings page with 4 anchor links matching existing card styling, 44px tap targets, dividers between rows, pb-24 bottom clearance

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CSV export Route Handler** - `682ac0a` (feat)
2. **Task 2: Add Export Data section to Settings page** - `1dd59a0` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/app/api/export/[entity]/route.ts` - Dynamic Route Handler for CSV downloads across 4 entity types
- `src/app/(app)/settings/page.tsx` - Export Data card added below Manage card with 4 download links

## Decisions Made
- Inline buildCsv utility (not npm csv-stringify) — 4 fixed schemas don't need a library; 30 lines total
- Merge colour_formulas into notes export with note_type='colour_formula' — single download simpler for user
- Anchor `<a>` tags (not buttons) in Settings — browser handles Content-Disposition download natively in Server Components
- CRLF line endings (`\r\n`) in CSV — Excel-friendly per RFC 4180

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Supabase join TypeScript type error for appointments clients relation**
- **Found during:** Task 1 (Create CSV export Route Handler)
- **Issue:** Supabase JS infers `clients` as array type from FK join, but cast to `{ first_name: string; last_name?: string | null }` caused TS error "Conversion of type '{ first_name: any; last_name: any; }[]' to type ... may be a mistake"
- **Fix:** Used `(a.clients as unknown) as ClientShape | null` — matches established project pattern for Supabase join casts
- **Files modified:** src/app/api/export/[entity]/route.ts
- **Verification:** `npx next build` compiles successfully
- **Committed in:** 682ac0a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Necessary TypeScript fix for Supabase join type inference. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in booking-sheet.tsx (`notes: notes || undefined`) was already fixed in the working tree but appeared in build cache. Cleared `.next` cache with `rm -rf .next` to get a clean build. Not related to this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- CSV export is ready for manual browser verification: navigate to /settings, click each export link, verify download in Excel
- All 4 entity types exported with correct column headers
- Payments in GBP (not pennies), appointments include service names, notes include colour formulas
- Phase 05-02 (audit log completeness for DATA-03) can proceed independently

## Self-Check: PASSED

- FOUND: src/app/api/export/[entity]/route.ts
- FOUND: src/app/(app)/settings/page.tsx
- FOUND: .planning/phases/05-polish/05-01-SUMMARY.md
- FOUND commit: 682ac0a (Task 1 - feat(05-01): create CSV export Route Handler)
- FOUND commit: 1dd59a0 (Task 2 - feat(05-01): add Export Data section to Settings page)

---
*Phase: 05-polish*
*Completed: 2026-03-10*
