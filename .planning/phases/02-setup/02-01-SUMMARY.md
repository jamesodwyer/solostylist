---
phase: 02-setup
plan: 01
subsystem: ui
tags: [shadcn, nextjs, supabase, server-actions, onboarding, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase server/client helpers, auth proxy, Next.js app shell, login action pattern

provides:
  - shadcn sheet, tabs, collapsible, badge UI components in src/components/ui/
  - TypeScript interfaces for all Phase 2 database tables (Profile, Service, ServiceCategory, Client, ClientNote, ColourFormula, Tag, ClientTag, WorkingHours, DaySchedule)
  - formatPrice and parsePriceToPennies utility helpers
  - completeOnboarding and updateProfile Server Actions
  - 3-step onboarding wizard at /onboarding (trading name, working hours, slot size)
  - Preset tag seeding (Allergy, VIP, New client, Sensitive scalp, Regular) on onboarding completion

affects: [03-services, 04-clients, 05-diary, 06-checkout, 07-cashup, settings-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Actions with zod validation returning { error } on failure or redirect on success
    - useTransition for async Server Action calls in client components with isPending state
    - Multi-step wizard accumulating form state in parent component, passing slices to child steps
    - shadcn new-york style with neutral base color

key-files:
  created:
    - src/lib/types/database.ts
    - src/lib/actions/profile.ts
    - src/components/onboarding/onboarding-wizard.tsx
    - src/components/onboarding/step-trading-name.tsx
    - src/components/onboarding/step-working-hours.tsx
    - src/components/onboarding/step-slot-size.tsx
    - src/components/ui/sheet.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/collapsible.tsx
    - src/components/ui/badge.tsx
  modified:
    - src/lib/utils.ts
    - src/app/onboarding/page.tsx

key-decisions:
  - "Onboarding page is a Server Component that checks onboarding_completed and redirects — prevents re-entry without client-side guards"
  - "completeOnboarding and updateProfile are separate exports — completeOnboarding seeds tags and sets onboarding_completed=true; updateProfile is a no-redirect reusable helper for Settings"
  - "Working hours stored as JSONB with { enabled, start, end } per day — defaults are UK salon hours (Tue-Sat 9-17, Mon/Sun off)"

patterns-established:
  - "Server Action pattern: 'use server', createClient, getUser() guard, zod safeParse, Supabase mutation, revalidatePath, redirect"
  - "Step component pattern: receives initial state + onNext callback, manages local validation, calls onNext with typed output"
  - "Wizard pattern: parent holds accumulated formData, renders current step by index, handles final submit via useTransition"

requirements-completed: [AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 23min
completed: 2026-03-01
---

# Phase 2 Plan 1: Setup Foundation + Onboarding Wizard Summary

**3-step onboarding wizard (trading name, working hours, slot size) with completeOnboarding Server Action that upserts profile, seeds 5 preset tags, and redirects to /diary**

## Performance

- **Duration:** 23 min
- **Started:** 2026-03-01T22:37:41Z
- **Completed:** 2026-03-01T23:01:14Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Installed four shadcn components (sheet, tabs, collapsible, badge) providing shared UI primitives for all Phase 2 plans
- Created src/lib/types/database.ts with complete TypeScript interfaces for all Phase 2 tables — the shared type contract all subsequent plans depend on
- Built complete 3-step onboarding wizard: trading name + phone, working hours per-day toggle with time pickers, slot size option cards
- Server Action completeOnboarding validates with zod, updates profiles, seeds preset tags idempotently, then redirects to /diary
- Onboarding page redirects already-completed users to /diary via Server Component check

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn components and create shared types + utilities** - `74cb839` (feat)
2. **Task 2: Build onboarding wizard with Server Action** - `21b2c9b` (feat)

## Files Created/Modified
- `src/lib/types/database.ts` - TypeScript interfaces for all Phase 2 database tables
- `src/lib/utils.ts` - Added formatPrice and parsePriceToPennies helpers (existing cn kept)
- `src/lib/actions/profile.ts` - completeOnboarding and updateProfile Server Actions with zod validation
- `src/app/onboarding/page.tsx` - Server Component replacing placeholder, checks onboarding_completed, renders wizard
- `src/components/onboarding/onboarding-wizard.tsx` - Multi-step wizard with progress bar and useTransition
- `src/components/onboarding/step-trading-name.tsx` - Step 1: business name + phone with local validation
- `src/components/onboarding/step-working-hours.tsx` - Step 2: per-day toggle switches + start/end time dropdowns
- `src/components/onboarding/step-slot-size.tsx` - Step 3: 15/30/45/60 option cards + Complete Setup button with spinner
- `src/components/ui/sheet.tsx` - shadcn Sheet (bottom sheets for mobile)
- `src/components/ui/tabs.tsx` - shadcn Tabs (client detail views)
- `src/components/ui/collapsible.tsx` - shadcn Collapsible (expandable sections)
- `src/components/ui/badge.tsx` - shadcn Badge (tags, deposit indicators)

## Decisions Made
- Onboarding page uses Server Component auth check — avoids flash of wizard for completed users, no client-side guard needed
- completeOnboarding and updateProfile are separate exports — completeOnboarding seeds tags and marks onboarding_completed=true, updateProfile is a reusable settings helper without those side effects
- Preset tags seeded with idempotent upsert (ignoreDuplicates: true) — safe to call multiple times without error

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 2 shared UI components and types are installed — plans 02-02 through 02-05 can import from src/lib/types/database.ts and src/components/ui/ without setup
- completeOnboarding Server Action is wired and tested via build
- updateProfile export is ready for Settings page (Phase 2 later plan)

## Self-Check: PASSED

All created files verified on disk. Task commits 74cb839 and 21b2c9b confirmed in git log.

---
*Phase: 02-setup*
*Completed: 2026-03-01*
