# Feature Research

**Domain:** Solo beauty professional business management (UK market)
**Researched:** 2026-03-01
**Confidence:** MEDIUM-HIGH (competitor feature sets verified via multiple sources; solo-specific usage patterns from market research, some community feedback extrapolated from industry analysis)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. Based on analysis of Fresha, Timely, Booksy, Square Appointments, Vagaro, GlossGenius, and Goldie.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Appointment scheduling / diary view | Core workflow — every competitor has this. "Today" view is the daily home screen. | MEDIUM | 15-min slot increments are the standard. Day-first view is expected. |
| Client booking (stylist-initiated) | Solo stylists book all their own clients; client self-booking is optional and secondary for MVP. | LOW | Internal booking is the baseline. Self-booking portal is a v1.5 feature. |
| Appointment statuses (booked / completed / cancelled / no-show) | Stylists need to record outcomes for accountability and financial reconciliation. | LOW | No-show status is critical — affects revenue tracking and future client handling. |
| Service catalogue with pricing | Users must define their services and prices before any booking is possible. | LOW | Include duration, price, category, active/inactive toggle. Snapshot on invoice required. |
| Client profiles (name, phone, email) | Stylists have regulars — they need a contact book. Every competitor includes this. | LOW | Phone is the primary field. Email is optional. Address is optional. |
| Client search (fast, partial matching) | Without fast search, client selection in booking flow is unusable on mobile. | LOW | Partial match by name or phone. Must work within 30s booking target. |
| Client appointment history | Before a client arrives, stylists check what was done last time. All competitors surface this. | LOW | Timeline of past appointments and invoices on the client card. |
| Invoice generation from appointment | One-tap checkout after completing an appointment is the expected flow. | MEDIUM | Auto-populates from appointment_services. Supports ad hoc line items. |
| Cash payment logging | Most solo UK stylists take cash. Every competitor tracks this. | LOW | Log cash received. No integration needed at MVP. |
| Card payment logging | Card payments are widespread in the UK. Log method + amount at minimum. | LOW | Log-only acceptable for MVP (no Stripe live integration required). |
| Daily revenue summary | Stylists want to know what they made today. Core feature of every product studied. | LOW | Cash total, card total, discounts, gross revenue. |
| Double-booking prevention | Overlapping appointments destroy the day. Every scheduling tool prevents this. | MEDIUM | Enforce on slot creation and edits. Manual override should be allowed with a warning. |
| Working hours enforcement | Stylists define their hours; the app should respect them in the diary. | LOW | Per-weekday hours. Allow booking outside with override (e.g. squeeze-in). |
| Business profile setup | App is useless without the stylist's trading name, contact, hours, slot size. | LOW | Done at onboarding. Editable in settings. |
| Mobile-first UI (375px, 44px targets) | Target users are on phones. A desktop-first product will be abandoned immediately. | MEDIUM | Not a feature per se, but a table stake for the user segment. |
| Secure auth | Users will not trust a business management tool with weak or absent auth. | LOW | Email OTP / magic link is acceptable and preferred over passwords for this user. |
| Data export (CSV) | Solo professionals own their clients. This is a trust signal and a table stake for UK GDPR. | LOW | Clients, appointments, invoices, payments, notes at minimum. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued. These are where Solo Stylist OS wins if it executes well.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Colour formula and treatment notes per client | Hairdressers and colourists NEED this. Competitors store general notes but few have structured colour formula fields. Dedicated apps like HairTracker and Gloss exist only for this. | MEDIUM | Note types: general, formula, treatment. Structured + free text. Show in booking and appointment views. This is the "second brain" differentiator. |
| Client tags (allergy, preferences, custom) | Allergy tags are a safety feature. "Silent appointment" preference is a differentiator. Competitors handle this as generic notes — no structured tags. | LOW | Tags are low complexity but high trust value. Allergy tag should be visually prominent. |
| End-of-day cash up with float and petty cash | No competitor in this market has this as a first-class feature. Solo stylists operating cash-heavy businesses need this. It currently lives in a notebook or spreadsheet. | MEDIUM | Starting float, petty cash line items, expected vs actual variance. This is the "business OS" claim made concrete. |
| Per-service deposit rules | Deposits reduce no-shows. Booksy shows 20% reduction in cancellations after enabling deposits. But most apps require online payment infrastructure. Solo Stylist OS can build deposit logic into the booking flow without requiring Stripe for MVP — stylist-side internal booking gets the rules; client-facing flow comes later. | MEDIUM | Deposit type (fixed £ or %), deposit required (bool), applies per-service. Reduces no-shows without requiring card-on-file. |
| Audit trail for invoice adjustments and refunds | Solo stylists are liable for their own records (HMRC). Auditable adjustments protect them. Few competitors at this price point provide this explicitly. | MEDIUM | Adjustment transactions rather than editing paid invoices. Before/after JSON in audit_log table. |
| Flat-fee pricing, zero commission, client data ownership | Fresha's 20% marketplace commission on new clients and Treatwell's model are major pain points. Solo Stylist OS's zero-commission positioning is a concrete differentiator. Fresha introduced subscription fees in 2025 — trust in "free" has eroded. | LOW (product policy) | Data portability (export) is the trust proof. Make the pricing model and data ownership explicit in-product. |
| PWA (add to home screen, feels native on phone) | Competitors like Fresha and Vagaro have native apps. A well-executed PWA provides home-screen presence without app store friction. For a UK demo launch, this avoids the App Store/Play Store review cycle. | MEDIUM | Manifest, service worker, offline-graceful. Not full offline but graceful degraded state. |
| Discounts (bill-level and line-level, fixed or %) | GlossGenius and Square do bill-level discounts. Granular line-level discounts with guardrails are rarer. Solo stylists need flexibility (e.g., discount just the colour, not the cut). | MEDIUM | Guardrail: discount cannot exceed line or bill total. Store discount_pennies on invoice and invoice_items. |
| Invoice void/refund with audit trail | Most low-end tools let you edit invoices directly, destroying history. Immutable paid invoices with adjustment workflow is a professional feature that builds trust with accountant-aware users. | MEDIUM | Paid invoice → adjustment note workflow. Refund transaction recorded separately. |
| Marketing consent flag with export | GDPR compliance signal. UK users are aware of data rights. Few solo-focused tools make this explicit. | LOW | marketing_opt_in bool. Include in client export. This is trust infrastructure. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems at solo scale. These are in scope for competitors but are noise for this product at MVP.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-staff scheduling / team management | Salons want to manage multiple stylists. Solo operators don't — it adds complexity immediately. | Entirely wrong scope for solo-first MVP. Adds permissions, staff logins, commission splits — doubles the complexity surface. Timely's per-staff pricing starts at £21/person. | Lock to single-owner model explicitly. Add team support only when a validated solo user says "I just hired someone." |
| Inventory / product management | Salons track backbar product usage. GlossGenius, Vagaro, Fresha all have inventory modules. | Solo freelancers rarely track retail stock at this level. Vish and SalonScale exist as dedicated tools. Adding inventory at MVP distracts from core booking/billing loop. | Defer entirely. If users demand it, add a simple "products" catalogue as a future module. |
| Client marketplace / discovery | Fresha and Treatwell allow clients to find stylists. This is appealing growth-wise. | 20% commission on new clients (Fresha), annual fees (Treatwell). Marketplace creates dependency on the platform. Contradicts "own your clients" positioning. | Keep direct booking (stylist-initiated). Offer public booking page in v1.5 as a non-marketplace, client-direct-to-stylist flow. |
| SMS reminders | Reduces no-shows. Every competitor offers it. | Cost (SMS has per-message fees), UK opt-in compliance requirements (PECR), and implementation complexity. GlossGenius charges for SMS above limits. Booksy bundles 100-300 SMS/month into plans. | Email reminders are free and compliant. SMS can be added in v1.5 with user demand. Mention in UI as "coming soon." |
| Loyalty / rewards programmes | Timely includes a loyalty points system. Vagaro supports memberships. | Wrong complexity level for solo MVP. Solo stylists keep loyalty informal (regulars get a discount). Building a points engine is significant engineering for low initial value. | Defer. The client tag system and notes let stylists track regulars manually. |
| Online card payments / payment links in MVP | Stripe or equivalent integration enables real card capture. | Significant compliance, security, and integration overhead (PCI, webhook handling, Stripe Connect). For a demo MVP, this increases scope massively. | Log card payments manually. Mark method as "card (logged)." Add real payment links in v1.5 once core flow is stable. |
| AI analytics / insights | GlossGenius added an AI Analyst in 2026 ("who are my highest-revenue clients?"). | Real-time AI queries require significant data infrastructure and cost. Solo stylists with < 200 clients don't need ML to answer questions that a CSV export can. | Daily totals dashboard + CSV export handles real analytics need. AI is v2+. |
| Marketing automation / email campaigns | Vagaro, Timely, GlossGenius all bundle email marketing. | Solo stylists have <200 clients. They use WhatsApp and Instagram DMs natively. Building email campaign infrastructure (templates, sends, opt-out management) is a different product entirely. | Defer to v2. If users want bulk outreach, recommend Mailchimp/MailerLite integration. |
| POS hardware (card readers, tap-to-pay) | Square and GlossGenius offer physical card readers. | Hardware adds fulfilment complexity, shipping, UK card reader certification. Not a software problem. | Log card payments manually for MVP. Tap-to-pay can be linked via Stripe in v1.5. |
| Waitlist management | Timely and Fresha offer waitlists for cancelled slots. | Solo stylists with < 20 appointments/week don't need automated waitlists. They manage by WhatsApp. | Not needed at MVP. Cancellation creates a free slot visible in the diary. |
| VAT handling / tax calculation | UK-registered businesses charge VAT. Some stylists will want this. | VAT registration threshold is £90,000 (2025). Most solo stylists are below it. Adding VAT adds invoice complexity, VAT rate management, and HMRC compliance reporting. | Defer. Add a VAT toggle and rate field per service as a v1.5 feature when users demand it. Prices stored in pennies make the calculation straightforward when needed. |
| Recurring appointments | Some clients book the same slot every N weeks. | Without a robust conflict-resolution model, recurring bookings cause bugs when working hours change or services are restructured. | Solo stylists manage recurring informally. Diary makes next booking fast. Defer recurring automation. |

