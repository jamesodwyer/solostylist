# Solo Stylist OS (UK) PRD Pack
Version: 0.1 (MVP-first, scalable to salons later)
Owner: Founding team
Platform: Mobile-first web app (PWA)
Stack: Next.js (App Router) + React + Supabase (Postgres, Auth, RLS)
Currency: GBP (£)

---

## 1. Product Summary

### 1.1 Problem
Solo beauty professionals are overcharged by commission-heavy platforms, stuck with clunky tools, and spend too much time on admin instead of earning. The market is full of “busy but broke” operators who need a simple way to run their business from a phone.

### 1.2 Target User
- UK-based solo beauty professionals (hair, nails, brows, aesthetics, etc.)
- Mobile-first workflow, often working alone, needs speed and clarity
- Wants control: owns clients, owns data, predictable costs

### 1.3 Product Promise
Run your freelance beauty business from your phone:
- Book clients quickly
- Take payment cleanly (cash + card)
- Track money daily (card vs cash, cash up)
- Maintain client history and service notes (including colour formulas)
- Keep full ownership and portability of client data

### 1.4 Positioning
**Zero-commission, flat-fee, solo-first business OS for beauty pros.**
No surprises. No platform capture of clients.

---

## 2. Goals and Non-Goals

### 2.1 MVP Goals
- Replace the “WhatsApp + notes + calculator + Excel” chaos with one system
- Enable core operations end-to-end: booking → service delivery → checkout → daily totals → client records
- Ensure client ownership through export and transparent data access

### 2.2 MVP Non-Goals (explicitly out of scope)
- Multi-staff scheduling and permissions
- Complex inventory management
- Marketplace discovery of stylists (platform-owned client acquisition)
- AR previews, advanced AI, memberships, creator storefront
- Deep marketing automation beyond simple reminders (optional later)

---

## 3. Success Metrics (MVP)
- Booking creation: under 30 seconds (median)
- Checkout completion: under 45 seconds (median)
- Activation: 80% of new users create ≥5 clients and ≥5 appointments within 7 days
- Retention: 60% weekly active usage after week 4 (early cohort)
- Export usage: ≥25% of users successfully export within first 60 days (trust indicator)
- Churn: <8% monthly after first 3 months (early target)

---

## 4. Core Product Principles
- **Mobile-first, thumb-first**: designed for 375px width minimum
- **Low cognitive load**: fewer screens, fewer options, big tap targets
- **Client ownership**: exports, no forced client accounts, no lock-in
- **Predictable pricing**: flat monthly fee; clear policy on changes (grandfathering)
- **Data integrity**: invoices and payments are auditable

---

## 5. MVP Feature Modules (PRDs)

### 5.1 PRD 1: Core Platform, Auth, and Setup

#### Scope
- Supabase Auth using email OTP or magic links (MVP)
- Business setup:
  - Trading name
  - Contact phone
  - Optional address
  - Working hours (per weekday)
  - Default slot size (15 mins default)
- PWA basics:
  - Add-to-home-screen support
  - Offline not required, but graceful degraded experience
- Data export (CSV):
  - Clients
  - Appointments
  - Invoices + invoice items
  - Payments
  - Notes

#### User Stories
- As a stylist, I can sign in securely on my phone quickly
- As a stylist, I can set my working hours and slot length
- As a stylist, I can export my data at any time

#### Acceptance Criteria
- All tables use `owner_user_id` and RLS to restrict access to `auth.uid()`
- No unauthenticated access to business data
- Export produces valid CSV and downloads on mobile

---

### 5.2 PRD 2: Services and Pricing

#### Scope
- Service CRUD:
  - Name
  - Duration (minutes)
  - Price (£)
  - Optional category
  - Active/inactive toggle
- Per-service deposits:
  - Deposit type: fixed £ or %
  - Deposit amount
  - Deposit optional/required
  - Applies when booking flows are enabled

#### User Stories
- As a stylist, I can create services with durations and prices
- As a stylist, I can set a deposit rule per service
- As a stylist, I can hide services without deleting them

#### Acceptance Criteria
- Services appear in booking flow
- Updating a service does not alter historical invoices (store snapshots in invoice items)

---

### 5.3 PRD 3: Booking, Diary, and Appointments

#### Scope
- Diary views (mobile-first):
  - Today (default)
  - Day picker (calendar or date selector)
- Slot-based schedule:
  - 15-min increments default
  - Editable start/end times per appointment
- Appointment CRUD:
  - Select client
  - Select one or more services
  - Optional notes (appointment notes)
  - Status: booked, completed, cancelled, no-show
