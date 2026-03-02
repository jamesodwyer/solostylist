# Roadmap: Solo Stylist OS

## Overview

Five phases following the feature dependency graph: a secure foundation must exist before setup, setup before booking, booking before payments, and all of the above before export and polish can be verified. Every phase delivers a complete, testable capability. All infrastructure decisions that cannot be retrofitted (schema types, RLS, indexes, exclusion constraints) land in Phase 1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Supabase schema, RLS, app shell, and magic-link auth
- [ ] **Phase 2: Setup** - Business profile, services catalogue, and client CRM
- [ ] **Phase 3: Booking** - Day diary, appointment creation, and scheduling rules
- [ ] **Phase 4: Payments** - Payment logging, refunds, and audit trail
- [ ] **Phase 5: Polish** - CSV export, PWA hardening, and data security verification

## Phase Details

### Phase 1: Foundation
**Goal**: The app exists, is secure by default, and a user can sign in on their phone
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-05, DATA-01, DATA-04
**Success Criteria** (what must be TRUE):
  1. User can request a magic link, click it on their phone, and land in the protected app shell
  2. App can be added to iPhone or Android home screen via add-to-home-screen prompt
  3. All 12 database tables exist with RLS policies — no row is accessible unless owner_user_id matches the authenticated user
  4. An unauthenticated request to any protected route redirects to the login page
**Plans**: 3 plans
- [x] 01-01-PLAN.md — Project bootstrap + database schema (all 12 tables, RLS, btree_gist)
- [x] 01-02-PLAN.md — Authentication flow (Supabase SSR, magic link, middleware protection)
- [x] 01-03-PLAN.md — App shell + PWA (bottom nav, placeholder pages, manifest, install banner)

### Phase 2: Setup
**Goal**: A stylist has set up their business and entered enough data to book an appointment
**Depends on**: Phase 1
**Requirements**: AUTH-02, AUTH-03, AUTH-04, SERV-01, SERV-02, SERV-03, SERV-04, CLNT-01, CLNT-02, CLNT-03, CLNT-04, CLNT-05, CLNT-06, CLNT-07, CLNT-08
**Success Criteria** (what must be TRUE):
  1. User can complete business profile setup (trading name, phone, working hours, slot size) after first sign-in
  2. User can create, edit, and deactivate services — each with duration, price, category, and deposit rule
  3. User can create a client, add notes (general, colour formula, treatment), tag them, and find them in under 3 seconds by partial name or phone
  4. Client notes and tags are visible when viewing a client record
**Plans**: 5 plans
- [x] 02-01-PLAN.md — Shared UI components, types, utilities + onboarding wizard (Wave 1)
- [x] 02-02-PLAN.md — Services catalogue with categories, swipe gestures, deposit config (Wave 2)
- [x] 02-03-PLAN.md — Client list with search, A-Z headers, add-client sheet (Wave 2)
- [x] 02-04-PLAN.md — Client detail page with tabs, notes timeline, colour formulas, tags (Wave 3)
- [x] 02-05-PLAN.md — Human verification checkpoint for complete Phase 2 (Wave 4)

### Phase 3: Booking
**Goal**: A stylist can book any client for any service on any day from the diary
**Depends on**: Phase 2
**Requirements**: BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08
**Success Criteria** (what must be TRUE):
  1. User opens the app and sees today's diary in slot-based layout defaulting to the current time
  2. User can book an appointment by selecting a client, one or more services, and a time slot — and the appointment appears in the diary
  3. The system rejects a booking that overlaps an existing appointment and shows an error
  4. User can mark an appointment as completed, cancelled, or no-show from the diary
  5. User can reschedule an appointment by moving it to a different slot or day
**Plans**: 4 plans
- [x] 03-01-PLAN.md — Appointment types, Server Actions, diary utilities (Wave 1)
- [x] 03-02-PLAN.md — Diary page, CSS Grid slot layout, date navigation (Wave 2)
- [ ] 03-03-PLAN.md — Booking sheet, appointment detail sheet, status management (Wave 3)
- [ ] 03-04-PLAN.md — Human verification checkpoint for complete Phase 3 (Wave 4)

### Phase 4: Payments
**Goal**: A stylist can take money for a completed appointment and see it recorded correctly
**Depends on**: Phase 3
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Success Criteria** (what must be TRUE):
  1. User can log a cash or card payment against a completed appointment with method, amount, and timestamp recorded
  2. User can record a refund or void against a paid appointment — the original payment remains and an adjustment entry is created
  3. Every payment and adjustment record carries a timestamp and is visible in the client's history
**Plans**: TBD

### Phase 5: Polish
**Goal**: The app is safe to hand to a real stylist — data is portable, security is audited, and mobile UX is verified
**Depends on**: Phase 4
**Requirements**: DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. User can export all their data (clients, appointments, payments, notes) as CSV files that open correctly in Excel
  2. Every sensitive action (invoice adjustment, refund, deletion) appears in the audit log with user ID and timestamp
  3. The app works correctly on iOS Safari as a home-screen PWA — bottom nav clears the home indicator, keyboard does not trap scroll
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-03-01 |
| 2. Setup | 5/5 | Complete | 2026-03-01 |
| 3. Booking | 2/4 | In progress | - |
| 4. Payments | 0/? | Not started | - |
| 5. Polish | 0/? | Not started | - |
