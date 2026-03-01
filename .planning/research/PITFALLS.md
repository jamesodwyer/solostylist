# Pitfalls Research

**Domain:** Mobile-first PWA for solo beauty professional business management (Next.js + Supabase)
**Researched:** 2026-03-01
**Confidence:** HIGH (most findings verified against Supabase official docs and multiple independent sources)

---

## Critical Pitfalls

### Pitfall 1: RLS Enabled on Direct Tables but Not Enforced on Join Tables

**What goes wrong:**
The `appointment_services` table links appointments to services. Its RLS policy must verify that the parent appointment belongs to `auth.uid()`. If the policy only checks `appointment_id IS NOT NULL` rather than doing a join to `appointments.owner_user_id = auth.uid()`, any authenticated user can read or insert rows for anyone else's appointments.

**Why it happens:**
The natural reflex is to put `owner_user_id` on every table and call it done. Join/child tables often do not have their own `owner_user_id` column, so developers skip RLS on them entirely or write a trivially weak policy that just checks the FK is non-null.

**How to avoid:**
Write a sub-select policy on join tables:
```sql
-- appointment_services: enforce through parent
CREATE POLICY "owner_via_appointment" ON appointment_services
  FOR ALL USING (
    appointment_id IN (
      SELECT id FROM appointments
      WHERE owner_user_id = (SELECT auth.uid())
    )
  );
```
The `SELECT auth.uid()` wrapper (not bare `auth.uid()`) is the caching-optimised form per Supabase documentation. Apply the same pattern to `invoice_items` (via `invoices`) and `petty_cash_items` (via `cashups`).

**Warning signs:**
- You can query `appointment_services` rows from a second test account and get results back.
- The Supabase database advisor's Security Linter flags tables with no policies.
- Direct SQL editor tests pass (they run as `postgres` superuser and bypass RLS — never trust them for security testing).

**Phase to address:** Sprint 1 / Foundation — RLS migration must be written and verified before any feature work begins.

---

### Pitfall 2: Double-Booking Race Condition Not Handled at Database Level

**What goes wrong:**
Application code checks for slot availability, then inserts the appointment. Between the SELECT and the INSERT, a concurrent request from the same user (or a network retry) creates a second appointment for the same slot. The overlap check passes for both requests because neither has committed yet.

**Why it happens:**
Application-level checks are not atomic. Two simultaneous `POST /appointments` requests both read "slot free", both pass validation, both write — resulting in two overlapping rows.

**How to avoid:**
Use a PostgreSQL **exclusion constraint** with the `btree_gist` extension. This enforces overlap prevention at the database level, making it impossible for two appointments to overlap regardless of application concurrency:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING GIST (
    owner_user_id WITH =,
    TSTZRANGE(start_at, end_at, '[)') WITH &&
  )
  WHERE (status NOT IN ('cancelled', 'no_show'));
