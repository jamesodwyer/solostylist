# Project Research Summary

**Project:** Solo Stylist OS
**Domain:** Mobile-first PWA — solo beauty professional business management (UK)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

Solo Stylist OS is a mobile-first progressive web app designed to replace the notebook-and-calculator workflow of solo UK beauty professionals — hairdressers, colourists, and nail technicians who currently manage bookings via WhatsApp, track payments on paper, and export nothing. The product competes directly with Fresha, Timely, Booksy, and Goldie, but targets a narrow niche those tools underserve: the cash-heavy, solo operator who owns her client relationships, works from a salon chair or home studio, and has no staff. The recommended build is a Next.js 16 App Router PWA backed by Supabase (Postgres + Auth + RLS), using Server Components for data fetching and Server Actions for all mutations. This architecture is well-established, has strong official documentation, and is the natural fit for a single-owner, data-sensitive financial tool.

The key differentiators that make this product meaningfully different from competitors are the end-of-day cash-up feature (no competitor at this price point has it as a first-class screen), structured colour formula and treatment notes per client (generic notes exist everywhere; structured note types do not), and a zero-commission, flat-fee pricing model with full data portability. These three things are concrete and buildable at MVP. Everything else — SMS reminders, self-booking portals, Stripe integration, VAT handling, multi-staff scheduling — is post-validation scope and should be explicitly deferred.

The most consequential risks are infrastructure choices that are cheap to get right at the start and extremely expensive to fix later: using integer pennies for all financial values (never floats), using `TIMESTAMPTZ` for all appointment timestamps (never bare `TIMESTAMP`), enforcing Row Level Security on join tables as well as parent tables, and adding a PostgreSQL exclusion constraint to prevent double-booking race conditions at the database level. None of these are speculative — each has a documented, real-world failure mode that would require a production data migration to recover from. They must all be addressed in the foundation sprint, before any feature work begins.

---

## Key Findings

### Recommended Stack

The stack is pre-decided at the framework level and research validated all choices. Next.js 16 with React 19 and the App Router is the correct foundation; it provides built-in PWA manifest support (no unmaintained `next-pwa` plugin required), React Server Components for zero-JS server fetches, and Server Actions for clean mutation handling without API routes. Supabase provides Postgres, Auth (magic-link OTP via `@supabase/ssr`), and Row Level Security at the database layer — the right boundary for enforcing per-owner data isolation.

