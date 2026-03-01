# Phase 1: Foundation - Research

**Researched:** 2026-03-01
**Domain:** Next.js App Router + Supabase SSR Auth + PWA + Database Schema + RLS
**Confidence:** HIGH (core stack verified against official docs and Context7-equivalent sources dated 2026-02-27)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Login Experience**
- Warm & branded login screen — full-bleed brand color background, logo prominent, friendly copy (e.g. "Welcome back, gorgeous")
- Dedicated confirmation screen after email submission — new page with icon/illustration, "Check your inbox" message, and "Resend" link
- New users route to onboarding flow after first auth; returning users go straight to diary
- Persistent Supabase session — users stay signed in until explicit logout (no session expiry)

**App Shell & Navigation**
- 4 bottom navigation tabs: Diary, Clients, Money, Settings (Today + Book merged into single "Diary" tab)
- Default landing screen: Diary (today's view) for signed-in users
- Icons with text labels on all tabs (iOS tab bar pattern)
- Back button (top-left arrow) on sub-pages/detail views; bottom tabs remain visible at all times

**Visual Identity**
- Black and white theme — monochrome palette, no accent colors for now
- Light mode only for MVP (no dark mode)
- Rounded & friendly typography — Nunito, Poppins, or DM Sans family
- Clean and high-contrast

**PWA Install Prompt**
- Trigger: after first successful sign-in
- Style: bottom banner with dismiss option (non-blocking)
- Re-prompt: show once more after dismissal (7 days or 5 sessions), then never again
- iOS Safari: detect and show manual step-by-step instructions ("Tap Share -> Add to Home Screen")

**Technical Stack**
- Next.js App Router — file-based routing, server components by default
- Supabase client libraries for auth and database
- Zod v3 for validation (v4 blocked by hookform/resolvers incompatibility)
- shadcn/ui as component library
- Tailwind CSS for styling
- All 12 database tables in SQL migrations with RLS policies
- btree_gist extension must be enabled in Phase 1 migration (needed in Phase 3)

### Claude's Discretion
- Specific font choice from the rounded/friendly family (Nunito, Poppins, or DM Sans)
- Loading states, skeleton screens, and error state designs
- Exact spacing and typography scale
- PWA manifest details (theme color, splash screen)
- Onboarding flow specifics (Phase 1 = lightweight welcome/redirect; Phase 2 builds full profile)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign in securely via email OTP or magic link (no passwords) | Supabase `signInWithOtp()` + `@supabase/ssr` middleware pattern |
| AUTH-05 | App supports PWA add-to-home-screen on mobile | Next.js native manifest + `beforeinstallprompt` + iOS Safari instructions |
| DATA-01 | All tables use RLS enforcing `owner_user_id = auth.uid()` | Supabase RLS SQL policies with `(select auth.uid())` optimized form |
| DATA-04 | No unauthenticated access to business data | Middleware `getUser()` gatekeeper + redirect to `/login` |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield Next.js 15 project wired to a Supabase backend. The primary concerns are: (1) setting up the project scaffold with shadcn/ui and Tailwind, (2) implementing cookie-based Supabase SSR auth with magic links and middleware protection, (3) creating all 12 database tables with RLS policies in a single migration, and (4) adding PWA installability via a native manifest file and a client-side install banner with iOS fallback instructions.

The Supabase `@supabase/ssr` package is the current standard for Next.js SSR auth. It replaces the deprecated `@supabase/auth-helpers-nextjs`. The key pattern is a `middleware.ts` that calls `supabase.auth.getUser()` (never `getSession()` — see Pitfalls) to refresh the token and redirect unauthenticated users. All data pages are protected at the middleware layer; no per-page auth guards needed.

PWA add-to-home-screen has a browser split: Chrome/Android supports `beforeinstallprompt` to defer and trigger a custom install banner; iOS Safari does not support this event and requires a manual instruction UI ("Tap Share > Add to Home Screen"). Both paths need to be handled. The Next.js official docs (updated 2026-02-27) recommend against using `next-pwa` or Serwist for simple installability — those are for offline/caching. For this phase, a native `app/manifest.ts` file plus a client-side install banner component is sufficient. Service worker / offline support is out of scope for Phase 1.

**Primary recommendation:** Scaffold with `create-next-app`, add Supabase SSR, configure middleware auth, write a single SQL migration for all 12 tables + RLS, build the app shell with bottom nav, then add PWA manifest and install banner. No additional PWA library required for Phase 1.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.x | Framework, App Router, file conventions | Official framework; App Router is the current standard |
| react | 19.x | UI rendering | Required by Next.js 15 |
| @supabase/supabase-js | latest | Supabase client (auth + DB queries) | Official Supabase client |
| @supabase/ssr | latest | Cookie-based SSR auth for Next.js | Official replacement for deprecated auth-helpers |
| tailwindcss | 4.x | Utility CSS | Selected; shadcn/ui is built on it |
| shadcn/ui | latest CLI | Accessible component primitives | Selected; copies components into project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3 (NOT v4) | Form/input validation | v4 blocked by @hookform/resolvers incompatibility |
| react-hook-form | latest | Form state management | Standard pairing with zod + shadcn/ui Form |
| @hookform/resolvers | latest | Connects zod schema to react-hook-form | Required for zod integration |
| next/font/google | built-in | Self-hosted Google Fonts | No external font request, built into Next.js |
| lucide-react | latest | Icon set | Used by shadcn/ui; consistent icon library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is deprecated — do not use |
| native manifest.ts | next-pwa / serwist | next-pwa is unmaintained; serwist adds complexity only needed for offline/caching (not required Phase 1) |
| zod ^3 | zod v4 | v4 blocked until @hookform/resolvers publishes verified patch |
| custom bottom nav | shadcn Tabs component | shadcn Tabs is horizontal — bottom nav requires custom component; Tabs can be used as base but needs CSS override |

**Installation:**
```bash
# Bootstrap project
npx create-next-app@latest solostylist --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui
npx shadcn@latest init

# Form + validation (use zod ^3, NOT ^4)
npm install react-hook-form @hookform/resolvers zod@^3

# Supabase CLI (local dev)
npm install -g supabase
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx               # Root layout — font, global providers
│   ├── manifest.ts              # PWA manifest (Next.js built-in)
│   ├── (auth)/                  # Route group — no auth required
│   │   ├── login/
│   │   │   └── page.tsx         # Magic link request form
│   │   └── check-email/
│   │       └── page.tsx         # "Check your inbox" confirmation
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts         # Supabase magic link exchange
│   ├── (app)/                   # Route group — auth required
│   │   ├── layout.tsx           # App shell: bottom nav + back button logic
│   │   ├── diary/
│   │   │   └── page.tsx         # Default landing (today's diary view)
│   │   ├── clients/
│   │   │   └── page.tsx         # Clients tab placeholder
│   │   ├── money/
│   │   │   └── page.tsx         # Money tab placeholder
│   │   └── settings/
│   │       └── page.tsx         # Settings tab placeholder
│   └── onboarding/
│       └── page.tsx             # Lightweight welcome/redirect (Phase 1)
├── components/
│   ├── ui/                      # shadcn/ui copied components
│   ├── bottom-nav.tsx           # Custom bottom tab bar
│   ├── install-banner.tsx       # PWA install prompt component
│   └── ios-install-instructions.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client (createBrowserClient)
│   │   └── server.ts            # Server client (createServerClient + cookies)
│   └── utils.ts                 # cn() utility from shadcn
middleware.ts                    # Auth guard — runs on every (app)/* route
supabase/
└── migrations/
    └── 20260301000000_initial_schema.sql   # All 12 tables + RLS + btree_gist
```

### Pattern 1: Supabase SSR Auth (Middleware)

**What:** `middleware.ts` creates a Supabase server client with cookie access, calls `getUser()` to validate the session, redirects unauthenticated users to `/login`.

**When to use:** Every route except `/login`, `/check-email`, and `/auth/callback`.

```typescript
// middleware.ts
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: use getUser() not getSession() — see Pitfalls
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/check-email') ||
    request.nextUrl.pathname.startsWith('/auth/callback')

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 2: Magic Link Sign-In (Server Action)

**What:** Browser client calls `signInWithOtp()`, Supabase emails a link. User clicks link -> redirected to `/auth/callback` -> session exchanged -> redirect to app.

```typescript
// app/(auth)/login/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithMagicLink(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      // shouldCreateUser: true (default) — new users are created automatically
    },
  })
  if (error) throw error
  redirect('/check-email')
}
```

```typescript
// app/auth/callback/route.ts
// Source: Supabase SSR docs
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/diary'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if new user — query profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (!profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