---

## Feature Dependencies

```
[Business Profile / Settings]
    └──required by──> [Booking / Diary] (working hours, slot size)
    └──required by──> [Services CRUD]

[Services CRUD]
    └──required by──> [Appointment Booking] (select service)
    └──required by──> [Invoice Generation] (service items)
    └──enhances──> [Deposit Rules] (per-service deposit config)

[Client CRUD + Search]
    └──required by──> [Appointment Booking] (select client)
    └──required by──> [Invoice Generation] (client_id)
    └──enhances──> [Client Notes] (notes attach to client)
    └──enhances──> [Client Timeline] (history attaches to client)

[Appointment Booking]
    └──required by──> [Invoice Generation] (appointment → invoice one-tap)
    └──required by──> [Daily Totals] (appointments feed revenue)
    └──requires──> [Double-booking Prevention]
    └──requires──> [Working Hours Enforcement]

[Invoice Generation]
    └──required by──> [Payment Logging] (invoice_id on payment)
    └──required by──> [Audit Trail] (adjustment workflow)
    └──enhances──> [Discounts] (applied at invoice creation)

[Payment Logging]
    └──required by──> [Daily Totals] (cash + card breakdown)
    └──required by──> [Cash Up] (expected cash calculation)

[Daily Totals]
    └──enhances──> [Cash Up] (variance uses daily totals)

[Client Notes (formula, treatment, general)]
    └──requires──> [Client CRUD] (notes attach to client)
    └──enhances──> [Appointment View] (notes surfaced before appointment)

[Data Export]
    └──requires──> [All modules] (exports from all tables)
```

