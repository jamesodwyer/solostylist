---
phase: 04-payments
plan: 02
subsystem: payments
tags: [payments, supabase, server-actions, zod, shadcn, lucide-react, audit-log, money-page, client-timeline]

# Dependency graph
requires:
  - phase: 04-payments
    plan: 01
    provides: createPayment Server Action, Payment type, payments table already deployed

provides:
  - createAdjustment Server Action with zod validation, audit_log insert (non-blocking), revalidation
  - AdjustmentSheet bottom sheet for recording refund (partial) or void (full amount)
  - PaymentList reusable component with type badges, method icons, optional Refund button
  - Money page with daily cash/card/refund/net totals, date navigation, transaction list
  - Client detail Payments tab showing per-client payment history

affects: [04-payments-03, client-detail, money-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "createAdjustment mirrors createPayment: getUser, zod safeParse, fetch original row, insert adjustment (new row, original untouched), audit_log (non-blocking), revalidatePath"
    - "Money page: Server Component computes integer-penny totals, passes to MoneyView client component — same Server/Client split as diary/diary-view.tsx"
    - "Date navigation: addDays helper, ChevronLeft/Right buttons with router.push, hidden input[type=date] with showPicker() trigger"
    - "PaymentList: generic reusable component — shows Refund button only when onRefund prop provided (Money page yes, client timeline no)"
    - "Client payments query omits clients join (already in context); cast as unknown as Payment[] per project pattern"

key-files:
  created:
    - src/lib/actions/payments.ts (createAdjustment added alongside createPayment)
    - src/components/payments/payment-list.tsx
    - src/components/payments/adjustment-sheet.tsx
    - src/components/payments/money-view.tsx
  modified:
    - src/app/(app)/money/page.tsx
    - src/app/(app)/clients/[id]/page.tsx
    - src/components/clients/detail/client-detail-tabs.tsx

key-decisions:
  - "PaymentList onRefund prop optional — Money page passes it (enables Refund button), client timeline omits it (read-only view)"
  - "Money page totals computed server-side in integer pennies — no float arithmetic risk, totals available for SSR render"
  - "AdjustmentSheet resets state (type, amount, notes, error) on close — prevents stale state bleeding between sessions"
  - "Void locks amount to original payment amount (read-only input); refund allows partial editing"

patterns-established:
  - "Adjustment pattern: new row with payment_type=refund/void + reference_payment_id FK to original — original payment row never mutated"
  - "Audit log action naming: payment_refund, payment_void (mirrors payment_created from Plan 01)"
  - "Money page Server/Client split: page.tsx computes server data, money-view.tsx handles all interaction"

requirements-completed: [PAY-04, PAY-01, PAY-02, PAY-03]

# Metrics
duration: 8min
completed: 2026-03-02
---

# Phase 4 Plan 02: Refund/Void Adjustments and Money Page Summary

**Refund/void recording via createAdjustment Server Action with immutable audit trail, Money page with daily cash/card/net totals and date navigation, and per-client payment history tab**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-02T23:50:00Z
- **Completed:** 2026-03-02T23:58:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- createAdjustment Server Action: inserts refund/void as new row (original untouched), validates ownership of original payment, writes audit_log with payment_refund/payment_void action
- AdjustmentSheet: bottom sheet with refund/void toggle, partial amount for refunds, locked full amount for voids, red/amber styling per type
- PaymentList: reusable component with green/red/amber type badges, Banknote/CreditCard icons, optional Refund button gated by onRefund prop
- Money page: Server Component totals (cash, card, refunds, net all in integer pennies), date navigation, transaction list, AdjustmentSheet integration
- Client detail Payments tab added (4th tab, grid-cols-4), showing all payments for that client in read-only mode

## Task Commits

Each task was committed atomically:

1. **Task 1: Add createAdjustment Server Action and PaymentList + AdjustmentSheet components** - `b79866e` (feat)
2. **Task 2: Build Money page and add payments to client timeline** - `9668a00` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/actions/payments.ts` - createAdjustment Server Action added (createAdjustment schema, ownership check, adjustment insert, audit_log insert, revalidation)
- `src/components/payments/payment-list.tsx` - Reusable payment list with type badges, method icons, optional Refund button
- `src/components/payments/adjustment-sheet.tsx` - Bottom sheet for refund (partial) or void (full), RotateCcw/XCircle icons, red/amber submit button
- `src/components/payments/money-view.tsx` - Client component: date navigation, summary cards (cash/card/net), transaction list, AdjustmentSheet state
- `src/app/(app)/money/page.tsx` - Replaced stub with Server Component: auth, date param, payments query, integer-penny totals, renders MoneyView
- `src/app/(app)/clients/[id]/page.tsx` - Added payments query (.from('payments')…), passes as prop with as unknown as Payment[] cast
- `src/components/clients/detail/client-detail-tabs.tsx` - Added Payment import, payments prop, grid-cols-4, Payments TabsTrigger and TabsContent

## Decisions Made
- PaymentList onRefund prop is optional — only Money page provides it (enabling the Refund button); client timeline passes no callback so refunds only happen from the Money page. Keeps client detail view read-only.
- Totals computed server-side (not in client) — no risk of float arithmetic in JS, totals ready for SSR render without client-side recalculation
- AdjustmentSheet fully resets state on close (type, amount, notes, error) to prevent stale values persisting between separate tap sessions
- Void locks the amount input to the full original amount (readOnly input with bg-gray-50 styling); refund allows any amount up to original

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. All DB tables (payments, audit_log) were deployed in Phase 1 migration.

## Next Phase Readiness
- Refund/void complete — stylists can record adjustments against any payment from the Money page
- Money page shows daily takings breakdown — ready for Phase 4 Plan 03 (cash-up/end-of-day summary if applicable, or phase complete)
- Client payments tab provides per-client payment history for stylist review
- All PAY requirements (PAY-01 through PAY-04) now satisfied

---
*Phase: 04-payments*
*Completed: 2026-03-02*

## Self-Check: PASSED

- src/lib/actions/payments.ts — FOUND (createAdjustment exported)
- src/components/payments/payment-list.tsx — FOUND
- src/components/payments/adjustment-sheet.tsx — FOUND
- src/components/payments/money-view.tsx — FOUND
- src/app/(app)/money/page.tsx — FOUND (no longer a stub)
- Commit b79866e — FOUND (Task 1)
- Commit 9668a00 — FOUND (Task 2)