### Pattern 3: Server-side Supabase Client

```typescript
// lib/supabase/server.ts
// Source: Supabase SSR docs
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookie writes ignored; middleware handles refresh
          }
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 4: RLS Policy Template (all 12 tables)

**What:** Every table has RLS enabled and 4 policies (SELECT, INSERT, UPDATE, DELETE) all gated on `(select auth.uid()) = owner_user_id`.

```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security

-- Enable RLS (repeat for every table)
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "{table_name}_select_own"
  ON public.{table_name} FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- INSERT (with check, not just using)
CREATE POLICY "{table_name}_insert_own"
  ON public.{table_name} FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

-- UPDATE
CREATE POLICY "{table_name}_update_own"
  ON public.{table_name} FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

-- DELETE
CREATE POLICY "{table_name}_delete_own"
  ON public.{table_name} FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_user_id);
```

**Performance note:** `(select auth.uid())` (subquery form) is preferred over bare `auth.uid()` — Postgres caches the subquery result per statement rather than re-evaluating per row.

### Pattern 5: PWA Manifest (Next.js built-in)

```typescript
// app/manifest.ts
// Source: https://nextjs.org/docs/app/guides/progressive-web-apps
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SoloStylist',
    short_name: 'SoloStylist',
    description: 'Your beauty business, in your pocket',
    start_url: '/diary',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',        // Black — monochrome brand
    orientation: 'portrait',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