### Dependency Notes

- **Business Profile requires setup before anything else:** Working hours and slot size drive all booking logic. Onboarding must enforce this before allowing first appointment.
- **Services CRUD before booking:** Cannot book without at least one active service. Sprint 1 must include both.
- **Client CRUD before booking:** Cannot book without at least one client. Sprint 1 must include both.
- **Invoice before Payment:** Payments reference invoice_id. Invoice must exist before payment can be logged.
- **Payment before Cash Up:** Cash up calculation uses daily payment totals. Must be built after payment logging.
- **Deposit rules enhance but don't block booking:** Deposit configuration is per-service but the booking flow still works without it. Not a hard dependency for MVP booking flow.
- **Audit trail is independent but complements invoicing:** Can be added in a hardening sprint once invoice/payment flows are stable.
- **Client notes conflict with appointment flow if surfaced incorrectly:** Notes must appear as read-only context in appointment view, not editable in the middle of booking.

---

## MVP Definition

### Launch With (v1 — Demo Validation)

Minimum viable product — what's needed to replace the "WhatsApp + notes + calculator + Excel" chaos.

- [ ] Auth (email OTP magic link) — no business without secure login
- [ ] Business profile and settings (trading name, working hours, slot size) — required by all other flows
- [ ] Services CRUD (name, duration, price, category, deposit rules) — required for booking
- [ ] Client CRUD + search (name, phone, email, tags) — required for booking
- [ ] Day diary view + appointment booking (today-first, slot-based, multi-service) — core daily workflow
- [ ] Double-booking prevention + working hours enforcement — without this the calendar is unusable
- [ ] Appointment statuses (booked, completed, cancelled, no-show) — required for financial accuracy
- [ ] Invoice generation from appointment (one-tap) with line items + discounts — core checkout
- [ ] Payment logging (cash + card, log-only) — core checkout completion
- [ ] Daily totals dashboard (cash, card, discounts, revenue) — daily reconciliation
- [ ] End-of-day cash up (float, petty cash, expected vs actual, variance) — the key differentiator vs competitors
- [ ] Client notes (general, formula, treatment types) — second differentiator for hair/colour professionals
- [ ] Client timeline (past appointments and invoices) — expected by stylists
- [ ] CSV data export (clients, appointments, invoices, payments, notes) — trust signal, GDPR posture
- [ ] RLS on all tables + audit log for sensitive actions — security baseline

