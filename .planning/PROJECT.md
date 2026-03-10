# Solo Stylist OS

## What This Is

A mobile-first web app (PWA) for UK-based solo beauty professionals to run their freelance business from their phone. Handles booking, payments, daily money tracking, client records with notes and colour formulas, and CSV data export — all with zero commission and flat-fee pricing.

## Core Value

A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.

## Requirements

### Validated

- ✓ Secure auth via email+password (Supabase Auth) — v1.0
- ✓ Business profile setup (trading name, phone, working hours, slot size) — v1.0
- ✓ PWA with add-to-home-screen support — v1.0
- ✓ Service CRUD with pricing, duration, categories, active/inactive toggle — v1.0
- ✓ Per-service deposit rules (fixed £ or %, optional/required) — v1.0
- ✓ Day diary view with today-first default and date picker — v1.0
- ✓ Slot-based appointment booking (15-min increments, multi-service) — v1.0
- ✓ Appointment management (book, complete, cancel, no-show, reschedule) — v1.0
- ✓ Double-booking prevention (PostgreSQL exclusion constraint) with working hours enforcement — v1.0
- ✓ Payment logging: cash and card (log-only, no Stripe integration) — v1.0
- ✓ Refund/void with audit trail (adjustment transactions) — v1.0
- ✓ Client CRUD (name, phone, email, address, marketing consent) — v1.0
- ✓ Client search (fast, partial matching by name or phone) — v1.0
- ✓ Client notes: general, colour formulas, treatment records — v1.0
- ✓ Client tags (allergy, preferences, custom) — v1.0
- ✓ Client notes visible during booking and appointment view — v1.0
- ✓ CSV data export (clients, appointments, payments, notes) — v1.0
- ✓ RLS on all tables enforcing owner_user_id = auth.uid() — v1.0
- ✓ Audit log for sensitive actions (adjustments, refunds, deletions, cancellations) — v1.0
- ✓ No unauthenticated access to business data — v1.0

### Active

(None yet — define for next milestone with `/gsd:new-milestone`)

### Out of Scope

- Multi-staff scheduling and permissions — solo-first MVP
- Complex inventory management — not core to solo workflow
- Marketplace/discovery of stylists — no platform-owned client acquisition
- AR previews, advanced AI, memberships — future features
- Deep marketing automation — beyond simple reminders, defer to v1.5
- SMS reminders — cost + compliance concerns, defer
- VAT handling — defer unless users demand it
- Public client booking page — add in v1.5 once payments stable
- Tap-to-pay / card reader integrations — MVP uses payment logs
- Stripe payment link integration — card payments are log-only for demo
- Invoice generation — deferred from v1.0 to v2 requirements
- Daily totals dashboard with cash-up — deferred from v1.0 to v2 requirements
- Client timeline (past appointments/payments history view) — partial in v1.0 (payments tab exists), full view deferred
- Settings profile editing — updateProfile action exists but no edit UI (tech debt from v1.0)

## Context

- **Shipped:** v1.0 MVP (2026-03-10)
- **Codebase:** 7,491 LOC TypeScript, Next.js 16 + Supabase + Tailwind + shadcn/ui
- **Database:** 12 tables with RLS, PostgreSQL with btree_gist exclusion constraint
- Target: UK solo beauty professionals (hair, nails, brows, aesthetics)
- Users are mobile-first, often working alone, need speed and clarity
- Users want control: own their clients, own their data, predictable costs
- Positioning: zero-commission, flat-fee, solo-first business OS
- Currency: GBP (£), all monetary values stored in pennies
- Timezone: Europe/London default (hardcoded — not yet user-configurable)

## Constraints

- **Tech stack**: Next.js 16 (App Router, proxy.ts) + React 19 + Supabase (Postgres, Auth, RLS) + Tailwind + shadcn/ui
- **Mobile-first**: Designed for 375px width minimum, 44px tap targets, no hover-dependent actions
- **Data ownership**: Full CSV export, no forced client accounts, no lock-in
- **Security**: RLS enforced everywhere, audit log for sensitive operations
- **Performance**: Booking creation < 30s median, checkout < 45s median

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | Auth + Postgres + RLS in one platform, fast to ship | ✓ Good — auth, RLS, and DB all working; JS client limitations accepted |
| shadcn/ui for components | Accessible, customisable, popular with Next.js ecosystem | ✓ Good — Sheet, Tabs, Badge, Collapsible all used heavily |
| Card payments log-only | Faster to demo without Stripe integration | ✓ Good — reduced scope, clean payment recording |
| Email+password auth (changed from magic link) | Simpler to implement; magic link requires SMTP config | ✓ Good — works for demo; magic link can be added later |
| Prices in pennies (integer) | Avoids floating point issues with currency | ✓ Good — zero float bugs across payments, refunds, CSV export |
| PWA not native app | Faster to ship, works cross-platform, add-to-home-screen | ✓ Good — works on iOS and Android |
| proxy.ts (Next.js 16) over middleware.ts | Next.js 16 deprecates middleware.ts | ✓ Good — future-proof |
| PostgreSQL exclusion constraint for double-booking | Database-level guarantee, no race conditions | ✓ Good — 23P01 caught cleanly in both create and reschedule |
| Browser Supabase client for client-side queries | RLS enforces scoping, no explicit owner_user_id needed | ✓ Good — pattern consistent across search, notes, payments |
| Supabase JS client rollback pattern (no transactions) | JS client doesn't support DB transactions | ⚠️ Revisit — works but not atomic; consider DB function for critical paths |
| zod@3 with zodResolver as any cast | @hookform/resolvers v5 incompatible with zod v4 | ⚠️ Revisit — runtime works, TS safety lost; upgrade when resolvers fixed |

---
*Last updated: 2026-03-10 after v1.0 milestone*