- Prevent double booking
- Respect working hours (with manual override allowed)

#### User Stories
- As a stylist, I can see today at a glance
- As a stylist, I can tap a free slot and book quickly
- As a stylist, I can move or cancel appointments easily
- As a stylist, I can mark no-shows

#### Acceptance Criteria
- No overlapping appointments
- Booking is possible in <30 seconds with existing client + service
- Appointment details show client info and last notes summary

---

### 5.4 PRD 4: Billing, Discounts, and Payments

#### Scope
- Invoice generation:
  - From an appointment (one tap)
  - Or standalone invoice (walk-in / misc)
- Invoice items:
  - Service items (from service list)
  - Ad hoc items (custom name + price)
- Discounts:
  - Bill-level discount: fixed £ or %
  - Line-level discount: fixed £ or %
  - Guardrails: cannot exceed the total
- Payments:
  - Cash
  - Card (logged)
  - Optional MVP card “payment link” flow
    - Generate link (Stripe payment link or hosted checkout)
    - Capture payment reference and mark as paid
- Refund / Void (MVP: admin function for the owner):
  - Record adjustment as a separate transaction (audit trail)

#### User Stories
- As a stylist, I can checkout a client quickly
- As a stylist, I can apply discounts properly
- As a stylist, I can record cash or card payments accurately
- As a stylist, I can fix mistakes with an auditable adjustment

#### Acceptance Criteria
- Paid invoices cannot be edited directly; must use adjustment note workflow
- Payment records store method, amount, timestamp, invoice_id
- Totals match invoice calculations exactly

---

### 5.5 PRD 5: Financial Tracking (Daily Totals + Cash Up)

#### Scope
- Daily totals dashboard:
  - Total revenue today
  - Cash total
  - Card total
  - Discounts total
  - Refunds/adjustments total (if present)
- End-of-day cash up:
  - Starting float
  - Petty cash withdrawals (multiple line items)
  - Expected cash
  - Actual cash
  - Variance
  - Notes

#### User Stories
- As a stylist, I can see how much I made today
- As a stylist, I can cash up quickly at the end of the day
- As a stylist, I can track petty cash usage

#### Acceptance Criteria
- Cash up calculation is consistent and transparent
- Daily report can be filtered by date
- Export includes cash up data

---

### 5.6 PRD 6: Client Records and CRM (“Second Brain”)

#### Scope
- Client profile:
  - Name (required)
  - Phone (recommended)
  - Email (optional)
  - Address (optional)
  - Marketing consent flag
- Client timeline:
  - Past appointments
  - Past invoices
- Notes:
  - General notes (free text)
  - Service notes: colour formulas / treatment records (structured + free text)
- Tags (simple):
  - Allergy
  - Preferences (silent appointment, etc.)
  - Other custom tags

#### User Stories
- As a stylist, I can search clients quickly by name or phone
- As a stylist, I can see a client’s history and notes before they arrive
- As a stylist, I can store colour formulas and treatment notes reliably

#### Acceptance Criteria
- Search is fast and forgiving (partial matches)
- Notes are visible during booking and appointment view
- Client export includes notes and timeline references

---

## 6. UX Requirements (Mobile-First)
- Minimum supported width: 375px
- Large tap targets (44px minimum)
- Clear typography, high contrast
- No critical actions hidden behind hover
- Friendly validation errors (plain language)

### Primary Nav Tabs (suggested)
- Today
- Book
- Clients
- Money
- Settings

### Key Screens
- Today diary
- New appointment
- Appointment details
- Checkout (invoice + payment)
- Client profile + notes
- Money dashboard + cash up

---

## 7. Pricing and Monetisation (Product Requirement)
MVP monetisation strategy:
- Flat monthly fee subscription
- No commission
- Card processing fees passed through at cost initially (trust play)
- Clear pricing policy:
  - No surprise increases
  - Grandfather existing customers for 12 months if pricing changes

Note: Stripe processing fees apply. Do not hide them. Trust is the differentiator.

---

## 8. Technical Requirements

### 8.1 Frontend
- Next.js App Router
- React
- Tailwind (recommended)
- PWA configuration
- Form validation (zod or equivalent)
- Error handling and empty states for all main screens

### 8.2 Backend
- Supabase Postgres
- Supabase Auth
- Row Level Security (RLS) on all tables
- Migrations stored in repo as SQL
- Seed data for testing

### 8.3 Data Ownership
- Full data export via CSV
- No forced client accounts
- No marketplace capture mechanics in MVP

