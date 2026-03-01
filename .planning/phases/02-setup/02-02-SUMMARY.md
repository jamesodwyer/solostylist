---
phase: 02-setup
plan: 02
subsystem: services
tags: [nextjs, supabase, server-actions, react-hook-form, shadcn, swipe-gesture, typescript]

# Dependency graph
requires:
  - phase: 02-setup
    plan: 01
    provides: shadcn sheet/collapsible/badge, TypeScript interfaces, formatPrice/parsePriceToPennies utils

provides:
  - createService, updateService, toggleServiceActive, createCategory Server Actions
  - Settings hub page at /settings (business profile display + navigation)
  - Services catalogue page at /settings/services (Server Component with Supabase fetch)
  - ServicesList component with category grouping, collapsible sections, Hidden section
  - ServiceSheet bottom sheet form for add/edit (react-hook-form + zod, all fields incl. deposit)
  - ServiceRow component with native swipe-to-deactivate gesture

affects: [03-booking, settings-page, services-catalogue]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Native touch event swipe gesture using refs (no external library) — horizontal threshold 80px triggers action
    - zodResolver as any cast to work around zod@3 + @hookform/resolvers v5 TS incompatibility
    - Server Component fetches + passes to Client Component for interactive list
    - useTransition for non-blocking Server Action calls (toggleServiceActive, form submit)

key-files:
  created:
    - src/lib/actions/services.ts
    - src/app/(app)/settings/services/page.tsx
    - src/components/services/services-list.tsx
    - src/components/services/service-sheet.tsx
    - src/components/services/service-row.tsx
  modified:
    - src/app/(app)/settings/page.tsx

key-decisions:
  - "zodResolver cast to any for zod@3 + @hookform/resolvers v5 — known TS incompatibility documented in STATE.md, runtime behaviour correct"
  - "Swipe gesture uses refs not state for drag tracking — avoids re-renders during touch drag, smoother UX"
  - "ServiceSheet duplicates serviceSchema locally as formSchema (price as string) — Server Action receives pennies int, form handles display conversion"

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 2 Plan 2: Services Catalogue Summary

**Services catalogue with Server Actions (createService/updateService/toggleServiceActive/createCategory), category-grouped list with collapsible sections, native swipe-to-deactivate gesture, and bottom sheet form with deposit configuration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T22:44:31Z
- **Completed:** 2026-03-01T22:49:54Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created `src/lib/actions/services.ts` with four Server Actions: createService, updateService, toggleServiceActive, createCategory — all with zod validation and owner_user_id guard on mutations
- Replaced Settings placeholder with a hub page showing live business profile data (trading name, phone, working hours summary, slot size) fetched from Supabase, plus a link card to Services
- Created `/settings/services` Server Component page that fetches services (with category join) and categories from Supabase and renders ServicesList
- Built ServicesList with category-grouped collapsible sections (defaultOpen), uncategorised services at top, Hidden section at bottom (collapsed by default), empty state, and Add Service button
- Built ServiceRow with native touch event swipe gesture — uses refs for drag state to avoid re-renders, 80px threshold, reveals red Hide/green Show label behind row, opacity-50 for inactive services
- Built ServiceSheet bottom sheet form with react-hook-form + zod covering all fields (name, duration, price, category with inline create-new, deposit type/value/required) — price stored as pennies, displayed as £X.XX

## Task Commits

Each task was committed atomically:

1. **Task 1: Service Server Actions + Settings hub + services page** - `e3e3102` (feat)
2. **Task 2: ServiceRow with swipe gesture** - `af295e2` (feat)

Note: ServicesList and ServiceSheet were committed as part of `ecdb595` (02-03 pre-execution that created stubs and then filled them in as an auto-fix of a blocking build error).

## Files Created/Modified

- `src/lib/actions/services.ts` — createService, updateService, toggleServiceActive, createCategory with zod validation
- `src/app/(app)/settings/page.tsx` — Settings hub showing business profile and Services navigation link
- `src/app/(app)/settings/services/page.tsx` — Server Component fetching services + categories, renders ServicesList
- `src/components/services/services-list.tsx` — Category-grouped list, Collapsible sections, empty state, ServiceSheet controller
- `src/components/services/service-sheet.tsx` — Bottom sheet form (react-hook-form + zod) for add/edit with deposit config
- `src/components/services/service-row.tsx` — Individual row with native swipe gesture, deposit badge, price/duration display

## Decisions Made

- zodResolver cast to `any` to work around known zod@3 + @hookform/resolvers v5 TypeScript incompatibility (documented in STATE.md) — runtime behaviour unaffected
- Native touch events with refs for swipe gesture — avoids external gesture library, refs prevent re-renders during drag for smooth experience
- ServiceSheet uses separate `formSchema` with price as string display field, converts to/from pennies on submit — keeps Server Action interface clean (int pennies only)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing TypeScript error in client-sheet.tsx blocking build**
- **Found during:** Build verification after Task 2
- **Issue:** `handleSubmit(onSubmit)` type error — `@hookform/resolvers` v5 + zod@3 incompatibility causing `SubmitHandler` type mismatch on `onSubmit` function signature
- **Fix:** Changed `onSubmit(values: ClientFormValues)` to `onSubmit(values: any)` with internal cast
- **Files modified:** `src/components/clients/client-sheet.tsx`
- **Note:** Same fix applied proactively to `service-sheet.tsx` to prevent identical error

**2. [Context] services-list.tsx and service-sheet.tsx pre-committed in 02-03 run**
- These files were committed as part of `ecdb595` (02-03 execution that ran ahead) as an auto-fix of a blocking build error where the stub ServicesList import was breaking the build
- The full implementations written in this plan were already committed in that commit; only `service-row.tsx` required a fresh commit in this plan

## Issues Encountered

None that were not auto-resolved.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Services catalogue is complete — Phase 3 booking can reference `services` table and present service selection from the same data
- createCategory action is available for any future plan needing inline category creation
- toggleServiceActive allows easy service management without deletion

## Self-Check: PASSED

All created files verified on disk. Task commits e3e3102 and af295e2 confirmed in git log. Build passes with /settings and /settings/services as dynamic server-rendered routes.

---
*Phase: 02-setup*
*Completed: 2026-03-01*