```

### Pattern 6: PWA Install Banner (Client Component)

**What:** Listen for `beforeinstallprompt` (Chrome/Android), defer it, show banner after first sign-in. Detect iOS Safari separately and show manual instructions.

```typescript
// components/install-banner.tsx
'use client'
import { useState, useEffect } from 'react'

const DISMISS_KEY = 'pwa_install_dismissed'
const DISMISS_COUNT_KEY = 'pwa_install_dismiss_count'
const DISMISS_TIME_KEY = 'pwa_install_dismiss_time'
const MAX_DISMISSALS = 2          // show max twice
const REDISPLAY_DAYS = 7

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsIOS(ios)
    setIsStandalone(standalone)

    // Don't show if already installed
    if (standalone) return

    const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0')
    if (dismissCount >= MAX_DISMISSALS) return

    const dismissTime = localStorage.getItem(DISMISS_TIME_KEY)
    if (dismissTime) {
      const daysSince = (Date.now() - parseInt(dismissTime)) / (1000 * 60 * 60 * 24)
      if (daysSince < REDISPLAY_DAYS) return
    }

    if (ios) {
      setShowBanner(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowBanner(false)
  }

  const handleDismiss = () => {
    const count = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0') + 1
    localStorage.setItem(DISMISS_COUNT_KEY, count.toString())
    localStorage.setItem(DISMISS_TIME_KEY, Date.now().toString())
    setShowBanner(false)
  }

  if (!showBanner || isStandalone) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-black text-white rounded-xl p-4 shadow-lg z-50">
      {isIOS ? (
        <p className="text-sm">
          To install: tap the Share button, then "Add to Home Screen"
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">Add SoloStylist to your home screen</p>
          <button onClick={handleInstall} className="text-sm font-semibold underline">
            Install
          </button>
        </div>
      )}
      <button onClick={handleDismiss} className="absolute top-2 right-3 text-white/60 text-xs">
        ✕
      </button>
    </div>
  )
}
```

### Pattern 7: Font Setup (Nunito — recommended choice)

Nunito is recommended over Poppins or DM Sans because it is a variable font (single file, better performance), has excellent legibility at small sizes common on mobile, and its rounded letterforms align best with "rounded & friendly" aesthetic while maintaining high contrast readability in black and white.

```typescript
// app/layout.tsx
import { Nunito } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  // Variable font — no weight needed
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-[family-name:var(--font-nunito)] bg-white text-black">
        {children}
      </body>
    </html>
  )
}
```

Then in `tailwind.config.ts` (or CSS with Tailwind v4):
```css
/* app/globals.css (Tailwind v4 style) */
@import "tailwindcss";
@theme {
  --font-sans: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
}
```

### Pattern 8: Bottom Navigation Component

shadcn/ui does not include a bottom navigation component (as of 2026). The standard approach is a custom component using Next.js `usePathname` for active state.

```typescript
// components/bottom-nav.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Users, DollarSign, Settings } from 'lucide-react'

