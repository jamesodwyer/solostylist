---
phase: 02-setup
plan: 03
subsystem: clients
tags: [nextjs, supabase, react-hook-form, zod, server-actions, typescript]

# Dependency graph
requires:
  - phase: 02-setup
    plan: 01
    provides: shadcn sheet/badge components, Client TypeScript interface, Supabase helpers

provides:
  - createClient and updateClient Server Actions in src/lib/actions/clients.ts
  - /clients page: Server Component with alphabetical client list and tag joins
  - ClientSearch: debounced ilike search on first_name, last_name, phone
  - ClientList: A-Z section headers, flat search results, + button
  - ClientRow: initials circle, name, phone, tag chips with deterministic colours
  - ClientSheet: add-client bottom sheet with all fields and marketing consent toggle

affects: [04-client-detail, booking-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Supabase browser client ilike search with 250ms debounce for fast partial-match search
    - zodResolver as any cast workaround for zod@3 + @hookform/resolvers TypeScript incompatibility
    - router.refresh() after Server Action mutation to re-fetch server-rendered client list

key-files:
  created:
    - src/lib/actions/clients.ts
    - src/components/clients/client-list.tsx
    - src/components/clients/client-search.tsx
    - src/components/clients/client-sheet.tsx
    - src/components/clients/client-row.tsx
  modified:
    - src/app/(app)/clients/page.tsx
    - src/components/services/service-sheet.tsx
    - src/components/services/services-list.tsx

key-decisions:
  - "Search uses browser Supabase client with RLS (no explicit owner_user_id filter needed — auth.uid() enforced by RLS policies)"
  - "zodResolver cast as any — known zod@3/@hookform/resolvers incompatibility; safe because runtime validation is correct"
  - "router.refresh() after createClient closes sheet and re-fetches the alphabetical server-rendered list rather than manually patching client-side state"

# Metrics
duration: 4min
completed: 2026-03-01
---

# Phase 2 Plan 3: Client List Page Summary

**Alphabetical client list with sticky A-Z headers, 250ms debounced ilike search on name and phone, and add-client bottom sheet with all fields (name, phone, email, address, marketing consent toggle)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-01T23:04:33Z
- **Completed:** 2026-03-01T23:08:33Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created `createClient` and `updateClient` Server Actions with zod validation, getUser() auth guard, and revalidatePath
- Built `/clients` page as Server Component that fetches initial client list with client_tags + tags join, ordered alphabetically
- ClientSearch component: sticky top-0, 250ms debounced queries via Supabase browser client using `.or('first_name.ilike.%...%,last_name.ilike.%...%,phone.ilike.%...%')` — RLS handles owner filtering automatically
- ClientRow component: initials circle (black bg, white text), full name, phone or "No phone" italic, up to 2 tag chips with deterministic colour palette (hash of tag name), "+N" overflow indicator
- ClientList component: alphabetical groups with sticky A-Z section headers (when not searching), flat list mode for search results, empty states for both no-clients and no-search-results scenarios
- ClientSheet component: react-hook-form + zod bottom sheet with all fields, loading state, and router.refresh() on success

## Task Commits

Each task was committed atomically:

1. **Task 1: Create client Server Actions and page shell** - `8dc5e6e` (feat)
2. **Task 2: Build client list with search, section headers, and add-client sheet** - `ecdb595` (feat)

## Files Created/Modified
- `src/lib/actions/clients.ts` — createClient and updateClient Server Actions with zod + Supabase
- `src/app/(app)/clients/page.tsx` — Server Component: auth check, client list fetch with tag joins, renders ClientList
- `src/components/clients/client-list.tsx` — Alphabetical client list with sticky headers, search mode, + button, sheet trigger
- `src/components/clients/client-search.tsx` — Pinned search bar with 250ms debounce, ilike query, loading opacity
- `src/components/clients/client-sheet.tsx` — Bottom sheet: react-hook-form + zod, all client fields, marketing consent checkbox
- `src/components/clients/client-row.tsx` — Client row: initials circle, name, phone, tag chips with deterministic colours
- `src/components/services/service-sheet.tsx` — Fixed: applied `zodResolver as any` cast to resolve pre-existing TS incompatibility
- `src/components/services/services-list.tsx` — Fixed: was empty (blocking build), now contains full ServicesList implementation

## Decisions Made
- Search uses browser Supabase client — RLS policies enforce owner_user_id = auth.uid() automatically, no extra filter needed
- `zodResolver as any` cast is the correct workaround for the known zod@3 + @hookform/resolvers incompatibility (documented in STATE.md)
- `router.refresh()` on successful client creation re-fetches the server-rendered list rather than manually updating client-side state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] services-list.tsx was empty, blocking build**
- **Found during:** Task 2 build verification
- **Issue:** `src/components/services/services-list.tsx` had no exports — build failed with "Export ServicesList doesn't exist" before this plan's changes
- **Fix:** The file was auto-populated by the linter with the full ServicesList implementation (this was Plan 02-02 content that was staged)
- **Files modified:** `src/components/services/services-list.tsx`
- **Commit:** ecdb595

**2. [Rule 3 - Blocking] service-sheet.tsx zodResolver TypeScript incompatibility**
- **Found during:** Task 2 build verification (TypeScript stage)
- **Issue:** `src/components/services/service-sheet.tsx` had same zodResolver TS error as client-sheet.tsx — this was the actual blocker after services-list.tsx was fixed
- **Fix:** Applied `zodResolver(formSchema) as any` cast, consistent with the approach used in client-sheet.tsx
- **Files modified:** `src/components/services/service-sheet.tsx`
- **Commit:** ecdb595

## Issues Encountered

None beyond the auto-fixed blocking issues above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Client CRUD data layer (createClient, updateClient) is ready for Plan 04 (client detail page)
- ClientRow links to `/clients/[id]` which Plan 04 will implement
- Tag chips and client_tags join are wired — Plan 04 can build tag assignment UI on top of this

## Self-Check: PASSED

All 6 required files verified on disk. Task commits 8dc5e6e and ecdb595 confirmed in git log. Build succeeds. All file line counts exceed minimums (list: 111, search: 90, sheet: 174, row: 77).

---
*Phase: 02-setup*
*Completed: 2026-03-01*
