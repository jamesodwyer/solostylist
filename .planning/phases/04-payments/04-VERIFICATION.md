---
phase: 04-payments
verified: 2026-03-10T00:00:00Z
status: human_needed
score: 9/9 automated must-haves verified
re_verification: false
human_verification:
  - test: "Record a cash payment from a completed appointment"
    expected: "PaymentSheet opens with amount pre-filled from appointment services total; submitting records a payment row, audit_log entry, and shows 'Payment recorded' on next open of the appointment sheet"
    why_human: "Requires a live Supabase connection and real appointment data to verify the full recording flow end-to-end"
  - test: "Record a card payment from a completed appointment"
    expected: "Toggling to 'Card' and submitting records method='card' in the payments table; Money page shows separate Cash and Card totals"
    why_human: "Payment method storage verification requires an active database connection"
  - test: "Record a refund (partial) on the Money page"
    expected: "AdjustmentSheet opens with original payment details; submitting creates a new payment row with payment_type='refund', reference_payment_id set, amount correct; net total reduced by refund amount; original row unchanged"
    why_human: "Requires live Supabase to verify new row creation, original row immutability, and totals recalculation"
  - test: "Record a void on the Money page"
    expected: "Amount input is locked (readOnly) to full original amount; void creates a new row with payment_type='void'; amber badge displayed; net total reduced by full amount"
    why_human: "Requires live data and UI interaction to confirm readOnly lock and badge rendering"
  - test: "Client Payments tab shows payment history"
    expected: "Navigating to a client with recorded payments shows the Payments tab; all payments (including refunds/voids) appear with correct amounts and type badges; no onRefund callback (read-only view)"
    why_human: "Requires a client with existing payment history in the database"
  - test: "Money page date navigation"
    expected: "Left/right arrow buttons and date picker navigate to different days; ?date=YYYY-MM-DD URL param controls which day's payments are shown; empty state shows no transactions on days without payments"
    why_human: "Date navigation involves router.push behaviour that requires a running browser session to verify"
  - test: "Zero/empty amount validation"
    expected: "Submitting PaymentSheet with empty or zero amount shows 'Please enter a valid amount.' error and does not call createPayment"
    why_human: "Client-side validation requires UI interaction to verify the error appears and the submit is blocked"
notes:
  - "PAY-04 is marked 'Pending' in REQUIREMENTS.md and Phase 4 is marked '2/3 plans' in ROADMAP.md — both should be updated to reflect completed state (04-03-SUMMARY confirms human verification passed)"
---

# Phase 4: Payments Verification Report