### 8.4 Security
- RLS enforced everywhere
- Audit log for:
  - Invoice adjustments
  - Refunds/voids
  - Deletions of clients/appointments/invoices (if allowed)

---

## 9. Draft Database Schema (Supabase)

### Tables
- `profiles`
  - id (uuid, = auth.uid)
  - business_name
  - phone
  - address (nullable)
  - timezone (default Europe/London)
  - created_at, updated_at

- `settings`
  - owner_user_id
  - slot_minutes (default 15)
  - working_hours_json (per weekday)
  - created_at, updated_at

- `services`
  - id
  - owner_user_id
  - name
  - duration_minutes
  - price_pennies
  - category (nullable)
  - is_active
  - deposit_type (nullable: fixed|percent)
  - deposit_value (nullable)
  - deposit_required (bool default false)
  - created_at, updated_at

- `clients`
  - id
  - owner_user_id
  - full_name
  - phone (nullable)
  - email (nullable)
  - address (nullable)
  - marketing_opt_in (bool default false)
  - created_at, updated_at

- `appointments`
  - id
  - owner_user_id
  - client_id
  - start_at (timestamp)
  - end_at (timestamp)
  - status (booked|completed|cancelled|no_show)
  - notes (nullable)
  - created_at, updated_at

- `appointment_services`
  - id
  - appointment_id
  - service_id
  - service_name_snapshot
  - duration_minutes_snapshot
  - price_pennies_snapshot

- `invoices`
  - id
  - owner_user_id
  - client_id (nullable)
  - appointment_id (nullable)
  - status (draft|issued|paid|void)
  - subtotal_pennies
  - discount_pennies
  - total_pennies
  - created_at, updated_at

- `invoice_items`
  - id
  - invoice_id
  - item_type (service|custom)
  - name_snapshot
  - quantity (default 1)
  - unit_price_pennies
  - line_discount_pennies
  - line_total_pennies

- `payments`
  - id
  - owner_user_id
  - invoice_id
  - method (cash|card)
  - amount_pennies
  - provider (nullable: stripe)
  - provider_reference (nullable)
  - created_at

- `cashups`
  - id
  - owner_user_id
  - date (yyyy-mm-dd)
  - starting_float_pennies
  - petty_cash_total_pennies
  - expected_cash_pennies
  - actual_cash_pennies
  - variance_pennies
  - notes (nullable)
  - created_at

- `petty_cash_items`
  - id
  - cashup_id
  - description
  - amount_pennies

- `client_notes`
  - id
  - owner_user_id
  - client_id
  - note_type (general|formula|treatment)
  - title (nullable)
  - content
  - created_at

- `audit_log`
  - id
  - owner_user_id
  - entity_type
  - entity_id
  - action
  - before_json (nullable)
  - after_json (nullable)
  - created_at

### RLS Rules (high level)
For all tables containing `owner_user_id`:
- SELECT/INSERT/UPDATE/DELETE allowed only when `owner_user_id = auth.uid()`

For join tables:
- Enforce ownership through parent relationship checks (appointment/invoice belongs to auth.uid)

---

## 10. Build Plan (Claude Execution Order)

### Sprint 1: Foundation
- Repo scaffold + Next.js app shell
- Supabase project setup + env vars
- SQL migrations for schema
- RLS policies
- Auth flow + protected routes
- Core navigation + layout
- Services CRUD
- Clients CRUD

### Sprint 2: Booking
- Today diary view (day)
- Create/edit appointments
- Prevent double booking
- Appointment details screen

### Sprint 3: Billing and Money
- Invoice from appointment
- Invoice editor (draft)
- Discounts
- Payment logging (cash/card)
- Money dashboard (daily totals)
- Cash up + petty cash items

### Sprint 4: Polish + Export + Hardening
- Search improvements
- Client timeline
- Notes UX improvements
- CSV export screens
- Audit log for sensitive actions
- Manual QA checklist + bug bash fixes

---

## 11. Open Questions (explicit decisions to make later)
- SMS reminders (cost + compliance): defer or add in V1.5
- VAT handling: defer unless target users need it immediately
- Public client booking page and deposits collection:
  - Start internal-only booking (stylist books)
  - Add booking page in V1.5 once payments and scheduling are stable
- Tap-to-pay / card reader integrations:
  - MVP uses payment links and logs
  - V1 adds richer POS hardware support

---

## 12. Appendix: Pricing Policy Requirement (Trust Lever)
- Flat monthly subscription, no commission.
- Transparent payment processing costs.
- No surprise increases: if price changes, existing customers keep their price for 12 months.
- Cancel anytime, no lock-in.

End of PRD Pack