The most important version constraint is **Zod v3, not v4**. As of March 2026, Zod v4 has active TypeScript type incompatibilities with `@hookform/resolvers` (GitHub issues #799, #813, #4992). Use `zod@^3` and `@hookform/resolvers@5.x`. Upgrade to v4 only once the resolver team publishes a verified patch. All other library versions are current and stable.

**Core technologies:**
- Next.js 16 + React 19: App framework, SSR, RSC, built-in PWA manifest — production standard for 2025/2026
- Supabase Postgres + Auth: Managed database with RLS enforced at DB level; `@supabase/ssr` replaces deprecated auth-helpers
- TypeScript 5.9.x: Required — every major library (Zod, shadcn, Supabase client) depends on accurate TS types; stay on 5.x stable
- Tailwind CSS v4 + shadcn/ui 3.x: v4 is 3-10x faster builds; shadcn 3.x requires Tailwind v4 and React 19; components copied via CLI not installed as a package
- react-hook-form 7.x + zod@^3: Form validation pair; do not use zod v4
- TanStack Query 5.x: Client-side server state cache for diary/clients/invoices; use `isPending` not `isLoading` (v5 API change)
- Zustand 5.x: Client-only UI state (active date, open modals); not for async/server state
- nuqs 2.x: URL-synced state for diary date, client search — survives page reload
- date-fns 4.x + @date-fns/tz: Timezone-aware date arithmetic; `Europe/London` named timezone handles BST/GMT transitions correctly
- papaparse (direct, not react-papaparse): CSV generation; `Papa.unparse()` with `bom: true` for Excel UTF-8

**What NOT to use:** zod v4, @supabase/auth-helpers-nextjs (deprecated), react-papaparse (stale), next-pwa (unmaintained), Prisma (bypasses Supabase RLS), Redux.

### Expected Features

Research against Fresha, Timely, Booksy, Square, Vagaro, Goldie, and GlossGenius confirmed the full competitive landscape. The feature dependency graph drives the build order: business profile and services must exist before any appointment can be booked; a client must exist before booking; an appointment must exist before an invoice; an invoice must exist before a payment; payments must exist before the cash-up screen.

**Must have (table stakes) — v1:**
- Auth (email OTP magic link) — no trust without secure login
- Business profile and working hours — required by all booking logic
- Services CRUD with duration, price, category, active/inactive toggle — required for booking
- Client CRUD with partial-match search on name/phone — required for booking; search must work within 30-second booking target
- Day diary view, appointment booking, double-booking prevention, working hours enforcement — core daily workflow
- Appointment statuses (booked, completed, cancelled, no-show) — required for financial reconciliation
- Invoice generation from appointment (one-tap) with line items and discounts — core checkout
- Payment logging (cash and card, log-only) — core checkout completion
- Daily totals dashboard (cash, card, discounts, gross) — daily reconciliation
- End-of-day cash up (float, petty cash, expected vs actual variance) — key differentiator, not in any competitor
- Client notes (general, formula, treatment types) — second differentiator for colour professionals
- Client timeline (past appointments and invoices) — expected by stylists
- CSV data export (all tables) — GDPR trust signal and data portability proof
- RLS on all tables, audit log for invoice/payment mutations — security baseline and HMRC trust signal

**Should have (competitive differentiation) — v1:**
- Per-service deposit rules (fixed £ or %) — reduces no-shows without requiring Stripe at MVP
- Client tags (allergy, preferences, custom) — low cost, high trust value; allergy tag is a safety feature
- Invoice void/refund with audit trail — professional feature; distinguishes from tools that let users corrupt their own records
- Marketing consent flag on client — UK GDPR signal

**Defer explicitly (v1.5):**
- Client self-booking portal — add once scheduling is stable
- Real card payment links (Stripe) — add once payment logging is validated
- Email and SMS reminders — email is free; SMS has cost and PECR compliance overhead
- VAT toggle per service — relevant only once users hit £90K threshold
- Recurring appointments — stylists manage these informally via diary

**Defer to v2+:**
- Multi-staff scheduling — wrong scope for solo-first product
- Inventory management — dedicated tools (Vish, SalonScale) exist
- Marketing automation — WhatsApp/Instagram DMs handle this natively for this user segment
- AI analytics — CSV export answers all real questions at this data volume
- Loyalty/rewards, POS hardware

### Architecture Approach

The architecture follows the standard Next.js App Router + Supabase pattern: async Server Components fetch data directly from Supabase (RLS filters automatically by `auth.uid()`), pass typed props to small Client Components for interactivity, and mutations go through `'use server'` Server Actions that validate with Zod, write to Supabase, then call `revalidatePath()` to bust the RSC cache. No API routes are needed. State lives on the server (Supabase) and in the RSC route cache; client state is limited to local `useState` for form inputs and modals, Zustand for cross-component UI state, and nuqs for URL-synced diary/filter state.

**Major components:**
1. `app/(auth)/` route group — unauthenticated login + magic link callback; no shell or nav
2. `app/(app)/` route group — protected app shell with bottom tab nav; four primary sections: Today (diary), Book (new appointment), Clients (CRM), Money (finance)
3. `lib/queries/` — all Supabase read operations, one file per domain, marked `server-only`; never called from client components
4. `lib/actions/` — all Supabase write operations as Server Actions with Zod validation, RLS checks, and `revalidatePath`; calls `lib/actions/audit.ts` for sensitive mutations
5. `utils/supabase/` — three client factories: `client.ts` (browser), `server.ts` (RSC/actions), `middleware.ts` (session refresh)
6. `middleware.ts` — runs on every request; calls `getUser()` (not `getSession()`), refreshes session cookie, redirects unauthenticated users
7. Supabase Postgres — 12-table schema with `owner_user_id` on every owner-scoped table; RLS enforced at DB layer; exclusion constraint on appointments prevents race-condition double-bookings
8. `app/manifest.ts` — built-in Next.js PWA manifest; no `next-pwa` or serwist required for add-to-home-screen

**Key patterns to follow:**
- Fetch in Server Components, interact in Client Components — never `useEffect` + `supabase.from()` in client code for data fetching
- One query file per domain table in `lib/queries/` — never inline Supabase calls in `page.tsx`
- All monetary values as integer pennies — never floats, never `NUMERIC(10,2)`
- `import 'server-only'` as first line of every file in `lib/queries/` and `lib/actions/`
- `TIMESTAMPTZ` for all appointment timestamps; display with `Intl.DateTimeFormat` using named timezone `Europe/London`

### Critical Pitfalls

1. **RLS not enforced on join tables** — `appointment_services`, `invoice_items`, `petty_cash_items` need sub-select policies through their parent tables. A policy that only checks `appointment_id IS NOT NULL` leaves cross-user data readable. Write and test in Sprint 1 migration 002.

2. **Double-booking race condition** — application-level overlap checks are not atomic. Two concurrent requests both pass validation and both write. Fix with a PostgreSQL exclusion constraint using `btree_gist` on `TSTZRANGE(start_at, end_at)` per `owner_user_id`. Add in the initial migrations before booking flow is built.

3. **Floating-point monetary calculations** — JavaScript `number` accumulates errors in percentage discount math. Store all monetary values as integer pennies; use `Math.round(pricePennies * percent / 100)` at the line-item level only; all subsequent sums are integer arithmetic. Schema must use `INTEGER`, never `NUMERIC(10,2)`.

4. **Supabase auth session not refreshed** — middleware must call `getUser()` (not `getSession()`) and propagate refreshed cookies on every request. `getSession()` server-side is flagged as insecure in Supabase docs and does not refresh tokens. Getting this wrong means mid-session logouts with no warning during checkout.

5. **Timezone bugs at BST/GMT transition** — UK clocks change in late March and late October. Storing `TIMESTAMP` (without timezone) makes appointment times ambiguous at DST boundaries. Use `TIMESTAMPTZ` in schema; use named timezone `Europe/London` (not `GMT+1`) for display so DST is handled automatically. Test in both winter and summer.

6. **Missing `owner_user_id` indexes** — RLS evaluates `owner_user_id = auth.uid()` on every row. Without a B-tree index, queries degrade to sequential scans around 200-500 rows per table. Silent in development; production-collapsing at real data volumes. Add indexes in migration 001 before any data exists.

7. **Paid invoice mutability** — allowing direct edits to paid invoices destroys the audit trail and breaks daily totals reconciliation. Enforce immutability in both the database (trigger on `status = 'paid'`) and the UI (no edit button for paid invoices). Corrections go through adjustment payment records.

---

## Implications for Roadmap

Based on the feature dependency graph (FEATURES.md) and the architectural build-order analysis (ARCHITECTURE.md), five phases are appropriate. All security-critical foundation decisions must be made in Phase 1 and cannot be retrofitted.

### Phase 1: Foundation and Auth

**Rationale:** Every subsequent phase depends on auth, database schema, RLS policies, and the app shell. Getting any of these wrong is expensive to fix with data in place. This is also where the eight "never shortcut" pitfalls must be addressed — pennies, TIMESTAMPTZ, indexes, exclusion constraints, join-table RLS, middleware getUser(), service price snapshots, invoice immutability rules.

**Delivers:** Working magic-link auth flow, protected route shell with bottom tab nav, complete Supabase schema (all 12 tables with RLS, indexes, and exclusion constraint), app/(auth) and app/(app) route groups, Zod validation schemas, Supabase client factories, middleware session refresh.

**Addresses (FEATURES.md):** Auth (email OTP magic link), business profile settings foundation.

**Avoids (PITFALLS.md):** All 8 critical pitfalls — RLS on join tables, race condition constraint, integer pennies schema, TIMESTAMPTZ schema, indexes, session refresh pattern.

### Phase 2: Data Setup (Services and Clients)

**Rationale:** Services and clients are required inputs before any appointment can be booked. Feature dependency graph is explicit: no services = no booking; no client = no booking. This phase also delivers onboarding — the business profile screen that captures working hours and slot size, which drive all booking logic.

**Delivers:** Business profile and working hours (settings page), services CRUD (create, edit, toggle active/inactive, deposit rules), client CRUD with partial-match search on name and phone, client profile page with tags and notes (general, formula, treatment types).

**Addresses (FEATURES.md):** Business profile setup, services catalogue, client CRUD/search, client tags, client notes.

**Avoids (PITFALLS.md):** Client search using `pg_trgm` index on `full_name` and `phone` to prevent sluggish search at 100+ clients.

### Phase 3: Booking and Diary

**Rationale:** Requires Phase 2 (services and clients exist). This is the core daily-use feature — the screen the stylist opens every morning. Double-booking prevention and working-hours enforcement must be built into this phase, not retrofitted. The slot-grid picker (custom, not native OS picker) is specified as a UX requirement.

**Delivers:** Day diary view (today-first, 15-minute slots), new appointment booking flow (client select, service select, time select, multi-service support), appointment status transitions (booked, completed, cancelled, no-show), double-booking enforcement (exclusion constraint catches race conditions; application validates for UX feedback), working-hours enforcement with override.

**Addresses (FEATURES.md):** Appointment scheduling/diary, double-booking prevention, working-hours enforcement, appointment statuses, mobile-first 375px/44px target UI.

**Avoids (PITFALLS.md):** Diary date filtering server-side (not client-side) to prevent large payload; custom slot-grid picker instead of native OS date/time picker; touch targets 44px minimum; pre-populating booking form from tapped slot.

### Phase 4: Billing and Finance

**Rationale:** Requires Phase 3 (appointments exist). Invoice is triggered from appointment completion — the one-tap checkout flow. Payment logging follows invoice creation. Daily totals and cash-up depend on payments existing. This is also where paid invoice immutability is enforced at the application layer (database constraint set in Phase 1).

**Delivers:** One-tap invoice generation from appointment (line items pre-populated from appointment_services snapshots), line-level and bill-level discounts, payment logging (cash, card, log-only), daily totals dashboard (cash/card breakdown, gross revenue), end-of-day cash-up (starting float, petty cash items, expected vs actual variance), invoice void/refund with audit trail, audit log for all sensitive mutations.

**Addresses (FEATURES.md):** Invoice generation, payment logging, daily revenue summary, end-of-day cash up (key differentiator), audit trail, discount handling.

**Avoids (PITFALLS.md):** Canonical `calculateInvoice()` pure function called in UI preview and server action (not duplicated); paid invoice immutability; discount order-of-operations consistency.

### Phase 5: Polish, Export, and PWA Hardening

**Rationale:** End-to-end flows are complete. This phase validates correctness, adds trust signals, and ensures the PWA feels native on iOS Safari. CSV export requires all tables to be populated and stable. PWA safe-area handling is an iOS-specific detail that cannot be tested until the full UI exists.

**Delivers:** CSV data export (clients, appointments, invoices, payments, notes — all tables), PWA manifest and icons, iOS safe-area insets (bottom nav clears home indicator), iOS Safari keyboard scroll handling, empty states with CTAs across all list screens, error message mapping (Postgres error codes to plain English), "Looks Done But Isn't" checklist verification (per PITFALLS.md).

**Addresses (FEATURES.md):** CSV data export, PWA (add to home screen), GDPR data portability trust signal, marketing consent flag.

**Avoids (PITFALLS.md):** iOS safe-area/keyboard UX pitfalls; CSV download tested on mobile Safari (iOS triggers differently); magic link re-request flow for expired links; Supabase OTP rate limit — configure custom SMTP before any beta testing.

### Phase Ordering Rationale

- Phases 1 through 5 follow the feature dependency graph exactly: auth before profile, profile before booking, booking before billing, billing before export.
- All infrastructure decisions that cannot be retrofitted (schema types, indexes, constraints, RLS) are in Phase 1. There is no Phase 2 equivalent — this is deliberate.
- Phases 2 and 3 are separated because a new install needs to add services and clients before any meaningful diary testing can occur. Running them as one phase would produce a bloated sprint with no testable milestone.
- Phase 4 is the largest phase by business complexity. If sprint capacity is limited, the end-of-day cash-up can move to Phase 5 without blocking the billing core (invoice + payment + daily totals).
- Phase 5 is intentionally polish-only. No new features. Attempting to ship new features alongside mobile QA and PWA hardening produces incomplete work in both areas.

### Research Flags

Phases with well-documented patterns (research-phase not needed):
- **Phase 1:** Auth setup with `@supabase/ssr` is fully documented in official Supabase docs. Schema patterns are established. No unknowns.
- **Phase 2:** CRUD with Server Actions is the default App Router pattern. Well-documented.
- **Phase 3:** Diary/booking UI is bespoke but the underlying patterns (Server Component + Client Component split, Server Actions, exclusion constraints) are all established.

Phases that may benefit from targeted research during planning:
- **Phase 4 (Cash-up feature):** No competitor has this. The UX flow for entering float, logging petty cash line items, and displaying variance is custom. May benefit from user interview or UX wireframe research before implementation.
- **Phase 5 (iOS PWA):** iOS Safari PWA behaviour (safe areas, keyboard handling, CSV download triggering) is historically inconsistent. Verify against current iOS 18.x behaviour before implementing — test on a real device, not just the simulator.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core libraries verified against official docs and npm. Version constraints (zod v3, @supabase/ssr) confirmed via active GitHub issues. One MEDIUM item: nuqs version confirmed via community sources, not official registry. |
| Features | MEDIUM-HIGH | Competitor feature sets verified via multiple independent sources (Capterra, salon business sites, official product pages). Solo-operator usage patterns extrapolated from market research — not direct user interviews. Key differentiators (cash-up, formula notes) validated as absent from all competitors surveyed. |
| Architecture | HIGH | All patterns sourced from Next.js official docs (updated 2026-02-27) and Supabase official docs. Project structure follows Supabase's own conventions for Next.js App Router. One MEDIUM item: practitioner post-mortems used to confirm anti-patterns. |
| Pitfalls | HIGH | All critical pitfalls sourced from official Supabase documentation (RLS performance, auth troubleshooting, rate limits, range columns). Floating-point and timezone pitfalls are established programming knowledge. UX pitfalls sourced from iOS Safari behaviour documented by multiple practitioners. |

**Overall confidence: HIGH**

### Gaps to Address

- **User interview validation:** The cash-up flow and colour formula notes are the two key differentiators. Both are inferred from competitive gap analysis, not confirmed user research. Validate with 2-3 target users before finalising the UX design for these screens.
- **OTP email deliverability:** Supabase free plan has a 30 email/hour rate limit. Custom SMTP must be configured before beta testing begins. Which SMTP provider (Resend, Postmark, SendGrid) and its setup is not covered by this research — decide in Phase 1.
- **PWA iOS Safari edge cases:** iOS 18.x PWA behaviour is documented but evolves with each release. The safe-area, keyboard, and CSV download handling must be tested on real hardware during Phase 5. Simulator results are not reliable for these scenarios.
- **Supabase pricing at scale:** Research confirms the architecture works at 0-1k users on the free/Pro plan. If the beta scales unexpectedly, connection pooling and composite index strategy should be reviewed before hitting 1k active stylists.
- **Zod v4 upgrade timing:** `@hookform/resolvers` v4 compatibility is actively being worked on (GitHub issues #799, #813). Monitor before and after each sprint. The upgrade is a one-line change once the resolver patch lands, but staying on v3 is the correct default until that happens.

---

## Sources

### Primary (HIGH confidence)
- [Next.js Official Docs (updated 2026-02-27)](https://nextjs.org/docs/app) — App Router patterns, RSC/Server Actions, PWA manifest, project structure
- [Supabase Auth SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — @supabase/ssr pattern, getUser() vs getSession(), cookie refresh
- [Supabase RLS Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — policy patterns, join-table RLS, performance and indexing
- [Supabase RLS Performance Docs](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — index requirements, sub-select vs correlated subquery
- [Supabase Auth Troubleshooting](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) — session refresh middleware pattern
- [Supabase Rate Limits](https://supabase.com/docs/guides/auth/rate-limits) — OTP email rate limits (30/hour on free plan)
- [Supabase Realtime — Range Columns](https://supabase.com/blog/range-columns) — exclusion constraint pattern for booking overlap
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — @tailwindcss/postcss requirement
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog) — React 19 + Tailwind v4 compatibility (February 2026)
- [Next.js PWA Official Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) — built-in manifest, no next-pwa required
- [date-fns v4.0 release](https://blog.date-fns.org/v40-with-time-zone-support/) — timezone support, @date-fns/tz

### Secondary (MEDIUM confidence)
- [Zod v4 + hookform/resolvers Issue #799, #813, #4992](https://github.com/react-hook-form/resolvers/issues/799) — TypeScript incompatibility; stay on zod v3
- [nuqs at React Advanced 2025](https://www.infoq.com/news/2025/12/nuqs-react-advanced/) — production usage at Supabase, Vercel, Sentry
- [Fresha Review 2026](https://thesalonbusiness.com/fresha-review/) — competitor features and 20% commission model
- [Booksy No-Show Protection](https://biz.booksy.com/en-us/features/no-show-protection) — 20% no-show reduction from deposits
- [GlossGenius Review 2026](https://thesalonbusiness.com/glossgenius-review/) — competitor feature parity for colour notes gap
- [Goldie hair salon software](https://heygoldie.com/customers/hairstylists) — solo-focused competitor analysis
- Capterra comparisons: Square Appointments vs Vagaro, Timely, GlossGenius — feature matrix validation
- [MakerKit Next.js Supabase Architecture](https://makerkit.dev/docs/next-supabase/architecture) — production SaaS architecture patterns
- [catjam.fi: Next.js + Supabase post-mortem](https://catjam.fi/articles/next-supabase-what-do-differently) — practitioner anti-patterns
- [imidef.com: App Router pitfalls (Feb 2026)](https://imidef.com/en/2026-02-11-app-router-pitfalls) — common Next.js mistakes
- [Annoying iOS Safari input issues (Mobiscroll)](https://blog.mobiscroll.com/annoying-ios-safari-input-issues-with-workarounds/) — keyboard/viewport UX

### Tertiary (LOW confidence)
- npm search results for version confirmation (react-hook-form 7.71.2, zustand 5.0.11, @hookform/resolvers 5.2.2, shadcn 3.8.5, date-fns 4.1.0) — cross-checked against official docs where possible; version numbers should be re-verified at install time

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