### Add After Validation (v1.5)

Features to add once core workflow is validated by real users.

- [ ] Public client self-booking page — add once scheduling is stable; requires client-facing flow and deposit collection
- [ ] Real card payment links (Stripe) — add once payment logging is validated and users want live card processing
- [ ] SMS appointment reminders — add when users request; requires cost/compliance assessment for UK
- [ ] Appointment reminders (email) — lower-cost alternative to SMS; still requires email sending infrastructure
- [ ] VAT toggle per service — add when users hit £90K threshold or request it explicitly
- [ ] Recurring appointments — add when diary adoption is proven and booking volume justifies automation

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Multi-staff / team scheduling — only when a validated solo user grows to hiring
- [ ] Inventory management — only if users explicitly request retail tracking
- [ ] Marketing automation (email campaigns) — only if users ask for outbound; Mailchimp integration preferred
- [ ] AI analytics — only when data volume makes queries meaningful
- [ ] POS hardware / tap-to-pay — requires hardware fulfilment partnership
- [ ] Loyalty / rewards — only if retention data shows it matters

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Appointment booking / diary | HIGH | MEDIUM | P1 |
| Client CRUD + search | HIGH | LOW | P1 |
| Services CRUD | HIGH | LOW | P1 |
| Invoice generation (one-tap) | HIGH | MEDIUM | P1 |
| Payment logging (cash + card) | HIGH | LOW | P1 |
| Daily totals dashboard | HIGH | LOW | P1 |
| End-of-day cash up | HIGH | MEDIUM | P1 — key differentiator |
| Client notes (formula, treatment) | HIGH | MEDIUM | P1 — key differentiator |
| Auth + security (RLS) | HIGH | LOW | P1 |
| Double-booking prevention | HIGH | MEDIUM | P1 |
| CSV data export | MEDIUM | LOW | P1 — trust signal |
| Client tags (allergy, preferences) | MEDIUM | LOW | P1 — low cost, high trust value |
| Per-service deposit rules | MEDIUM | MEDIUM | P1 — differentiates from free tools |
| Audit trail for adjustments | MEDIUM | MEDIUM | P1 — HMRC trust signal |
| Business profile / settings | HIGH | LOW | P1 — required for onboarding |
| Public self-booking page | MEDIUM | HIGH | P2 |
| Email reminders | MEDIUM | MEDIUM | P2 |
| SMS reminders | MEDIUM | HIGH (compliance) | P2 |
| VAT handling | LOW | MEDIUM | P3 |
| Inventory management | LOW | HIGH | P3 |
| Marketing automation | LOW | HIGH | P3 |
| AI analytics | LOW | HIGH | P3 |
| Loyalty / rewards | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Fresha | Timely (UK) | Booksy | Square Appointments | Vagaro | Goldie | Solo Stylist OS (our approach) |
|---------|--------|-------------|--------|---------------------|--------|--------|-------------------------------|
| Appointment diary | Yes | Yes | Yes | Yes | Yes | Yes | Yes — today-first mobile view |
| Multi-service booking | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Client profiles | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Client self-booking | Yes (marketplace) | Yes | Yes (marketplace) | Yes | Yes (marketplace) | Yes | No (v1.5) |
| No-show deposits | Yes | Yes | Yes (strong feature) | Yes | Yes | Yes | Yes — per-service deposit rules |
| Payment logging (cash/card) | Yes | Yes | Yes | Yes (POS) | Yes (POS) | Yes | Yes — log-only for MVP |
| Daily totals / reporting | Yes | Yes | Yes | Yes | Yes | Basic | Yes |
| End-of-day cash up | No (notable gap) | No | No | No | No | No | YES — key differentiator |
| Colour formula notes | No (generic notes) | No (generic notes) | No | No | No | No | YES — structured note types |
| Client tags (allergy etc.) | Partial | Partial | No | No | No | No | YES — allergy, preferences, custom |
| CSV data export | Limited | Limited | No | Partial | Partial | No | YES — full export, trust signal |
| Commission on clients | 20% (marketplace new clients) | No | No | No | No | No | ZERO — flat fee |
| Flat-fee solo pricing | No (per staff + marketplace %) | £21/staff/month | Yes | Free / $29+ | $23.99/month | $19/month | Yes — flat monthly, no commission |
| SMS reminders | Yes | Yes (bundled) | Yes | Yes (paid) | Yes | Yes | No (v1.5) |
| Email reminders | Yes | Yes | Yes | Yes | Yes | Yes | No (v1.5) |
| Inventory management | Yes | Yes | No | Yes | Yes | No | NO — explicitly out of scope |
| Marketing automation | Yes | Yes | Yes | Partial | Yes | No | NO — explicitly out of scope |
| Multi-staff | Yes | Yes | Yes | Yes | Yes | Yes | NO — solo only |
| VAT handling | Yes | Yes | No | Partial | Partial | No | NO (v1.5) |
| Mobile app / PWA | Native app | Native app | Native app | Native app | Native app | Native app | PWA — add to home screen |
| Audit trail | No | No | No | No | No | No | YES — HMRC trust signal |