**Phase Goal:** A stylist can take money for a completed appointment and see it recorded correctly
**Verified:** 2026-03-10
**Status:** human_needed (all automated checks passed; human flow verified per 04-03-SUMMARY.md)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | User can record a cash payment against a completed appointment | VERIFIED | `appointment-sheet.tsx` lines 254-265: "Take Payment" button shown when `status === 'completed' && !hasPayment`; `payment-sheet.tsx` calls `createPayment` with `method` state defaulting to `'cash'` |
| 2  | User can record a card payment against a completed appointment | VERIFIED | `payment-sheet.tsx` lines 101-113: Card button sets `method` to `'card'`; same `createPayment` call submits method to DB |
| 3  | Payment records store method, amount (integer pennies), and timestamp | VERIFIED | `payments.ts` lines 37-49: insert includes `amount: parsed.data.amount` (int pennies from zod schema), `method`, `paid_at: new Date().toISOString()`; `database.ts` Payment interface maps amount as `number` with comment "INTEGER pennies" |
| 4  | Audit log entry is created for every payment | VERIFIED | `payments.ts` lines 56-67: `supabase.from('audit_log').insert(...)` called after every `createPayment` success; lines 127-140: same for every `createAdjustment` success |
| 5  | Take Payment button appears on completed appointments in the appointment sheet | VERIFIED | `appointment-sheet.tsx` line 254: `{appointment.status === 'completed' && !hasPayment && (` wraps the Take Payment button |
| 6  | User can record a refund or void — original payment remains, adjustment is a new row | VERIFIED | `payments.ts` lines 105-121: insert into `payments` with `payment_type: parsed.data.adjustment_type` and `reference_payment_id: parsed.data.reference_payment_id` — original row is never touched (only fetched for `client_id`/`appointment_id` reference) |
| 7  | Refund/void creates an audit_log entry | VERIFIED | `payments.ts` lines 127-140: `supabase.from('audit_log').insert(...)` with `action: 'payment_' + parsed.data.adjustment_type` |
| 8  | Money page shows today's payments with daily totals (gross, refunds, net) | VERIFIED | `money/page.tsx` lines 38-51: server-side integer-penny totals (totalCash, totalCard, totalRefunds, grossTotal, netTotal); `money-view.tsx` renders summary cards displaying all five values |
| 9  | Client detail page shows payment history in a dedicated Payments tab | VERIFIED | `clients/[id]/page.tsx` line 55-64: `supabase.from('payments').select(...)` query; `client-detail-tabs.tsx` line 31: `<TabsTrigger value="payments">Payments</TabsTrigger>` with `<PaymentList payments={payments} />` rendered inside |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Notes |
|----------|-----------|--------------|--------|-------|
| `src/lib/types/database.ts` | — | 173 | VERIFIED | `interface Payment` at line 146; `PaymentMethod`, `PaymentType`, `AuditLogEntry` all present |
| `src/lib/actions/payments.ts` | — | 153 | VERIFIED | Exports `createPayment` (line 24) and `createAdjustment` (line 82) |
| `src/components/payments/payment-sheet.tsx` | 80 | 168 | VERIFIED | Full bottom sheet with cash/card toggle, amount input, notes, error display, submit |
| `src/components/diary/appointment-sheet.tsx` | — | 451 | VERIFIED | Contains "Take Payment" at line 263; `hasPayment` state check at line 254; "Payment recorded" indicator at line 268 |
| `src/components/payments/adjustment-sheet.tsx` | 60 | 216 | VERIFIED | Full refund/void bottom sheet with type toggle, amount (readOnly for void), notes, error, submit |
| `src/components/payments/payment-list.tsx` | 30 | 98 | VERIFIED | Reusable list with green/red/amber type badges, method icons, optional Refund button |
| `src/app/(app)/money/page.tsx` | 50 | 64 | VERIFIED | Server Component: auth, date param, payments query, integer-penny totals, renders MoneyView |
| `src/app/(app)/clients/[id]/page.tsx` | — | 92 | VERIFIED | Contains `from('payments')` at line 56; passes result to `ClientDetailTabs` as `payments` prop |
| `src/components/clients/detail/client-detail-tabs.tsx` | — | 59 | VERIFIED | Imports `Payment` type and `PaymentList`; 4-column grid; Payments tab with `<PaymentList payments={payments} />` |
| `src/components/payments/money-view.tsx` | — | 156 | VERIFIED | Client component: date navigation (prev/next/picker), summary cards, PaymentList, AdjustmentSheet state management |

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `payment-sheet.tsx` | `payments.ts createPayment` | `import { createPayment }` + `startTransition(async () => { const result = await createPayment(...)` | WIRED | Lines 12, 49 |
| `appointment-sheet.tsx` | `payment-sheet.tsx` (PaymentSheet) | `onTakePayment?.(appointment)` prop called on button click; DiaryView renders PaymentSheet on `paymentTarget` | WIRED | `appointment-sheet.tsx` line 257; `diary-view.tsx` lines 165-184 |
| `payments.ts createPayment` | `supabase.from('payments').insert` | Direct insert at line 37 | WIRED | `payments.ts` line 37 |
| `payments.ts createPayment` | `supabase.from('audit_log').insert` | Non-blocking insert after payment success at line 56 | WIRED | `payments.ts` line 56 |
| `adjustment-sheet.tsx` | `payments.ts createAdjustment` | `import { createAdjustment }` + `startTransition(async () => { const result = await createAdjustment(...)` | WIRED | Lines 12, 75 |
| `money/page.tsx` | `supabase.from('payments')` | Server Component query at line 23 | WIRED | `money/page.tsx` line 23 |
| `clients/[id]/page.tsx` | `supabase.from('payments')` | Server Component query at line 55 | WIRED | `clients/[id]/page.tsx` line 56 |
| `money-view.tsx` | `PaymentList` + `AdjustmentSheet` | Imports and renders both; `handleRefund` callback opens AdjustmentSheet with selected payment | WIRED | `money-view.tsx` lines 8-9, 144, 149 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| PAY-01 | 04-01, 04-02 | User can record a cash payment against a client/appointment | SATISFIED | PaymentSheet with cash method; createPayment inserts to payments table |
| PAY-02 | 04-01, 04-02 | User can record a card payment against a client/appointment (log only) | SATISFIED | PaymentSheet card toggle; createPayment stores method='card' |
| PAY-03 | 04-01, 04-02 | Payment records store method, amount, timestamp | SATISFIED | payments.ts inserts method, amount (int pennies), paid_at; Payment interface confirms types |
| PAY-04 | 04-02 | User can record refund/void as adjustment transaction (audit trail) | SATISFIED | createAdjustment inserts new row with reference_payment_id, payment_type=refund/void; audit_log entry created with action='payment_refund' or 'payment_void' |

**Note:** REQUIREMENTS.md still marks PAY-04 as `[ ]` (Pending) and shows "Pending" in the Traceability table. The implementation is complete and human-verified (04-03-SUMMARY). REQUIREMENTS.md needs updating.

**Note:** ROADMAP.md shows Phase 4 as 2/3 plans and marks 04-03-PLAN.md as `[ ]`. The 04-03-SUMMARY.md confirms human verification was completed on 2026-03-10. ROADMAP.md needs updating.

