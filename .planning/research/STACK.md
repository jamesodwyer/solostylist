# Stack Research

**Domain:** Mobile-first PWA — solo beauty professional business management
**Researched:** 2026-03-01
**Confidence:** HIGH (core stack verified via official docs; supporting libraries verified via npm + multiple web sources)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.x (latest: 16.1.6) | App framework, routing, SSR/RSC | App Router + React Server Components is the production standard for 2025/2026. Built-in PWA manifest support (no third-party plugin needed). Pre-decided. |
| React | 19.x | UI runtime | Ships with Next.js 16. Server Components reduce client JS; concurrent features improve perceived performance on mobile. Pre-decided. |
| TypeScript | 5.9.x (stable) | Type safety | Not optional — Zod, React Hook Form, Supabase client, and shadcn/ui all rely on accurate TS types for DX. TS 6.0 is in beta; stay on 5.x stable. |
| Tailwind CSS | 4.x (latest: 4.2.1 via @tailwindcss/postcss) | Utility-first styling | v4 is now stable with 3-10x faster builds. CSS-first config replaces tailwind.config.js. @tailwindcss/postcss is the required PostCSS plugin in v4 (not the old tailwindcss plugin). Pre-decided. |
| shadcn/ui | 3.x (latest: 3.8.5 via `npx shadcn`) | Component library | Not installed as a package — components are copied into your repo via CLI. Fully compatible with React 19 + Tailwind v4 as of the February 2026 Radix UI unification update. Uses unified `radix-ui` package in new-york style. Pre-decided. |
| Supabase Postgres | Managed (cloud) | Relational database | RLS enforced at the database level, not application layer. 12-table schema in PRD maps directly to Postgres. No ORM needed — Supabase client is the query layer. Pre-decided. |
| Supabase Auth | Managed (cloud) | Authentication | Email OTP/magic link out of the box. `@supabase/ssr` replaces the deprecated `@supabase/auth-helpers-nextjs`. Cookie-based sessions work with Next.js RSC, Server Actions, and middleware. Pre-decided. |

### Supabase Client Libraries

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| @supabase/supabase-js | 2.x (latest: 2.98.0) | Supabase JS client | Core client for all DB queries, auth, and realtime. Actively maintained, last published 2 days ago. |
| @supabase/ssr | latest | SSR-compatible auth helpers | Replaces deprecated `@supabase/auth-helpers-nextjs`. Creates separate server/client Supabase instances for RSC vs client components. Required for cookie-based auth with App Router. |

