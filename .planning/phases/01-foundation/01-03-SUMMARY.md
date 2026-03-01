---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [nextjs, pwa, bottom-nav, manifest, install-banner, tailwind, typescript, playwright]

# Dependency graph
requires:
  - phase: 01-02
    provides: "Auth guard (proxy.ts), Supabase client factories, magic link auth flow, onboarding page"
provides:
  - "src/app/(app)/layout.tsx: App shell layout with BottomNav and InstallBanner wrapping all authenticated pages"
  - "src/components/bottom-nav.tsx: 4-tab fixed bottom navigation (Diary, Clients, Money, Settings) with active state and iOS safe area"
  - "src/components/install-banner.tsx: PWA install prompt with Android beforeinstallprompt and iOS manual instruction paths, max-2-dismiss logic"
  - "src/app/manifest.ts: Next.js manifest route delivering standalone PWA config with black theme"
  - "src/app/(app)/diary/page.tsx: Diary placeholder page (default landing page for signed-in users)"
  - "src/app/(app)/clients/page.tsx: Clients placeholder page"
  - "src/app/(app)/money/page.tsx: Money placeholder page"
  - "src/app/(app)/settings/page.tsx: Settings placeholder page"
  - "public/icon-192x192.png and public/icon-512x512.png: PWA icons"
affects: [02-setup, 03-booking, 04-payments, 05-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "App shell: (app) route group with shared layout.tsx containing fixed BottomNav and InstallBanner"
    - "Bottom nav active state: pathname.startsWith(href) for sub-route highlight inheritance"
    - "PWA manifest: src/app/manifest.ts using MetadataRoute.Manifest (Next.js built-in, no next-pwa)"
    - "iOS safe area: pb-safe class on bottom nav for home indicator clearance"
    - "Install banner: beforeinstallprompt deferred + iOS UA detection, localStorage dismiss tracking"
    - "Viewport: export const viewport: Viewport from next with viewportFit: 'cover' and themeColor"

key-files:
  created:
    - src/app/(app)/layout.tsx
    - src/app/(app)/diary/page.tsx
    - src/app/(app)/clients/page.tsx
    - src/app/(app)/money/page.tsx
    - src/app/(app)/settings/page.tsx
    - src/components/bottom-nav.tsx
    - src/components/install-banner.tsx
    - src/app/manifest.ts
    - public/icon-192x192.png
    - public/icon-512x512.png
  modified:
    - src/app/layout.tsx
    - src/proxy.ts

key-decisions:
  - "manifest.webmanifest excluded from auth proxy matcher — without this fix, the manifest returned a 302 redirect to /login instead of JSON, breaking PWA installability"
  - "PWA icons are minimal solid-colour PNGs for MVP — production icons will be designed in Phase 5 Polish"
  - "InstallBanner positioned at bottom-20 (above bottom nav) using fixed positioning with z-50"

patterns-established:
  - "App shell pattern: (app) route group layout.tsx is the single mount point for nav and overlays"
  - "Bottom nav: 44px tap targets, icons + text labels (iOS tab bar pattern), equal flex-1 tabs"
  - "PWA installability: Next.js manifest.ts + icons + apple-web-app meta — no additional library needed"

requirements-completed: [AUTH-05, AUTH-01, DATA-04]

# Metrics
duration: ~45min (includes human-verify checkpoint wait)
completed: 2026-03-01
---

# Phase 1 Plan 03: App Shell + PWA Summary

**Next.js App Router app shell with 4-tab bottom navigation, PWA standalone manifest, and smart install banner (Android beforeinstallprompt + iOS manual instructions) — 49/49 Playwright e2e tests passing**

## Performance

- **Duration:** ~45 min (includes human-verify checkpoint for 49 Playwright e2e tests)
- **Started:** 2026-03-01T21:38:00Z
- **Completed:** 2026-03-01T21:51:17Z
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint, approved)
- **Files modified:** 12

## Accomplishments

- App shell with fixed 4-tab bottom navigation (Diary, Clients, Money, Settings) with active state highlighting and iOS safe area clearance
- PWA manifest in standalone mode with black theme, two icon sizes, and correct start_url pointing to /diary
- Smart install banner: defers beforeinstallprompt for Android/Chrome, shows manual share instructions for iOS Safari, max 2 dismissals with 7-day delay, never shows in standalone mode
- All 49 Playwright e2e tests passed — full Phase 1 flow verified (auth, protected routes, PWA manifest, icons, meta tags, DB migration with all 12 tables)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build app shell with bottom navigation and placeholder pages** - `2d25922` (feat)
2. **Task 2: Add PWA manifest and install banner with iOS detection** - `7126ea1` (feat)
3. **Task 3: Verify complete Phase 1 flow on mobile** - checkpoint approved (49/49 Playwright tests)