```

This constraint only applies to active bookings, handles the race condition atomically, and surfaces a constraint violation error the application can catch and return to the user as a friendly message.

**Warning signs:**
- Overlap prevention lives only in a TypeScript function, not in a migration.
- Stress-testing with two simultaneous booking requests produces duplicate rows.
- `EXPLAIN ANALYZE` on booking queries shows no GiST index on the time range columns.

**Phase to address:** Sprint 2 / Booking — add the constraint in the same migration that creates the `appointments` table, before booking flow is wired up.

---

### Pitfall 3: Floating Point Used Anywhere in Financial Calculations

**What goes wrong:**
A discount of 10% on a £12.50 service produces `1.2499999999999998` in floating-point arithmetic. Displayed as `£1.25` it looks fine; stored as a float it produces pennies-off totals. When you then sum a day's revenue the errors accumulate.

**Why it happens:**
JavaScript's `number` type is IEEE 754 double-precision float. Developers often compute a percentage discount as `price * (discount / 100)` using plain numbers, then round only at display time — but the rounded display value is never what was stored or summed.

**How to avoid:**
- Store every monetary value as an **integer (pennies)** in Postgres — already specified in the PRD (`price_pennies`, `amount_pennies`, etc). Never deviate.
- In TypeScript, receive and send all monetary values as integers. Never convert to float for intermediate calculations.
- For percentage discounts, calculate in pennies: `Math.round(pricePennies * depositPercent / 100)`. The only rounding operation is this `Math.round` at the line-item level. All subsequent totals are integer sums.
- `line_total_pennies = unit_price_pennies * quantity - line_discount_pennies` — integer arithmetic only.
- `total_pennies = subtotal_pennies - discount_pennies` — integer arithmetic only.

**Warning signs:**
- Any monetary field typed as `NUMERIC(10,2)` or `DECIMAL` in the schema instead of `INTEGER`.
- TypeScript code that calls `parseFloat()` or `/100` before doing arithmetic.
- A daily totals screen that rounds to 2 decimal places but the underlying sum is not a whole-penny integer.

**Phase to address:** Sprint 1 / Foundation (schema design) and Sprint 3 / Billing — enforce in schema migrations and in the billing calculation utility functions before any invoice logic is written.

---

### Pitfall 4: Discount Calculation Order Produces Inconsistent Totals

**What goes wrong:**
The invoice has both line-level and bill-level discounts. The order of operations matters:
1. Line discount applied first, producing `line_total_pennies`
2. All `line_total_pennies` summed to `subtotal_pennies`
3. Bill-level discount applied to `subtotal_pennies` to produce `total_pennies`

If code applies bill-level discount to the pre-line-discount subtotal, or stores `subtotal_pennies` inconsistently, the numbers on the invoice do not match what was recorded in `payments`.

**Why it happens:**
The billing logic is spread across the frontend (display), a server action (persist), and a potential Postgres function (verify), and the three implementations diverge.

**How to avoid:**
Write one canonical pure function `calculateInvoice(items, billDiscountPennies): InvoiceTotals` and call it everywhere — in the UI preview, in the server action before insert, and test it against the stored values after insert. Never recalculate from stored line items independently in a different code path.

**Warning signs:**
- The displayed total on the checkout screen differs from what is recorded in `invoices.total_pennies` by even 1p.
- "Checkout completed" but `payments.amount_pennies` does not equal `invoices.total_pennies` for the same invoice.
- Tests of the calculation function are not part of the test suite.

**Phase to address:** Sprint 3 / Billing — write and test `calculateInvoice` before the invoice UI is built.

---

### Pitfall 5: Supabase Auth Session Not Properly Refreshed in Next.js Middleware

**What goes wrong:**
Server Components cannot write cookies. If middleware does not refresh the session token and propagate updated cookies on every request, tokens silently expire during a work session. The stylist is mid-checkout and gets logged out with no warning, losing unsaved state.

**Why it happens:**
The Supabase SSR docs require a specific middleware pattern using `@supabase/ssr`. Many tutorials show `supabase.auth.getSession()` in middleware but Supabase explicitly flags this as insecure in server contexts — the session is read from cookies which can be spoofed. `supabase.auth.getUser()` must be used instead, which makes a network round-trip to verify the token.

**How to avoid:**
Follow the official `@supabase/ssr` middleware pattern exactly:
- Use `createServerClient` from `@supabase/ssr` with `cookies()` in middleware.
- Call `supabase.auth.getUser()` (not `getSession()`) in middleware to both refresh and validate.
- The middleware must call `response.cookies.set` to propagate the refreshed token back to the browser.
- Protect all routes under `/app/*` via the middleware matcher. Do not rely on per-page session checks.

**Warning signs:**
- Auth logic uses `getSession()` anywhere server-side.
- Refreshing the page after 30+ minutes of inactivity shows a blank or broken state rather than redirect to login.
- The `middleware.ts` file's cookie propagation block was deleted because "it seemed unnecessary."

**Phase to address:** Sprint 1 / Foundation — auth middleware is the first thing to get right, before any protected routes exist.

---

### Pitfall 6: Timezone Handling — Storing Wall-Clock Times Instead of UTC

**What goes wrong:**
The stylist's appointments are stored as wall-clock times (e.g. `09:00 Europe/London`). In March or October, when the UK clock changes between GMT and BST, an appointment stored as `2026-03-29T09:00:00` without timezone info is ambiguous — the system cannot know whether it was booked in GMT or BST. The diary view shifts by an hour. A customer booked for 9am arrives to find the appointment shows as 8am or 10am.

**Why it happens:**
Developers test in winter (GMT), ship in summer (BST), or vice versa. PostgreSQL's `TIMESTAMP WITHOUT TIME ZONE` stores what you give it. JavaScript's `new Date()` uses the browser's local timezone, creating an implicit conversion that breaks when the server timezone differs.

**How to avoid:**
- Use `TIMESTAMPTZ` (timestamp with time zone) for all `start_at` / `end_at` columns. Postgres stores UTC internally and returns the correct absolute instant.
- All API inputs/outputs use ISO 8601 with explicit timezone offset or `Z` suffix.
- Display formatting uses the `Intl.DateTimeFormat` API with `timeZone: 'Europe/London'` (the named timezone, not `GMT+1`). Named timezones auto-adjust for DST; fixed offsets do not.
- Business hours in `settings.working_hours_json` store times as `HH:MM` strings (wall-clock) with the assumption they are in `Europe/London`. When computing available slots, convert wall-clock hours to UTC using the `date-fns-tz` or `Temporal` API before comparing against `TIMESTAMPTZ` values.

**Warning signs:**
- Schema shows `TIMESTAMP` (not `TIMESTAMPTZ`) on `appointments.start_at` / `end_at`.
- Slot availability is computed by string-comparing `HH:MM` without timezone context.
- Appointments show correctly in winter but shift by one hour in summer (or vice versa).

**Phase to address:** Sprint 1 / Foundation (schema) and Sprint 2 / Booking (slot computation logic).

---

### Pitfall 7: Missing Index on `owner_user_id` — Silent Performance Collapse at Scale

**What goes wrong:**
Every RLS policy checks `owner_user_id = auth.uid()`. Without an index, Postgres performs a full sequential table scan on every query, even for tables with hundreds of rows. The app feels fast in development (< 50 rows) and starts timing out in production (500+ rows per stylist).

**Why it happens:**
`owner_user_id` is not the primary key, so Postgres does not index it automatically. Supabase schema designers often add the column and write the RLS policy but forget the `CREATE INDEX` statement.

**How to avoid:**
Add a B-tree index on `owner_user_id` on every table that has one:
```sql
CREATE INDEX ON appointments (owner_user_id);
CREATE INDEX ON clients (owner_user_id);
CREATE INDEX ON invoices (owner_user_id);
CREATE INDEX ON payments (owner_user_id);
-- etc. for all tables with owner_user_id
```

For the `audit_log` table, also index `(owner_user_id, created_at DESC)` since it will be queried chronologically.

Also index foreign key columns used in join-table RLS sub-selects: `appointment_services.appointment_id`, `invoice_items.invoice_id`, `petty_cash_items.cashup_id`.

**Warning signs:**
- The Supabase Dashboard Performance Advisor reports "no index on column used in RLS policy."
- `EXPLAIN ANALYZE` on any query involving `owner_user_id` shows `Seq Scan` rather than `Index Scan`.
- Response times for simple list queries degrade as the stylist's data grows.

**Phase to address:** Sprint 1 / Foundation — include all indexes in the initial migration file.

---

### Pitfall 8: Paid Invoice Mutability — Editing Financial Records After Payment

**What goes wrong:**
An invoice is marked `paid`. The stylist then edits a service price or applies a retroactive discount directly on the invoice. The stored `total_pennies` changes but the `payments.amount_pennies` record still reflects the original amount. The audit trail is broken; daily totals and exports are wrong.

**Why it happens:**
It is tempting to make everything editable. "Just update the row" seems simpler than an adjustment workflow. The problem is only visible later when totals do not reconcile.

**How to avoid:**
- Enforce in the database: paid invoices (`status = 'paid'`) cannot be updated or deleted via direct row access. Use a Postgres trigger that raises an exception if `status` is already `'paid'` and the caller is not an elevated function.
- The only permitted operation on a paid invoice is recording an adjustment `payment` row with a negative `amount_pennies` (refund). This creates the audit trail.
- In the UI, the edit button is not shown for paid invoices. The only options are "Issue Refund" and "View."
- The `audit_log` must capture `before_json` and `after_json` for every invoice status transition.

**Warning signs:**
- The invoice edit screen is accessible for invoices with `status = 'paid'`.
- No database trigger or RLS update restriction on paid invoices.
- Daily totals can be changed retroactively by editing past invoices.

**Phase to address:** Sprint 3 / Billing — enforce immutability rules when invoice status transitions are built.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip exclusion constraint, check overlap in app code only | Faster to ship | Race condition allows double-bookings under concurrent load | Never — use the constraint from day one |
| Use `TIMESTAMP` instead of `TIMESTAMPTZ` | Slightly simpler | Clock-change bugs every March and October, silent data corruption | Never |
| Store prices as `NUMERIC(10,2)` instead of pennies | Familiar format | Floating point errors accumulate in totals and tax calculations | Never |
| Use `getSession()` instead of `getUser()` in server code | No extra network call | Auth token bypass — security vulnerability | Never |
| Skip `owner_user_id` indexes | Simpler migration | Slow queries collapse production performance at modest row counts | Never |
| Hardcode `owner_user_id` in application code rather than deriving from `auth.uid()` in RLS | Seems safe | Client can send any UUID; only DB-enforced RLS is trustworthy | Never — RLS must be the final enforcer |
| Skip service price snapshots on `invoice_items` | Simpler schema | Editing a service price retroactively changes the display of old invoices | Never — snapshot at invoice creation |
| Allow invoice edits post-payment | Simpler UX | Audit trail is broken; revenue reports are untrustworthy | Never — use adjustment records |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + Next.js middleware | Using `getSession()` server-side | Use `getUser()` in middleware; `getSession()` only client-side |
| Supabase Auth magic link / OTP | Not handling email scanner pre-fetch | Magic link should be single-use; show clear "link already used" message with re-request option |
| Supabase Auth OTP rate limits | Free plan: 30 emails/hour by default | Configure custom SMTP before going live; default limit will block beta testers |
| Supabase RLS + SQL Editor testing | Testing in SQL Editor bypasses RLS (runs as superuser) | Test auth scenarios via SDK with a real user session, not the dashboard editor |
| Postgres exclusion constraints | Forgetting `btree_gist` extension | `CREATE EXTENSION IF NOT EXISTS btree_gist;` must precede the constraint in migrations |
| Next.js App Router caching | Server Component data reads are cached by default in some configurations | Use `{ cache: 'no-store' }` for booking/diary data that must be real-time |
| PWA iOS Safari | `viewport-fit=cover` and safe areas not set | Add `env(safe-area-inset-*)` CSS variables; bottom nav tabs disappear behind iPhone home bar without this |
| PWA iOS Safari keyboard | Virtual keyboard shifts viewport and covers form inputs | Use `visualViewport` API to detect keyboard height; scroll focused input into view programmatically |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No index on `owner_user_id` | List queries get slower as stylist adds data | Add B-tree index in initial migration | ~200-500 rows per table |
| RLS sub-select written with correlated subquery instead of `IN (SELECT ...)` form | Appointment list takes seconds | Use `appointment_id IN (SELECT id FROM appointments WHERE owner_user_id = (SELECT auth.uid()))` | Any meaningful data volume |
| Diary view loads all appointments then filters client-side | Initial page load slow; large payload | Filter by date range in the Supabase query; return only today's appointments by default | >50 appointments total |
| Client search with `ILIKE '%term%'` and no index | Search feels sluggish as client list grows | Use `pg_trgm` trigram index on `full_name` and `phone`; or use Postgres full-text search | ~100-200 clients |
| Daily totals recalculated on every page load by joining all tables | Dashboard slow; heavy DB load | Calculate and cache totals server-side; consider a `daily_summary` materialised view for future optimisation | ~500 payments/day |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Enabling RLS but writing no policies | All authenticated users see empty tables; appears broken but is not a security leak — yet dangerous because someone might disable RLS to "fix" it | Always write at least one SELECT policy immediately after enabling RLS |
| Tables created via SQL Editor migration without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | All rows publicly readable via the Supabase API without any auth token | Add `ENABLE ROW LEVEL SECURITY` to every `CREATE TABLE` migration; verify with the Security Advisor |
| Using `user_metadata` claims in RLS policies | Authenticated users can edit their own `user_metadata` via the client SDK, potentially spoofing role or permission claims | Use only `auth.uid()` and `auth.role()` in RLS policies; never `user_metadata` |
| Audit log entries skippable by the application | Developers forget to write audit log entries before deploying a refund feature | Implement audit logging via a Postgres trigger on the `invoices` and `payments` tables, not application code |
| Missing `WITH CHECK` on INSERT/UPDATE policies | User can insert rows with `owner_user_id` set to someone else's UUID | Every INSERT/UPDATE policy needs both `USING` and `WITH CHECK (owner_user_id = auth.uid())` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Bottom navigation hidden behind iPhone home indicator | Primary nav tabs are tapped accidentally or partially hidden | Add `padding-bottom: env(safe-area-inset-bottom)` to the bottom nav wrapper |
| Form input scrolled behind virtual keyboard on iOS Safari | Stylist cannot see what they are typing; rage-taps to submit | Use `scrollIntoView({ behavior: 'smooth', block: 'center' })` on focus; test on real iPhone Safari |
| Touch targets smaller than 44px | Misclicks on the diary grid, booking buttons, and action menus | Enforce 44px minimum height/width on all interactive elements; use padding over small icons |
| Destructive actions (cancel, void) require only one tap | Accidental cancellations of booked appointments | Require a confirmation step for any irreversible action (cancel, void, delete) |
| Booking flow requires too many steps from the diary | Stylists abort mid-flow; booking takes > 30 seconds | Pre-populate client and date from where the stylist tapped; minimise required fields at creation |
| Date/time picker uses native OS picker | Inconsistent appearance across Android/iOS; native time picker UX is poor for slot selection | Build a custom slot-grid picker that shows available 15-minute blocks for the selected day |
| Empty states show blank screens | New users do not know what to do first | Every list screen must have an empty state with a clear CTA ("Add your first client", "Book an appointment") |
| Error messages show raw Supabase error codes | Non-technical users cannot act on `PGRST301` or `23P01` | Map all known Postgres/PostgREST error codes to plain English; log technical details server-side only |

---

## "Looks Done But Isn't" Checklist

- [ ] **RLS on join tables:** Check `appointment_services`, `invoice_items`, `petty_cash_items` — each needs a verified policy, not just the parent table.
- [ ] **Exclusion constraint present:** Verify `\d appointments` in psql shows the GiST exclusion constraint, not just application-level validation.
- [ ] **`TIMESTAMPTZ` on appointment columns:** Confirm `start_at` and `end_at` are `TIMESTAMP WITH TIME ZONE`, not plain `TIMESTAMP`.
- [ ] **Snapshot fields populated:** Confirm `appointment_services.service_name_snapshot` and `price_pennies_snapshot` are populated on insert, not left null.
- [ ] **Paid invoice immutability:** Try to update `invoices` where `status = 'paid'` — the operation should fail with a clear error.
- [ ] **Auth middleware uses `getUser()`:** Search codebase for `getSession()` in server files — should return zero results.
- [ ] **Magic link re-request flow exists:** Test clicking an expired/used magic link — should show a clear message with a button to get a new link, not a broken page.
- [ ] **PWA manifest and service worker registered:** Open Chrome DevTools Application tab; confirm `manifest.json` has `display: standalone`, icons in required sizes, and service worker is registered.
- [ ] **iOS safe area insets applied:** Test on an iPhone with a notch/home bar — bottom nav must clear the home indicator.
- [ ] **Daily totals sum to integer pennies:** Check that no monetary display value shows more than 2 decimal places and that sums are exact.
- [ ] **CSV export downloads on mobile Safari:** iOS Safari triggers a file download differently; test the export button on an iPhone.
- [ ] **All indexes present:** Run `EXPLAIN ANALYZE` on a query filtered by `owner_user_id`; confirm `Index Scan` not `Seq Scan`.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double-bookings due to no exclusion constraint | HIGH | Write a deduplication migration to identify overlapping rows; contact affected clients; add constraint to prevent recurrence |
| Floating point monetary errors discovered in production | HIGH | Audit all `payments` and `invoice` totals; write a correction migration for each cent-off row; requires manual reconciliation |
| Paid invoice edited directly (no immutability) | HIGH | Restore from Supabase point-in-time backup; or manually reconcile from payment processor records |
| RLS misconfiguration exposes data | HIGH | Immediately apply correct RLS; rotate Supabase API keys; notify affected users per GDPR obligation |
| GMT/BST timezone bug surfaces after March clock change | MEDIUM | Write a migration to correct affected `TIMESTAMP` rows by applying the UTC offset; verify against appointment notes |
| Missing indexes causing slow production queries | LOW | Add indexes without downtime; Postgres `CREATE INDEX CONCURRENTLY` does not lock the table |
| Magic link broken by email scanner pre-fetch | LOW | Implement a link with a token that shows a "confirm login" button instead of auto-completing auth on GET |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS missing on join tables | Sprint 1 — Foundation (schema + migrations) | Query join tables from a second test account; expect empty results |
| Double-booking race condition | Sprint 2 — Booking (exclusion constraint in migration) | Run two concurrent booking requests for the same slot; second must fail |
| Floating point in financial calculations | Sprint 1 — Foundation (schema) + Sprint 3 — Billing | Unit-test `calculateInvoice` with % discounts; verify integer outputs |
| Discount order of operations | Sprint 3 — Billing | Invoice total on screen matches `invoices.total_pennies` stored value |
| Session not refreshed in middleware | Sprint 1 — Foundation (auth + middleware) | Leave app idle 60+ minutes; page reload should not cause broken state |
| Timezone/BST handling | Sprint 1 — Foundation (schema `TIMESTAMPTZ`) + Sprint 2 — Booking | Create appointment at 9am in summer; verify it displays as 9am after clock change |
| Missing `owner_user_id` indexes | Sprint 1 — Foundation (migrations) | `EXPLAIN ANALYZE` on list queries confirms `Index Scan` |
| Paid invoice mutability | Sprint 3 — Billing (status transitions) | Attempt direct edit of a paid invoice; must be rejected at DB and UI level |
| iOS safe area / keyboard UX | Sprint 4 — Polish (mobile QA) | Test checkout flow on real iPhone with virtual keyboard visible |
| Empty states missing | Sprint 4 — Polish | Log in with a brand-new account; every list screen must show a CTA, not blank |

---

## Sources

- [Supabase RLS Performance and Best Practices (official docs)](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — HIGH confidence
- [Supabase Row Level Security (official docs)](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Setting Up Server-Side Auth for Next.js (official Supabase docs)](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence
- [Supabase Auth troubleshooting for Next.js (official docs)](https://supabase.com/docs/guides/troubleshooting/how-do-you-troubleshoot-nextjs---supabase-auth-issues-riMCZV) — HIGH confidence
- [OTP Verification Failures — token expired (official Supabase docs)](https://supabase.com/docs/guides/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0) — HIGH confidence
- [Supabase Rate Limits (official docs)](https://supabase.com/docs/guides/auth/rate-limits) — HIGH confidence
- [Supabase Realtime — range columns for overlap prevention (official blog)](https://supabase.com/blog/range-columns) — HIGH confidence
- [Postgres Exclusion Constraints for appointment overlap prevention](https://atomiccoding.substack.com/p/explore-exclusion-constraints-in) — MEDIUM confidence (verified against Postgres docs)
- [Invoices: how to properly round and calculate totals (makandra dev)](https://makandracards.com/makandra/1505-invoices-how-to-properly-round-and-calculate-totals) — MEDIUM confidence (community, widely referenced)
- [Supabase Preventing Race Conditions with SERIALIZABLE Isolation (GitHub Discussion)](https://github.com/orgs/supabase/discussions/30334) — MEDIUM confidence
- [6 React Server Component performance pitfalls in Next.js (LogRocket)](https://blog.logrocket.com/react-server-components-performance-mistakes) — MEDIUM confidence
- [Next.js + Supabase — cookie-based auth workflow (Medium)](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1) — MEDIUM confidence
- [Annoying iOS Safari input issues (Mobiscroll blog)](https://blog.mobiscroll.com/annoying-ios-safari-input-issues-with-workarounds/) — MEDIUM confidence
- [App Router pitfalls — common Next.js mistakes (imidef.com, Feb 2026)](https://imidef.com/en/2026-02-11-app-router-pitfalls) — MEDIUM confidence

---
*Pitfalls research for: Solo Stylist OS — Next.js + Supabase mobile-first PWA*
*Researched: 2026-03-01*