### Forms and Validation

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| react-hook-form | 7.x (latest: 7.71.2) | Form state management | Minimal re-renders (uncontrolled inputs), performant on mobile, works with `useActionState` for Server Actions in Next.js 15+. Industry standard pairing with Zod. |
| zod | 3.x (stay on v3, not v4) | Schema validation | **Use v3 (3.23.x), not v4.** Zod v4 (4.x) has known TypeScript type incompatibilities with `@hookform/resolvers` (issues #799, #813, #4992). The resolver team is working on a fix but as of March 2026 v4 is unstable in this pairing. Zod v3 is fully supported by all resolvers and shadcn/ui examples. |
| @hookform/resolvers | 5.x (latest: 5.2.2) | Bridges RHF + Zod | Required adapter that exposes `zodResolver`. Import from `zod` (v3 path), not `zod/v4`. |

### State Management

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| TanStack Query (@tanstack/react-query) | 5.x (latest: 5.90.21) | Server state, caching, data fetching | Handles appointments, clients, invoices, payments — all server state. Eliminates manual loading/error state boilerplate. Works with Supabase via `useQuery` + invalidation on mutation. Combine with `HydrationBoundary` for RSC prefetch. |
| Zustand | 5.x (latest: 5.0.11) | Client-only UI state | For global client state that isn't server data: active date in diary, selected client in booking flow, UI panel open/closed. 6 kB, no provider needed, no boilerplate. Do NOT use for server/async state (that's TanStack Query's job). |
| nuqs | 2.x (latest: 2.8.8) | URL search params as state | Type-safe `useQueryState` hook — like `useState` but synced to URL. Use for the diary date picker, client search query, and filter states so they survive page reload and are shareable. Used by Supabase and Vercel internally. |

### Date and Time

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| date-fns | 4.x (latest: 4.1.0) | Date arithmetic and formatting | Zero-dependency, tree-shakeable, TypeScript-first. v4 is stable and adds first-class timezone support via `@date-fns/tz`. Used for slot grid generation, appointment overlap checks, and display formatting. |
| @date-fns/tz | 1.x (latest: 1.4.1) | London timezone handling | Required companion to date-fns v4 for `Europe/London` timezone operations. The project stores `start_at`/`end_at` as timestamps; timezone-aware math prevents booking errors during BST/GMT transitions. |

### Data Export

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| papaparse | 5.x (latest: 5.x) | CSV generation | Use `papaparse` directly (not the `react-papaparse` wrapper, which is 2 years stale at 4.4.0). Call `Papa.unparse(data)` to convert JSON arrays to CSV strings, then trigger browser download via `Blob + URL.createObjectURL`. Handles BOM for Excel compatibility, quoted fields, and special characters. |

### Notifications and Feedback

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| sonner | latest (via shadcn CLI) | Toast notifications | The official shadcn/ui toast recommendation as of 2025. shadcn deprecated its legacy `<Toast>` component in favour of sonner. Trusted by OpenAI and Adobe. Add via `npx shadcn add sonner`. |

### PWA

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| None (built-in) | Next.js 16 | PWA manifest + install | Next.js App Router has built-in PWA manifest support via `app/manifest.ts`. No `next-pwa` or serwist required for add-to-home-screen. Create a static `public/sw.js` for push notifications if needed. next-pwa is unmaintained; serwist is only needed if offline caching is required (it is not in scope for MVP). |

### Icons

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| lucide-react | latest | UI icons | The default icon set for shadcn/ui. Fully typed React components rendered as inline SVGs. 1,655+ icons. Installed automatically when adding shadcn/ui components. |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript 5.9.x | Type checking | Stay on 5.x stable; TS 6.0 beta is not yet production-ready |
| ESLint + eslint-config-next | Linting | Included in `create-next-app`; catches App Router anti-patterns |
| Prettier | Code formatting | Standard across the Next.js ecosystem |
| Supabase CLI | Migrations, local dev, seed | Run `supabase db push` for schema migrations; migrations stored as SQL in `supabase/migrations/` |
| supabase local | Local Supabase stack | `supabase start` runs Postgres + Auth + Studio locally via Docker |

---

## Installation

```bash
# Create app (selects Next.js 16, React 19, TypeScript, Tailwind v4, ESLint)
npx create-next-app@latest solostylist --typescript --tailwind --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Forms and validation (use zod v3, not v4)
npm install react-hook-form @hookform/resolvers zod@^3

# State management
npm install @tanstack/react-query zustand nuqs

# TanStack Query devtools (dev only)
npm install -D @tanstack/react-query-devtools

# Date handling
npm install date-fns @date-fns/tz

# CSV export
npm install papaparse
npm install -D @types/papaparse

# shadcn/ui (component scaffolding CLI, not a package install)
npx shadcn@latest init
# Then add components as needed:
npx shadcn@latest add button input sheet dialog sonner

# Tailwind PostCSS (should be set up by create-next-app, verify)
npm install -D @tailwindcss/postcss postcss
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| zod v3 | zod v4 | Switch to v4 once `@hookform/resolvers` publishes a patch that resolves TypeScript type errors (track issue #813). Check release notes before upgrading. |
| TanStack Query | SWR | SWR is simpler but lacks optimistic updates and mutation helpers. For a booking app with many write operations (complete appointment, log payment), TanStack Query's `useMutation` + `invalidateQueries` pattern is cleaner. |
| TanStack Query | React Server Components only | RSC can fetch data server-side without TanStack Query, but you lose client-side caching, background refetch, and the invalidation pattern needed for real-time diary updates after a booking mutation. |
| Zustand | Context API | Context is fine for simple cases but triggers full subtree re-renders. Zustand's selective subscriptions prevent wasted re-renders in the diary slot grid. |
| nuqs | useSearchParams | Next.js raw `useSearchParams` requires manual parsing, encoding, and router.push. nuqs adds type-safe parsers, debouncing, and a `useState`-compatible API. |
| date-fns v4 + @date-fns/tz | date-fns-tz (v3 ecosystem) | `date-fns-tz` is the v2/v3 companion. If you downgrade to date-fns v3, use `date-fns-tz` instead of `@date-fns/tz`. For a new project, start on v4. |
| papaparse (direct) | react-papaparse | react-papaparse is 2 years stale (last version 4.4.0) with no React 19 compatibility guarantees. The underlying papaparse library is actively maintained. |
| next-pwa (omitted) | serwist | Add serwist only if offline caching becomes a requirement (post-MVP). For MVP, built-in Next.js manifest is sufficient for add-to-home-screen. |
| sonner | react-toastify | react-toastify works but requires manual Tailwind integration. Sonner is the shadcn/ui default, already styled to match your design system. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| zod v4 (4.x) | TypeScript type errors with `@hookform/resolvers` as of March 2026; `zodResolver` types are mismatched. Active GitHub issues in both repos with no stable fix yet. | zod v3 (^3) until resolvers releases a verified patch |
| @supabase/auth-helpers-nextjs | Officially deprecated. Package still exists on npm but receives no updates. | @supabase/ssr |
| react-papaparse | Last published 2 years ago; no React 19 support verified; the React wrapper adds no value for a pure export use case. | papaparse directly (Papa.unparse) |
| next-pwa | Unmaintained (last meaningful update 2022). Requires webpack config hacks that conflict with Next.js 15+ Turbopack. | Next.js built-in manifest (app/manifest.ts) |
| Prisma ORM | Adds a migration layer between you and Supabase Postgres. Supabase RLS is enforced at the database level; an ORM that bypasses the Supabase client can silently circumvent RLS policies. | Supabase JS client (@supabase/supabase-js) |
| Redux / Redux Toolkit | 15-20x more boilerplate than Zustand + TanStack Query for no benefit in this use case. The industry has moved on for solo and small-team apps. | Zustand (client state) + TanStack Query (server state) |
| react-query v4 or earlier | TanStack Query v5 has breaking API changes from v4 (`isLoading` → `isPending`). Installing v4 with shadcn/ui's v5 examples will cause silent runtime bugs. | @tanstack/react-query@5 |
| Tailwind v3 | shadcn/ui 3.x and Next.js 15.3+ default to Tailwind v4. The v3 tailwind.config.js is not generated by default and v3's `@tailwind` directives are replaced with `@import "tailwindcss"` in v4. Starting on v3 means immediate migration debt. | tailwindcss v4 + @tailwindcss/postcss |

---

## Stack Patterns by Variant

**For server-fetched data (appointments, clients, invoices):**
- Use TanStack Query `useQuery` with Supabase queries
- Prefetch in Server Components using `dehydrate` + `HydrationBoundary` for instant first load
- Invalidate with `queryClient.invalidateQueries` after mutations

**For UI-only state (date picker selection, modal open/closed, multi-step form step):**
- Use Zustand for state that needs to persist across component tree
- Use local `useState` for truly local state

**For shareable/bookmarkable filter state (selected date in diary, client search term):**
- Use nuqs `useQueryState` — state lives in the URL, survives page reload, no extra store needed

**For forms with server action submission:**
- Use `react-hook-form` + `zodResolver` for client-side validation
- Wire `form.handleSubmit` to a Server Action
- Use `useActionState` for pending state on the submit button

**For CSV export:**
```typescript
// In a Server Action or client handler
import Papa from 'papaparse'

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(data, { bom: true }) // bom: true for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

**For PWA manifest (app/manifest.ts):**
```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Solo Stylist OS',
    short_name: 'StylistOS',
    description: 'Business management for solo beauty professionals',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@16.x | react@19.x | Ship together; do not mix Next.js 15 + React 18 or vice versa |
| tailwindcss@4.x | @tailwindcss/postcss@4.x | Must use @tailwindcss/postcss; the old `tailwindcss` PostCSS plugin is v3-only |
| shadcn@3.x | tailwindcss@4.x + react@19.x | shadcn 3.x dropped forwardRef, uses data-slot attributes, requires React 19 |
| react-hook-form@7.x | zod@^3 + @hookform/resolvers@5.x | **Do not use zod@4.x** — TypeScript type errors in resolvers; use zod@^3 until resolvers patches v4 support |
| @tanstack/react-query@5.x | next@16.x | Use `isLoading` → `isPending` naming (v5 API); import devtools from @tanstack/react-query-devtools |
| @supabase/supabase-js@2.x | @supabase/ssr | Both required; ssr package creates SSR-safe client instances for App Router |
| date-fns@4.x | @date-fns/tz@1.x | v4 timezone support requires @date-fns/tz; do not use the old date-fns-tz package with v4 |
| nuqs@2.x | next@16.x | nuqs 2.x supports Next.js App Router natively; no adapter configuration needed for Next.js 15+ |

---

## Sources

- [Next.js PWA Official Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — Built-in manifest support, no next-pwa needed (verified, last updated 2026-02-27, HIGH confidence)
- [Next.js blog: 16.1 release](https://nextjs.org/blog/next-16-1) — Latest Next.js version confirmed as 16.1 (HIGH confidence)
- [Supabase Auth SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — @supabase/ssr replacing @supabase/auth-helpers-nextjs (HIGH confidence)
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog) — React 19 + Tailwind v4 compatibility confirmed; February 2026 Radix unification (HIGH confidence)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — @tailwindcss/postcss required for v4; v3 directives replaced (HIGH confidence)
- [Zod v4 + hookform/resolvers Issue #799](https://github.com/react-hook-form/resolvers/issues/799) — Active TypeScript incompatibility; stay on zod v3 (HIGH confidence, multiple GitHub issues corroborate)
- [date-fns v4.0 release](https://blog.date-fns.org/v40-with-time-zone-support/) — v4 stable with @date-fns/tz for timezone support (HIGH confidence)
- [TanStack Query npm](https://www.npmjs.com/package/@tanstack/react-query) — v5.90.21 latest as of March 2026 (HIGH confidence)
- [nuqs at React Advanced 2025](https://www.infoq.com/news/2025/12/nuqs-react-advanced/) — Used by Supabase, Vercel, Sentry; v2.8.8 latest (MEDIUM confidence, multiple sources)
- [papaparse npm](https://www.npmjs.com/package/papaparse) — Actively maintained; prefer direct over react-papaparse wrapper (HIGH confidence)
- npm version checks via WebSearch for react-hook-form (7.71.2), zustand (5.0.11), @hookform/resolvers (5.2.2), @supabase/supabase-js (2.98.0), TypeScript (5.9.3 stable), shadcn (3.8.5), date-fns (4.1.0), @date-fns/tz (1.4.1), tailwindcss/postcss (4.2.1) — MEDIUM confidence (search results, not direct npm registry)

---

*Stack research for: Solo Stylist OS — mobile-first PWA, solo beauty professional business management*
*Researched: 2026-03-01*