---

## Sources

- Fresha features and pricing: [The Ultimate Fresha Review 2026](https://thesalonbusiness.com/fresha-review/), [Fresha pricing page](https://www.fresha.com/pricing), [JENA vs Fresha comparison](https://www.jena.so/compare/fresha-vs-jena)
- Timely UK features and pricing: [Timely Review 2025](https://www.medesk.net/en/blog/timely-review/), [Timely on Capterra](https://www.capterra.com/p/142756/Timely/), [Scratch Magazine: 55,000 beauty businesses](https://www.scratchmagazine.co.uk/feature/discover-the-software-that-over-55000-beauty-businesses-rely-on-daily/)
- Booksy no-show features: [Booksy No-Show Protection](https://biz.booksy.com/en-us/features/no-show-protection), [Booksy no-show reduction data](https://biz.booksy.com/en-us/blog/use-booksy-to-reduce-no-shows-and-cancellations)
- Square Appointments vs Vagaro: [Capterra comparison 2026](https://www.capterra.com/compare/153752-170263/Vagaro-vs-Square-Appointments), [Fit Small Business comparison](https://fitsmallbusiness.com/vagaro-vs-square/)
- Vagaro features and pricing: [Vagaro Pricing Guide 2026](https://pabau.com/blog/vagaro-pricing/), [Vagaro best booth renter software](https://www.vagaro.com/learn/best-booth-renter-software-2025)
- GlossGenius features: [GlossGenius Review 2026](https://thesalonbusiness.com/glossgenius-review/), [GlossGenius on Capterra](https://www.capterra.com/p/174830/GlossGenius/)
- Goldie features: [Goldie hair salon software](https://heygoldie.com/customers/hairstylists), [Goldie vs Vagaro](https://heygoldie.com/blog/best-vagaro-alternative)
- Treatwell UK: [Treatwell partners page](https://www.treatwell.co.uk/partners/), [SoftwareAdvice Treatwell](https://www.softwareadvice.co.uk/software/146428/treatwell-connect)
- Colour formula tools: [HairTracker](https://hairtracker.app/), [Gloss app](https://glossapp.club/), [Vish](https://getvish.com/)
- UK market and solo operator context: [Best Salon Booking Software UK 2025](https://www.websitesforsalons.co.uk/blog/best-salon-booking-software-comparison-2025), [Booksy UK small business guide](https://biz.booksy.com/en-gb/blog/how-to-find-the-best-salon-software-for-small-businesses-features-to-consider)
- General market landscape: [Best Salon Booking Apps 2025 roundup](https://www.femaleswitch.com/playbook/tpost/best-salon-booking-and-scheduling-apps-in-2025), [Top 10 Salon Booking Apps 2026](https://www.inventcolabssoftware.com/blog/best-salon-booking-apps/)

---
*Feature research for: Solo beauty professional business management (UK, solo-first)*
*Researched: 2026-03-01*