### Anti-Patterns Found

None. All files checked for TODO/FIXME/placeholder stubs, empty implementations, and console.log-only handlers:

- No `TODO`, `FIXME`, `XXX`, `HACK`, or stub comments in payment files
- No `return null`, `return {}`, `return []` stub returns in payment components
- No `console.log` in payment-sheet.tsx or adjustment-sheet.tsx (the `console.error` in payments.ts is intentional — non-blocking audit log failure handling)
- No empty `onSubmit` handlers — all form submissions call Server Actions inside `startTransition`
- No float arithmetic — all monetary values use integer pennies throughout

### Human Verification Required

Note: The 04-03-SUMMARY.md confirms a human tester passed all 7 verification steps on 2026-03-10 (today). The items below are documented for record completeness and are considered passed based on that summary.

#### 1. Cash payment recording flow

**Test:** Open diary, find a completed appointment, tap "Take Payment", select Cash, confirm amount, tap "Record Payment"
**Expected:** Sheet closes; appointment sheet reopens showing "Payment recorded" indicator (not "Take Payment"); Money page shows the payment in the transaction list
**Why human:** Requires live Supabase connection and real appointment data to verify full round-trip

#### 2. Card payment recording

**Test:** Repeat above with Card method selected in PaymentSheet
**Expected:** Money page shows separate Cash and Card totals reflecting both payments
**Why human:** Payment method storage and separate totals require live database state

#### 3. Partial refund on Money page

**Test:** On Money page, tap "Refund" on a payment; change type to "Refund", reduce amount below original, add note, confirm
**Expected:** New row appears in transaction list with red "Refund" badge and negative display; net total reduced by refund amount only; original payment row still visible and unchanged
**Why human:** Row immutability and partial amount correctness require database verification

#### 4. Void on Money page

**Test:** On Money page, tap "Refund" on a payment; select "Void (cancel)"; verify amount field is locked (readOnly); confirm
**Expected:** Amount input non-editable; new void row with amber badge; net total reduced by full original amount
**Why human:** ReadOnly input behaviour and badge rendering require UI interaction

#### 5. Client Payments tab history

**Test:** Navigate to Clients, open a client with recorded payments, tap the "Payments" tab (4th tab)
**Expected:** All payments for that client appear in chronological order with type badges, amounts, and timestamps; no "Refund" button visible (read-only mode)
**Why human:** Requires a client with real payment history in the database

#### 6. Money page date navigation

**Test:** On Money page, tap left arrow (previous day), right arrow (next day), and date picker
**Expected:** URL updates to `?date=YYYY-MM-DD`, payment list updates to show that day's payments, empty state shows "No payments yet" for days with no data
**Why human:** Router navigation and date-filtered queries require a running browser session

#### 7. Zero amount validation

**Test:** Open PaymentSheet, clear the amount field, tap "Record Payment"
**Expected:** "Please enter a valid amount." error message appears; button remains disabled; no Server Action called
**Why human:** Client-side error display requires UI interaction

### Documentation Gaps (Non-blocking)

The following documentation items were not updated after Phase 4 completion. These are informational only — the code is correct and verified:

1. **REQUIREMENTS.md line 41**: `PAY-04` still shows `[ ]` (unchecked). Should be `[x]`.
2. **REQUIREMENTS.md line 136**: PAY-04 traceability row shows "Pending". Should be "Complete (04-02)".
3. **ROADMAP.md line 80**: `04-03-PLAN.md` shows `[ ]`. Should be `[x]`.
4. **ROADMAP.md line 102**: Phase 4 shows "2/3 plans — In progress". Should be "3/3 — Complete".

---

## Summary

All 9 observable truths are verified in the codebase. Every artifact exists, is substantive (well above minimum line counts), and is wired into the application:

- **Payment recording**: `createPayment` Server Action inserts to `payments` + `audit_log`; PaymentSheet wired to AppointmentSheet via `onTakePayment` prop pattern; Take Payment button gated by `appointment.status === 'completed' && !hasPayment`
- **Adjustment recording**: `createAdjustment` Server Action inserts a new row with `reference_payment_id` FK — original payment row is never mutated; audit_log entry written with action `payment_refund` or `payment_void`
- **Money page**: Server Component queries payments by day, computes integer-penny totals (cash/card/refunds/net), passes to MoneyView client component with date navigation; AdjustmentSheet wired via `handleRefund` callback
- **Client timeline**: `clients/[id]/page.tsx` queries payments and passes to ClientDetailTabs; 4th "Payments" tab renders PaymentList in read-only mode
- **PAY-01 through PAY-04**: All four requirements satisfied by the implemented code

The human tester confirmed all 7 verification scenarios on 2026-03-10 per 04-03-SUMMARY.md. Phase 4 goal is achieved.

---

_Verified: 2026-03-10_
_Verifier: Claude (gsd-verifier)_