const tabs = [
  { href: '/diary',    label: 'Diary',    Icon: BookOpen },
  { href: '/clients',  label: 'Clients',  Icon: Users },
  { href: '/money',    label: 'Money',    Icon: DollarSign },
  { href: '/settings', label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
                    pb-safe">  {/* pb-safe handles iOS home indicator */}
      <div className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center justify-center flex-1 py-2 gap-0.5
                         text-xs font-medium transition-colors
                         ${active ? 'text-black' : 'text-gray-400'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

**Safe area for iOS:** Add to `globals.css`:
```css
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Or use the `tailwindcss-safe-area` plugin for Tailwind utilities.

### Anti-Patterns to Avoid

- **Using `getSession()` in middleware/server:** Returns cached, unverified data. Use `getUser()` which validates with Supabase Auth server on every request.
- **Calling `cookies()` synchronously in Next.js 15:** `cookies()` is now async — must `await cookies()` in server components and route handlers.
- **Importing server-only modules in Client Components:** `createServerClient` from `@supabase/ssr` cannot be used in Client Components. Use `createBrowserClient` there.
- **Skipping RLS on a table:** Supabase returns no rows by default with RLS enabled and no matching policy — but this is a footgun; missing policies on INSERT/UPDATE/DELETE silently block writes.
- **Using `next-pwa` package:** Unmaintained. Next.js official docs recommend native manifest + manual service worker or Serwist only if offline caching is needed (Phase 1 does not require offline).
- **Zod v4:** Do not upgrade until @hookform/resolvers publishes verified patch (active GitHub issues #799, #813, #4992 as of 2026-03).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session management | Custom JWT/cookie auth | `@supabase/ssr` + Supabase Auth | Token refresh, PKCE, session rotation, secure cookie handling are non-trivial |
| Magic link token exchange | Manual code verification | `supabase.auth.exchangeCodeForSession(code)` | Supabase handles PKCE verification, session creation, cookie setting |
| Form validation | Custom validation functions | Zod v3 + react-hook-form + @hookform/resolvers | Edge cases, error message formatting, async validation |
| RLS policies | Application-layer row filtering | Postgres RLS with `auth.uid()` | Database-level security cannot be bypassed by application bugs |
| PWA manifest | Manual `<link rel="manifest">` tag | `app/manifest.ts` (Next.js built-in) | Automatic content-type header, TypeScript types, no manual HTML |
| Icon generation | Manual sizing | realfavicongenerator.net | Generates all required sizes (192x192, 512x512, Apple touch icon, etc.) |

**Key insight:** In this stack, auth complexity lives in Supabase + `@supabase/ssr`. Application code just calls `getUser()` and trusts the result. Never build custom session refresh loops.

---

## Common Pitfalls

### Pitfall 1: getSession() vs getUser() in Server Code

**What goes wrong:** `getSession()` reads the session from the cookie without re-validating with the Supabase Auth server. An attacker who can forge or steal a cookie can bypass route protection.

**Why it happens:** Developers copy old examples using `getSession()` which still works but is insecure server-side.

**How to avoid:** Always use `supabase.auth.getUser()` in middleware, Server Components, and Route Handlers. Reserve `getSession()` only for client-side, where Supabase already has the validated session in memory.

**Warning signs:** Any server-side code calling `getSession()` to check auth.

### Pitfall 2: cookies() is Async in Next.js 15

**What goes wrong:** `const cookieStore = cookies()` (synchronous call) throws a runtime error in Next.js 15 where `cookies()` returns a Promise.

**Why it happens:** Next.js 15 made `cookies()`, `headers()`, and related APIs async.

**How to avoid:** Always `await cookies()` in server-side Supabase client factories and Route Handlers.

```typescript
// WRONG (Next.js 14 pattern)
const cookieStore = cookies()

// CORRECT (Next.js 15)
const cookieStore = await cookies()
```

### Pitfall 3: Supabase Free Plan Email Rate Limit

**What goes wrong:** Default Supabase SMTP is capped at 2 emails per hour (built-in provider). During development with multiple test accounts this is immediately hit. OTP/magic link requests are then silently dropped or return 429.

**Why it happens:** Supabase built-in email is for initial testing only, not development or production use.

**How to avoid:** Configure custom SMTP (Resend, SendGrid, AWS SES) before any real testing. Set in Supabase Dashboard > Authentication > SMTP Settings. With custom SMTP the rate limit rises to 30 per hour and is configurable. Note this is a blocker flagged in STATE.md.

**Warning signs:** Emails not arriving; Supabase logs showing 429 rate-limit errors.

### Pitfall 4: Missing RLS Policy Silently Blocks Writes

**What goes wrong:** A table has RLS enabled and a SELECT policy but no INSERT policy. All inserts silently fail with `{ data: null, error: null }` (no error thrown, just empty result).

**Why it happens:** Each SQL operation needs its own policy. SELECT policy does not cover INSERT.

**How to avoid:** Always create all 4 policies (SELECT, INSERT, UPDATE, DELETE) when enabling RLS on a table. Test each operation type in the Supabase SQL editor before relying on it in code.

**Warning signs:** `supabase.from('table').insert({...})` returns `{ data: null, error: null }` with no rows created.

### Pitfall 5: beforeinstallprompt Not Available on iOS Safari

**What goes wrong:** Install banner never triggers on iPhone. The `beforeinstallprompt` event simply does not fire on iOS Safari — it is a Chrome/Android-only event.

**Why it happens:** Apple controls the PWA install flow and does not expose a programmatic install API.

**How to avoid:** Detect iOS with `navigator.userAgent` check, then show a static instruction banner explaining the manual steps (Tap Share > Add to Home Screen). Check `window.matchMedia('(display-mode: standalone)').matches` to avoid showing instructions when already installed.

### Pitfall 6: App Shell Bottom Nav Covers Content

**What goes wrong:** The fixed bottom navigation bar overlaps the bottom of page content, making the last items in a list unreachable.

**Why it happens:** `position: fixed` removes the element from document flow; page content doesn't know the nav exists.

**How to avoid:** Add `pb-[env(safe-area-inset-bottom)]` plus the nav height (typically `pb-20`) to the main content wrapper in the `(app)/layout.tsx`.

### Pitfall 7: Supabase Dashboard Redirect URL Not Configured

**What goes wrong:** Magic link clicks redirect to a Supabase error page ("This site's redirect_uri is not permitted").

**Why it happens:** Supabase requires explicit allowlist of redirect URLs. The `/auth/callback` URL must be added to the dashboard's allowed redirect URLs.

**How to avoid:** In Supabase Dashboard > Authentication > URL Configuration, add:
- Site URL: `http://localhost:3000` (development)
- Redirect URLs: `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback`

---

## Code Examples

### New User Detection in Callback Route

```typescript
// Source: Supabase docs + community pattern
// Pattern: query profiles table created by DB trigger
const { data: { user } } = await supabase.auth.getUser()

// profiles row is auto-created by DB trigger on auth.users INSERT
// onboarding_completed defaults to false
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarding_completed')
  .eq('id', user.id)
  .single()

const destination = profile?.onboarding_completed ? '/diary' : '/onboarding'
```

### Database Trigger for Auto-Creating Profile Row

```sql
-- In migration: ensures every new auth user gets a profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, owner_user_id, onboarding_completed)
  VALUES (NEW.id, NEW.id, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### btree_gist Extension (required for Phase 3)

```sql
-- Must be in Phase 1 migration — cannot be added later without disruption
-- Source: STATE.md decision
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

### App Shell Layout

```typescript
// app/(app)/layout.tsx
import { BottomNav } from '@/components/bottom-nav'
import { InstallBanner } from '@/components/install-banner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <main className="pb-20 pb-[calc(theme(spacing.20)+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
      <InstallBanner />
    </div>
  )
}
```

### RLS-Compliant Table Template (SQL)

```sql
-- Template for each of the 12 tables
-- Replace {table} and {columns} as appropriate
CREATE TABLE public.{table} (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  -- {columns}
);

ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{table}_select_own" ON public.{table}
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "{table}_insert_own" ON public.{table}
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "{table}_update_own" ON public.{table}
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "{table}_delete_own" ON public.{table}
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023/2024 | Auth helpers deprecated; all new projects use `@supabase/ssr` |
| `cookies()` synchronous | `await cookies()` | Next.js 15 (2024) | All server Supabase client factories need `await` |
| `getSession()` in server code | `getUser()` in server code | Supabase security advisory 2024 | `getSession()` is insecure server-side; always use `getUser()` |
| `next-pwa` package | Native `app/manifest.ts` + manual SW | 2023–2024 | next-pwa unmaintained; Next.js provides built-in manifest support |
| `tailwind.config.ts` with v3 | CSS `@theme` block with v4 | Tailwind v4 (2025) | shadcn/ui and Next.js 15 now default to Tailwind v4 |
| Separate `pages/_document.tsx` font injection | `next/font/google` variable fonts | Next.js 13+ | Self-hosted, zero layout shift, no external requests |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Do not install. Deprecated in favour of `@supabase/ssr`.
- `next-pwa` (npm package by shadowwalker): Unmaintained. Use Serwist if offline caching needed, or plain manifest for installability only.
- `getSession()` server-side: Security risk. Replaced by `getUser()`.

---

## Open Questions

1. **The 12 table schema — what are the exact table names and columns?**
   - What we know: Requirements imply: profiles, services, service_categories, appointments, appointment_services, clients, client_tags, tags, client_notes, colour_formulas, payments, audit_log (12 tables)
   - What's unclear: Exact column names and types for each table, FK relationships
   - Recommendation: Derive schema from REQUIREMENTS.md in the planning phase. Phase 1 creates all tables even if later phases populate them.

2. **Supabase project already created or needs creation?**
   - What we know: STATE.md references environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - What's unclear: Whether a Supabase project exists yet
   - Recommendation: Treat as part of Phase 1 setup task — create project, capture env vars, add to `.env.local`.

3. **PWA icons — brand assets available?**
   - What we know: Visual identity is black and white, monochrome
   - What's unclear: Whether a logo/icon asset exists
   - Recommendation: Plan to generate a simple monochrome icon for MVP using realfavicongenerator.net; placeholder is fine for development.

4. **Persistent session configuration — is there a Supabase dashboard setting?**
   - What we know: User wants "stay signed in until explicit logout"
   - What's unclear: Supabase's default session expiry and how to extend it
   - Recommendation: Supabase default session duration is configurable in Dashboard > Authentication > Session Duration. Default is 1 week with token refresh. The `@supabase/ssr` middleware pattern refreshes tokens on every request, so sessions remain active as long as the user visits within the expiry window. Set a long expiry (e.g., 30 days) in the dashboard.

---

## Sources

### Primary (HIGH confidence)
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — manifest.ts pattern, InstallPrompt component, BeforeInstallPrompt guidance (updated 2026-02-27)
- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — `next/font/google` usage, CSS variable pattern (updated 2026-02-27)
- [Supabase RLS Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy SQL syntax, `(select auth.uid())` performance pattern
- [Supabase signInWithOtp Reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp) — parameters, emailRedirectTo, shouldCreateUser
- [Supabase Passwordless Email Guide](https://supabase.com/docs/guides/auth/auth-email-passwordless) — magic link vs OTP, PKCE exchange, rate limits
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) — CLI commands, naming convention, db push

### Secondary (MEDIUM confidence)
- [Supabase SSR Next.js Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — createServerClient, middleware pattern (partially fetched; code inferred from multiple consistent sources)
- [MDN BeforeInstallPromptEvent](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent) — event API, `.prompt()` method, one-call limitation
- [shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) — CLI init command, component installation
- [Supabase Rate Limits](https://supabase.com/docs/guides/auth/rate-limits) — 2 emails/hour default, 30/hour with custom SMTP

### Tertiary (LOW confidence)
- Community pattern for `profiles` table auto-creation via DB trigger — widely referenced but not in official docs; cross-verified by multiple community sources
- Bottom nav safe-area padding (`env(safe-area-inset-bottom)`) — CSS standard, verified via MDN but specific Tailwind utility class usage is community pattern

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against official current docs
- Architecture: HIGH — Next.js App Router route group pattern is official; Supabase SSR middleware pattern from official docs
- Pitfalls: HIGH — getUser/getSession distinction from official Supabase security advisory; async cookies() from Next.js 15 release notes; SMTP rate limit from official docs
- PWA install (Android/Chrome): HIGH — official MDN + Next.js docs
- PWA install (iOS): HIGH — explicitly documented as unsupported for beforeinstallprompt; manual instructions confirmed official approach

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack — 30 days)
