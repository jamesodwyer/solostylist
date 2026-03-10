---
phase: 5
slug: polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.58.x (installed, unconfigured) |
| **Config file** | none — no playwright.config.ts exists |
| **Quick run command** | `npx playwright test --reporter=line` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | N/A — all verifications are manual |

---

## Sampling Rate

- **After every task commit:** Manual browser verification
- **After every plan wave:** Manual verification checklist
- **Before `/gsd:verify-work`:** Full manual checklist must pass
- **Max feedback latency:** N/A — manual testing

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DATA-02 | manual-only | N/A — browser download | ❌ | ⬜ pending |
| 05-01-02 | 01 | 1 | DATA-02 | manual-only | N/A — Excel/Numbers open | ❌ | ⬜ pending |
| 05-02-01 | 02 | 1 | DATA-03 | manual-only | Supabase query: `select * from audit_log where action in ('note_deleted','formula_deleted','appointment_cancelled','appointment_noshow') limit 10` | ❌ | ⬜ pending |
| 05-03-01 | 03 | 2 | AUTH-05 | manual-only | Real iOS device — home screen PWA | ❌ | ⬜ pending |
| 05-03-02 | 03 | 2 | AUTH-05 | manual-only | Real iOS device — keyboard in sheets | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — all verifications are manual for this phase.

*Justification: CSV download format, Excel rendering, and iOS Safari PWA keyboard behaviour cannot be tested in a headless environment. For an MVP with no test suite, manual verification in under 5 minutes is the optimal path.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSV downloads with correct headers, data, £ amounts | DATA-02 | Requires browser download + Excel/Numbers open to verify BOM and formatting | Download each CSV, open in Excel/Numbers, verify £ signs and column headers |
| Audit log rows for deletions and cancellations | DATA-03 | Requires Supabase dashboard query after triggering actions | Delete a note, cancel an appointment, query audit_log table |
| Bottom nav clears home indicator on iOS | AUTH-05 | Requires real iOS device with PWA installed | Add to home screen, verify bottom padding |
| Keyboard does not trap scroll in sheets | AUTH-05 | Requires real iOS device keyboard interaction | Open booking/payment sheet, tap input, verify scroll not trapped |

---

## Validation Sign-Off

- [x] All tasks have manual verification instructions
- [x] Sampling continuity: manual check after each task
- [x] Wave 0: not required (all manual)
- [x] No watch-mode flags
- [ ] Feedback latency: manual
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
