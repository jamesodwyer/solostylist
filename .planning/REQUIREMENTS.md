# Requirements: Solo Stylist OS

**Defined:** 2026-03-01
**Core Value:** A solo stylist can book a client, check them out, and see their daily takings — all from their phone in under a minute per transaction.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Setup

- [x] **AUTH-01**: User can sign in securely via email and password
- [x] **AUTH-02**: User can set up business profile (trading name, phone, optional address)
- [x] **AUTH-03**: User can configure working hours per weekday
- [x] **AUTH-04**: User can set default appointment slot size (15-min default)
- [x] **AUTH-05**: App supports PWA add-to-home-screen on mobile

### Services

- [x] **SERV-01**: User can create services with name, duration, and price
- [x] **SERV-02**: User can assign optional categories to services
- [x] **SERV-03**: User can toggle services active/inactive without deleting
- [x] **SERV-04**: User can set per-service deposit rules (fixed £ or %, optional/required)

### Booking & Diary

- [x] **BOOK-01**: User can view today's diary with slot-based schedule
- [x] **BOOK-02**: User can navigate to other days via date picker
- [x] **BOOK-03**: User can create appointments by selecting client and one or more services
- [x] **BOOK-04**: User can add notes to appointments
- [x] **BOOK-05**: User can update appointment status (booked, completed, cancelled, no-show)
- [x] **BOOK-06**: User can move or reschedule appointments
- [x] **BOOK-07**: System prevents double-booking (PostgreSQL exclusion constraint)
- [x] **BOOK-08**: Appointments respect working hours with manual override option

### Payments

- [x] **PAY-01**: User can record a cash payment against a client/appointment
- [x] **PAY-02**: User can record a card payment against a client/appointment (log only)
- [x] **PAY-03**: Payment records store method, amount, timestamp
- [x] **PAY-04**: User can record refund/void as adjustment transaction (audit trail)

### Clients & CRM

- [x] **CLNT-01**: User can create clients with name (required), phone, email, address
- [x] **CLNT-02**: User can set marketing consent flag per client
- [x] **CLNT-03**: User can search clients by name or phone (partial matching)
- [x] **CLNT-04**: User can view client timeline (past appointments, payments)
- [x] **CLNT-05**: User can add general notes to clients (free text)
- [x] **CLNT-06**: User can store colour formulas and treatment notes per client
- [x] **CLNT-07**: User can tag clients (allergy, preferences, custom tags)
- [x] **CLNT-08**: Notes are visible during booking and appointment view

### Data & Security

- [x] **DATA-01**: All tables use RLS enforcing owner_user_id = auth.uid()
- [x] **DATA-02**: User can export clients, appointments, payments, and notes as CSV
- [x] **DATA-03**: Audit log tracks sensitive actions (adjustments, refunds, deletions)
- [x] **DATA-04**: No unauthenticated access to business data

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Invoicing & Billing

- **INV-01**: User can generate invoice from appointment (one-tap)
- **INV-02**: User can create standalone invoices (walk-in / misc)
- **INV-03**: Invoice items include service snapshots and ad-hoc custom items
- **INV-04**: User can apply bill-level discounts (fixed £ or %)
- **INV-05**: User can apply line-level discounts (fixed £ or %)
- **INV-06**: Paid invoices cannot be edited directly (immutability)

### Financial Tracking

- **FIN-01**: User can view daily revenue totals (cash, card, discounts)
- **FIN-02**: User can perform end-of-day cash up (float, petty cash, variance)
- **FIN-03**: User can track petty cash withdrawals
- **FIN-04**: Daily report can be filtered by date

### Notifications & Reminders

- **NOTF-01**: User receives appointment confirmation emails
- **NOTF-02**: User can send appointment reminder to client

### Stripe Integration

- **STRP-01**: User can generate Stripe payment link for card payments
- **STRP-02**: System captures payment reference and marks as paid

### Public Booking

- **PUB-01**: Clients can self-book via public booking page
- **PUB-02**: Deposits collected via Stripe at booking time

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-staff scheduling | Solo-first MVP — no team management |
| Complex inventory management | Not core to solo beauty workflow |
| Marketplace/stylist discovery | No platform-owned client acquisition |
| AR previews, advanced AI | Future features, not MVP |
| Deep marketing automation | Beyond simple reminders, defer to v1.5+ |
| SMS reminders | Cost + UK compliance concerns |
| VAT handling | Defer unless users demand it |
| Tap-to-pay / card readers | MVP uses payment logs only |
| Memberships / subscriptions (client-facing) | Too complex for MVP |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 2 | Complete (02-01) |
| AUTH-03 | Phase 2 | Complete (02-01) |
| AUTH-04 | Phase 2 | Complete (02-01) |
| AUTH-05 | Phase 1 | Complete |
| SERV-01 | Phase 2 | Complete (02-02) |
| SERV-02 | Phase 2 | Complete (02-02) |
| SERV-03 | Phase 2 | Complete (02-02) |
| SERV-04 | Phase 2 | Complete (02-02) |
| BOOK-01 | Phase 3 | Complete (03-02) |
| BOOK-02 | Phase 3 | Complete (03-02) |
| BOOK-03 | Phase 3 | Complete (03-01, 03-03) |
| BOOK-04 | Phase 3 | Complete (03-01, 03-03) |
| BOOK-05 | Phase 3 | Complete (03-01, 03-03) |
| BOOK-06 | Phase 3 | Complete (03-01, 03-03) |
| BOOK-07 | Phase 3 | Complete (03-01) |
| BOOK-08 | Phase 3 | Complete (03-01, 03-03) |
| PAY-01 | Phase 4 | Complete (04-01) |
| PAY-02 | Phase 4 | Complete (04-01) |
| PAY-03 | Phase 4 | Complete (04-01) |
| PAY-04 | Phase 4 | Complete (04-02, 04-03) |
| CLNT-01 | Phase 2 | Complete (02-03) |
| CLNT-02 | Phase 2 | Complete (02-03) |
| CLNT-03 | Phase 2 | Complete (02-03) |
| CLNT-04 | Phase 2 | Complete (02-04) |
| CLNT-05 | Phase 2 | Complete (02-04) |
| CLNT-06 | Phase 2 | Complete (02-04) |
| CLNT-07 | Phase 2 | Complete (02-04) |
| CLNT-08 | Phase 6 | Complete |
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 5 | Complete |
| DATA-03 | Phase 5 | Complete |
| DATA-04 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-10 after milestone audit gap closure (AUTH-01→Phase 6, CLNT-08→Phase 7, 8 stale Pending entries fixed)*
