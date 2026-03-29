---
phase: 7
slug: diary-calendar
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None detected — Wave 0 installs jest + RNTL |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `cd native && npx jest --passWithNoTests` |
| **Full suite command** | `cd native && npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd native && npx jest --passWithNoTests`
- **After every plan wave:** Run `cd native && npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Requirement | Test Type | Automated Command | File Exists | Status |
|-------------|-----------|-------------------|-------------|--------|
| DIARY-01 | manual | N/A — visual calendar rendering | ❌ | ⬜ pending |
| DIARY-02 | manual | N/A — visual week layout | ❌ | ⬜ pending |
| DIARY-03 | unit | `jest timeGrid.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-04 | manual | N/A — touch interaction | ❌ | ⬜ pending |
| DIARY-05 | manual | N/A — gesture test | ❌ | ⬜ pending |
| DIARY-06 | unit | `jest appointments.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-07 | manual | N/A — bottom sheet interaction | ❌ | ⬜ pending |
| DIARY-08 | unit | `jest services.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-09 | unit | `jest appointmentBlock.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-10 | manual | N/A — payment flow integration | ❌ | ⬜ pending |
| DIARY-11 | unit | `jest appointments.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-12 | unit | `jest appointments.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-13 | manual | N/A — data display in booking sheet | ❌ | ⬜ pending |
| DIARY-14 | unit | `jest timeGrid.test.ts` | ❌ W0 | ⬜ pending |
| DIARY-15 | unit | `jest timeGrid.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `native/jest.config.js` — Jest config for React Native
- [ ] `native/src/lib/utils/__tests__/timeGrid.test.ts` — covers DIARY-03, DIARY-14, DIARY-15
- [ ] `native/src/lib/actions/__tests__/appointments.test.ts` — covers DIARY-06, DIARY-11, DIARY-12
- [ ] `native/src/lib/actions/__tests__/services.test.ts` — covers DIARY-08

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Month view dot indicators | DIARY-01 | Visual calendar rendering | Open month view, create appointment, verify dot appears |
| Week view 7-column layout | DIARY-02 | Visual layout | Switch to week view, verify 7 columns visible |
| Segmented control switching | DIARY-04 | Touch interaction | Tap each segment, verify view changes |
| Swipe date navigation | DIARY-05 | Gesture interaction | Swipe left/right on day view, verify date changes |
| Appointment detail sheet | DIARY-07 | Bottom sheet interaction | Tap appointment block, verify sheet opens with details |
| Take Payment flow | DIARY-10 | Cross-screen integration | Complete appointment, tap Take Payment, verify payment flow |
| Client notes in booking | DIARY-13 | Data display in booking sheet | Start booking, select client, verify notes appear |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
