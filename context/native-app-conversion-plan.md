# SoloStylist: Native App Conversion Plan

## Current State

- **Frontend**: Next.js 16 (React 19) with Tailwind CSS, shadcn/ui, mobile-first PWA
- **Backend**: Next.js Server Actions + 1 API route (CSV export)
- **Database**: Supabase (PostgreSQL) with RLS, auth, 12 tables
- **Auth**: Supabase Auth (email/password, cookie-based sessions)
- **No external integrations** (no Stripe, no SMS, etc.)

---

## Recommended Approach: React Native + Expo

**Why React Native?** Your entire codebase is React/TypeScript — the team knowledge, Zod schemas, form validation logic, types, and utilities all carry over directly. Expo simplifies builds, OTA updates, and app store submissions.

### What You Keep (No Changes Needed)

| Layer | Details |
|-------|---------|
| **Supabase database** | All 12 tables, RLS policies, indexes, triggers — untouched |
| **Supabase Auth** | Same project, same users — native SDK handles tokens natively |
| **TypeScript types** | `src/lib/types/database.ts` — reuse as-is |
| **Zod schemas** | All validation schemas — reuse as-is |
| **Business logic** | Price formatting, date utils, validation rules — reuse as-is |

### What Changes

| Layer | Web (Current) | Native (New) |
|-------|---------------|--------------|
| **UI framework** | React DOM + Tailwind + shadcn | React Native + NativeWind (Tailwind for RN) or Tamagui |
| **Navigation** | Next.js App Router | React Navigation (stack + tab navigators) |
| **Data fetching** | Server Actions (`'use server'`) | Direct Supabase client calls (the JS SDK works in RN) |
| **Auth session** | Cookie-based via middleware | Supabase `@supabase/auth-helpers-react` + SecureStore |
| **Forms** | React Hook Form (works in RN too) | React Hook Form — same library, different input components |
| **CSV export** | API route `/api/export/[entity]` | Generate in-app + share via native share sheet |
| **Bottom nav** | Custom `<BottomNav>` component | React Navigation `<BottomTabNavigator>` |
| **Sheets/modals** | shadcn `<Sheet>` (Radix) | React Native Bottom Sheet or native Modal |
| **Storage** | Browser cookies/localStorage | Expo SecureStore / AsyncStorage |

---

## Conversion Effort Breakdown

### Phase 1: Project Scaffold (~1 day)
- [ ] Init Expo project with TypeScript template
- [ ] Set up folder structure mirroring current app
- [ ] Install core deps: `@supabase/supabase-js`, `react-hook-form`, `zod`, `react-navigation`
- [ ] Copy over shared code: types, schemas, utils

### Phase 2: Auth & Navigation (~1-2 days)
- [ ] Set up Supabase client for React Native (using `@supabase/supabase-js` + `expo-secure-store`)
- [ ] Build login screen
- [ ] Build password reset flow
- [ ] Build onboarding wizard (3 steps: trading name, working hours, slot size)
- [ ] Set up React Navigation: auth stack → main tab navigator
- [ ] Bottom tab nav: Diary, Clients, Money, Settings

### Phase 3: Core Screens (~3-5 days)
- [ ] **Diary** — calendar grid, appointment blocks, booking sheet
- [ ] **Clients** — list with search, client detail (tabs: details, notes, colour formulas)
- [ ] **Money** — daily payment summary, record payment sheet, adjustment sheet
- [ ] **Settings** — profile settings, service catalog management

### Phase 4: Data Layer (~1-2 days)
- [ ] Replace Server Actions with direct Supabase client queries
  - This is straightforward: each server action is just a Supabase query wrapped in `'use server'`
  - In RN, you call the same queries directly from the client (RLS protects the data)
- [ ] Implement real-time subscriptions where useful (e.g., diary updates)
- [ ] CSV export → generate + native share sheet

### Phase 5: Polish & Platform Features (~2-3 days)
- [ ] Push notifications (Expo Notifications)
- [ ] Haptic feedback on key actions
- [ ] Native date/time pickers instead of HTML inputs
- [ ] Keyboard-aware scroll views for forms
- [ ] App icons, splash screen
- [ ] Dark mode support (already have the colour tokens)

### Phase 6: Build & Submit (~1-2 days)
- [ ] EAS Build configuration (Expo Application Services)
- [ ] TestFlight (iOS) + Internal Testing (Android)
- [ ] App Store & Play Store submission

---

## Estimated Total Effort

| Phase | Estimate |
|-------|----------|
| Scaffold | ~1 day |
| Auth & Nav | ~1-2 days |
| Core Screens | ~3-5 days |
| Data Layer | ~1-2 days |
| Polish | ~2-3 days |
| Build & Submit | ~1-2 days |
| **Total** | **~9-15 days** |

---

## Key Decisions to Make

1. **UI library**: NativeWind (Tailwind classes in RN — closest to your current CSS) vs Tamagui (more performant, different API) vs plain StyleSheet
2. **State management**: Keep it simple with React context (as you do now) or add TanStack Query for caching/sync
3. **Offline support**: Do you need offline-first? (adds complexity with local SQLite + sync)
4. **Kill the web app?** Or keep both? If both, consider a shared package for types/schemas/utils

---

## What About the Web App?

You have three options:

| Option | Pros | Cons |
|--------|------|------|
| **A. Native only, kill web** | Simpler to maintain, one codebase | Lose web access |
| **B. Keep both independently** | Web stays as-is | Two codebases to maintain |
| **C. Shared monorepo (Expo + Next.js)** | Share 70%+ of code | More complex setup (Turborepo/Nx) |

**Recommendation**: Start with **Option A** (native only) since you're early stage. You can always add web back later with Expo Web if needed.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| UI rebuild takes longer than expected | Medium | Start with the design you're providing — build to spec |
| Supabase RLS policies need tweaking for client-side access | Low | Current policies already use `auth.uid()` — works the same from native |
| App Store review delays | Medium | Submit early with TestFlight, iterate |
| React Native performance with large diary grids | Low | Use FlashList + virtualization |

---

## Summary

The conversion is **very feasible** because:

1. **Database stays exactly the same** — zero migration needed
2. **Auth stays the same** — Supabase works identically in React Native
3. **All business logic is reusable** — types, schemas, validation, utils
4. **The only real work is rebuilding the UI** — and your app has ~15 screens/sheets total, which is modest
5. **No external integrations** to re-wire

The heaviest lift is rebuilding the UI components in React Native, but since you're providing a design, that gives a clear target to build toward.
