---
phase: 05-polish
plan: "02"
subsystem: audit-log
tags: [audit, ios-fix, server-actions]
dependency_graph:
  requires: []
  provides: [audit-log-note-deletion, audit-log-colour-formula-deletion, audit-log-appointment-cancellation, ios-keyboard-fix]
  affects: [src/lib/actions/notes.ts, src/lib/actions/appointments.ts, src/app/layout.tsx]
tech_stack:
  added: []
  patterns: [non-blocking-audit-log, interactiveWidget-viewport-meta]
key_files:
  created: []
  modified:
    - src/lib/actions/notes.ts
    - src/lib/actions/appointments.ts
    - src/app/layout.tsx
decisions:
  - "Audit log insert for appointment cancellations scoped to cancelled/no_show only — booked/completed transitions do not produce audit rows"
  - "auditError variable scoped inside each function block — no naming conflicts"
  - "interactiveWidget: 'resizes-content' added directly to Viewport export — TypeScript accepted without suppression comment"
metrics:
  duration: "2 min"
  completed_date: "2026-03-10"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
requirements_addressed: [DATA-03]
---

# Phase 5 Plan 02: Audit Log Gaps and iOS Keyboard Fix Summary

Closed audit log gaps for note/formula deletions and appointment cancellations, and added the iOS keyboard viewport fix — all three source files patched following established patterns with zero regressions.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Audit log inserts for deletions and cancellations | 4ea3451 | src/lib/actions/notes.ts, src/lib/actions/appointments.ts |
| 2 | interactiveWidget viewport meta for iOS keyboard fix | 9ae5c11 | src/app/layout.tsx |

## What Was Built

**Task 1 — Audit log gaps closed (3 functions patched):**

- `deleteNote` in `notes.ts`: After successful `.delete()`, inserts `{ action: 'note_deleted', entity_type: 'client_note', entity_id: id, details: { client_id } }` — non-blocking, `console.error` on failure.
- `deleteColourFormula` in `notes.ts`: After successful `.delete()`, inserts `{ action: 'colour_formula_deleted', entity_type: 'colour_formula', entity_id: id, details: { client_id } }` — same pattern.
- `updateAppointmentStatus` in `appointments.ts`: After successful `.update()`, conditionally inserts audit row only when `status === 'cancelled' || status === 'no_show'`. Action string is `appointment_${status}` (yields `appointment_cancelled` or `appointment_no_show`). Non-sensitive transitions (`booked`, `completed`) do not produce audit rows.

All three follow the exact non-blocking pattern established in `createPayment` and `createAdjustment` in `payments.ts`.

**Task 2 — iOS keyboard fix:**

Added `interactiveWidget: "resizes-content"` to the `viewport` export in `src/app/layout.tsx`. This instructs iOS Safari 16+ and Chrome 108+ to shrink the layout viewport (rather than overlay it) when the software keyboard opens. Prevents the scroll-trap bug in bottom sheets containing text inputs (BookingSheet notes field, PaymentSheet amount field, etc.).

## Decisions Made

1. **Audit scope for appointments**: Only `cancelled` and `no_show` transitions are audited. `booked` and `completed` are routine transitions with no sensitivity requirement. This keeps audit_log rows meaningful for DATA-03 compliance.
2. **Variable naming**: Each audit block uses `auditError` as its variable name. No conflicts because each is in its own function scope.
3. **TypeScript on interactiveWidget**: Next.js 16's `Viewport` type accepts `interactiveWidget` natively. No `@ts-expect-error` suppression needed.

## Verification Results

- `npx next build` passes cleanly after both task commits
- All 3 patched functions compile without TypeScript errors
- layout.tsx `viewport` export includes `interactiveWidget: "resizes-content"`
- No regressions to existing audit log inserts in `payments.ts`

## Deviations from Plan

None — plan executed exactly as written. Build was failing before this plan (pre-existing unstaged changes to `booking-sheet.tsx` and `src/app/api/`), but those files were already updated and the current build passes.

## Self-Check: PASSED

- FOUND: src/lib/actions/notes.ts
- FOUND: src/lib/actions/appointments.ts
- FOUND: src/app/layout.tsx
- FOUND: .planning/phases/05-polish/05-02-SUMMARY.md
- FOUND: commit 4ea3451 (Task 1)
- FOUND: commit 9ae5c11 (Task 2)
