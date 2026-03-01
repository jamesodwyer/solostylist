# Solo Stylist OS

## What This Is

A mobile-first web app (PWA) for UK-based solo beauty professionals to run their freelance business from their phone. Replaces the "WhatsApp + notes + calculator + Excel" chaos with one system that handles booking, payments, daily money tracking, and client records — all with zero commission and flat-fee pricing.

## Core Value

A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Secure auth via email OTP/magic links (Supabase Auth)
- [ ] Business profile setup (trading name, phone, working hours, slot size)
- [ ] PWA with add-to-home-screen support
- [ ] Service CRUD with pricing, duration, categories, active/inactive toggle
- [ ] Per-service deposit rules (fixed £ or %, optional/required)
- [ ] Day diary view with today-first default and date picker
- [ ] Slot-based appointment booking (15-min increments, multi-service)
- [ ] Appointment management (book, complete, cancel, no-show)
- [ ] Double-booking prevention with working hours enforcement
- [ ] Invoice generation from appointments (one-tap) and standalone
- [ ] Line items: service items + ad-hoc custom items
- [ ] Discounts: bill-level and line-level (fixed £ or %)
- [ ] Payment logging: cash and card (log-only for demo, no Stripe integration)
- [ ] Refund/void with audit trail (adjustment transactions)
- [ ] Daily totals dashboard (revenue, cash, card, discounts, adjustments)
- [ ] End-of-day cash up (float, petty cash, expected vs actual, variance)
- [ ] Client CRUD (name, phone, email, address, marketing consent)
- [ ] Client search (fast, partial matching by name or phone)
- [ ] Client timeline (past appointments, invoices)
- [ ] Client notes: general, colour formulas, treatment records
- [ ] Client tags (allergy, preferences, custom)
- [ ] CSV data export (clients, appointments, invoices, payments, notes)
- [ ] RLS on all tables enforcing owner_user_id = auth.uid()
- [ ] Audit log for sensitive actions (invoice adjustments, refunds, deletions)

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

## Context

- Target: UK solo beauty professionals (hair, nails, brows, aesthetics)
- Users are mobile-first, often working alone, need speed and clarity
- Users want control: own their clients, own their data, predictable costs
- Positioning: zero-commission, flat-fee, solo-first business OS
- Currency: GBP (£), all monetary values stored in pennies
- Timezone: Europe/London default
- PRD includes a draft database schema with 12 tables covering the full domain
- This is a demo build to evolve from — prioritize working features over polish

## Constraints

- **Tech stack**: Next.js (App Router) + React + Supabase (Postgres, Auth, RLS) + Tailwind + shadcn/ui
- **Mobile-first**: Designed for 375px width minimum, 44px tap targets, no hover-dependent actions
- **Data ownership**: Full CSV export, no forced client accounts, no lock-in
- **Security**: RLS enforced everywhere, audit log for sensitive operations
- **Performance**: Booking creation < 30s median, checkout < 45s median

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase for backend | Auth + Postgres + RLS in one platform, fast to ship | — Pending |
| shadcn/ui for components | Accessible, customisable, popular with Next.js ecosystem | — Pending |
| Card payments log-only | Faster to demo without Stripe integration | — Pending |
| Email OTP/magic links (no password) | Simpler UX, no password management needed | — Pending |
| Prices in pennies (integer) | Avoids floating point issues with currency | — Pending |
| PWA not native app | Faster to ship, works cross-platform, add-to-home-screen | — Pending |

---
*Last updated: 2026-03-01 after initialization*