**Deviation fix:** `372ce19` — fix(01-03): exclude manifest.webmanifest from auth proxy

## Files Created/Modified

- `src/app/(app)/layout.tsx` - App shell Server Component: wraps all authenticated pages with BottomNav + InstallBanner
- `src/components/bottom-nav.tsx` - Client Component: 4 tabs with lucide-react icons, usePathname active detection, pb-safe for iOS
- `src/components/install-banner.tsx` - Client Component: beforeinstallprompt (Android) and iOS UA detection, localStorage dismiss logic (max 2, 7-day delay)
- `src/app/manifest.ts` - Next.js MetadataRoute.Manifest: standalone display, black theme, /diary start_url
- `src/app/(app)/diary/page.tsx` - Diary placeholder (default signed-in landing page)
- `src/app/(app)/clients/page.tsx` - Clients placeholder
- `src/app/(app)/money/page.tsx` - Money placeholder
- `src/app/(app)/settings/page.tsx` - Settings placeholder
- `src/app/layout.tsx` - Root layout: added appleWebApp meta, Viewport export with viewportFit: 'cover'
- `src/proxy.ts` - Auth guard: added /manifest.webmanifest to public route exclusions
- `public/icon-192x192.png` - 192x192 PWA icon (minimal MVP placeholder)
- `public/icon-512x512.png` - 512x512 PWA icon (minimal MVP placeholder)

## Decisions Made

- InstallBanner uses `bottom-20` to sit just above the bottom nav rather than overlapping it — better UX on small screens
- manifest.webmanifest exclusion added to proxy.ts matcher after discovering the auth guard was intercepting the manifest request and returning a 302 to /login — this would silently break PWA installability in production

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Auth proxy intercepting manifest.webmanifest**
- **Found during:** Task 2 verification (Playwright e2e tests)
- **Issue:** The proxy.ts auth guard matcher did not exclude `/manifest.webmanifest`, causing the PWA manifest request to return a 302 redirect to `/login` instead of the manifest JSON. Chrome DevTools Application > Manifest showed a fetch error.
- **Fix:** Added `/manifest.webmanifest` to the public routes array in src/proxy.ts matcher config
- **Files modified:** src/proxy.ts
- **Verification:** `/manifest.webmanifest` returns valid JSON with `display: standalone` — confirmed by Playwright test
- **Committed in:** `372ce19` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug — auth guard intercepting public PWA manifest route)
**Impact on plan:** Fix essential for PWA installability — without it, Chrome could not fetch the manifest and the install prompt would never fire. No scope creep.

## Issues Encountered

None beyond the manifest interception bug documented above.

## User Setup Required

None - no new external service configuration required. Supabase credentials from Plan 01-02 remain valid.

## Next Phase Readiness

- Phase 1 Foundation is complete: scaffold, database (12 tables + RLS), magic link auth, and app shell with PWA are all production-ready
- Phase 2 Setup can begin: the (app) route group shell is ready to receive the onboarding flow, business profile settings, services catalogue, and client CRM pages
- The bottom nav tabs (Diary, Clients, Money, Settings) provide the navigation skeleton — Phase 2 will replace placeholder page content
- Blocker inherited from Phase 1: Custom SMTP required before beta testing (Supabase free plan: 30 OTP emails/hour)
- Phase 5 action item: Replace placeholder PWA icons (solid-colour PNGs) with designed assets

---
*Phase: 01-foundation*
*Completed: 2026-03-01*

## Self-Check: PASSED

All files verified present:
- src/app/(app)/layout.tsx: FOUND
- src/components/bottom-nav.tsx: FOUND
- src/components/install-banner.tsx: FOUND
- src/app/manifest.ts: FOUND
- src/app/(app)/diary/page.tsx: FOUND
- src/app/(app)/clients/page.tsx: FOUND
- src/app/(app)/money/page.tsx: FOUND
- src/app/(app)/settings/page.tsx: FOUND
- public/icon-192x192.png: FOUND
- public/icon-512x512.png: FOUND
- src/proxy.ts: FOUND (modified)

All task commits verified:
- 2d25922: feat(01-03): build app shell with bottom navigation and placeholder pages
- 7126ea1: feat(01-03): add PWA manifest, install banner, and viewport meta
- 372ce19: fix(01-03): exclude manifest.webmanifest from auth proxy
