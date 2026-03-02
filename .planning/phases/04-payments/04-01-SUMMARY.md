---
phase: 04-payments
plan: 01
subsystem: payments
tags: [payments, supabase, server-actions, zod, shadcn, lucide-react, audit-log]

# Dependency graph
requires:
  - phase: 03-booking
    provides: AppointmentSheet with status actions, Appointment type, appointment_services data

provides:
  - Payment and AuditLogEntry TypeScript interfaces in database.ts
  - createPayment Server Action with zod validation and audit_log insert
  - PaymentSheet bottom sheet with cash/card toggle and amount input
  - Take Payment button wired into AppointmentSheet for completed appointments
  - Payment recorded indicator for already-paid completed appointments

affects: [04-payments-02, 04-payments-03, clients-timeline, money-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "createPayment Server Action mirrors createAppointment pattern: getUser, zod safeParse, supabase insert, audit_log insert (non-blocking), revalidatePath"
    - "PaymentSheet: bottom Sheet h-[60vh] with cash/card toggle buttons, pound-prefixed text input (inputMode=decimal), useTransition for Server Action call"
    - "onTakePayment prop: AppointmentSheet closes self and signals DiaryView to open PaymentSheet (no nested sheets)"
    - "hasPayment check: browser Supabase client query on appointment_id in payments table on every appointment open"

key-files:
  created:
    - src/lib/actions/payments.ts
    - src/components/payments/payment-sheet.tsx
  modified:
    - src/lib/types/database.ts
    - src/components/diary/appointment-sheet.tsx
    - src/components/diary/diary-view.tsx

key-decisions:
  - "PaymentSheet rendered as sibling sheet in DiaryView, not nested inside AppointmentSheet — avoids sheet-inside-sheet z-index complexity"
  - "Audit log insert failure is non-blocking — logs to console but does not fail the user action (payment already committed to DB)"
  - "hasPayment state initialised to false, reset on each appointment open, populated via async browser Supabase query — no prop drilling required"

patterns-established:
  - "Payment recording: createPayment Server Action -> payments table insert -> audit_log insert (non-blocking) -> revalidatePath('/money', '/diary', '/clients/[id]')"

requirements-completed: [PAY-01, PAY-02, PAY-03]

# Metrics
duration: 3min
completed: 2026-03-02
---

# Phase 4 Plan 01: Payment Data Layer and Recording UI Summary

**Cash/card payment recording via PaymentSheet bottom sheet, wired to completed appointments in the diary via createPayment Server Action with immutable audit log trail**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T23:45:58Z
- **Completed:** 2026-03-02T23:48:38Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Payment and AuditLogEntry TypeScript interfaces added to database.ts, mapping to the already-deployed schema
- createPayment Server Action created with zod validation, Supabase insert to payments table, and non-blocking audit_log insert
- PaymentSheet bottom sheet component with cash/card method toggle, pound-prefixed amount input (pre-filled from appointment total), and optional notes
- AppointmentSheet modified: Take Payment button for completed appointments without a payment; "Payment recorded" indicator for already-paid appointments
- DiaryView modified: PaymentSheet rendered as sibling sheet, triggered via onTakePayment prop pattern (no nested sheets)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Payment type and createPayment Server Action** - `c3be944` (feat)
2. **Task 2: Build PaymentSheet and wire Take Payment into diary** - `6446320` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/types/database.ts` - Added PaymentMethod, PaymentType union types; Payment and AuditLogEntry interfaces
- `src/lib/actions/payments.ts` - createPayment Server Action: zod validation, payments insert, audit_log insert, revalidation
- `src/components/payments/payment-sheet.tsx` - Bottom sheet with cash/card toggle, amount input pre-filled from appointment total, notes, useTransition submit
- `src/components/diary/appointment-sheet.tsx` - Added onTakePayment prop, hasPayment state, Take Payment button, "Payment recorded" indicator, Banknote icon
- `src/components/diary/diary-view.tsx` - Import PaymentSheet, paymentTarget state, onTakePayment handler, PaymentSheet render with appointment data

## Decisions Made
- PaymentSheet rendered as sibling in DiaryView rather than nested inside AppointmentSheet — avoids z-index stacking issues with sheet-inside-sheet on iOS Safari
- Audit log insert failure is non-blocking (console.error only) — payment is already committed to the DB; losing an audit record is less harmful than surfacing an error to the user
- hasPayment check uses browser Supabase client (same pattern as notes update in AppointmentSheet) — RLS enforces owner scoping, no explicit owner_user_id filter needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. The payments and audit_log tables were already deployed in the Phase 1 migration.

## Next Phase Readiness
- Payment recording complete — stylists can tap "Take Payment" on any completed appointment to record cash or card payment
- Ready for Phase 4 Plan 02: refund/void adjustment UI and adjustment Server Action
- Ready for Phase 4 Plan 03: Money page with daily totals and payment list
- The createPayment action already revalidates /clients/[id] — client timeline work in a later plan will benefit automatically

---
*Phase: 04-payments*
*Completed: 2026-03-02*
