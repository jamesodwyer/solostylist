---
phase: 6
slug: booking-client-notes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright ^1.58.2 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds (tsc), ~60 seconds (playwright) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | CLNT-08 | unit/tsc | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 06-01-02 | 01 | 1 | CLNT-08 | e2e | `npx playwright test --grep "CLNT-08"` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | CLNT-08 | e2e | `npx playwright test --grep "CLNT-08"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-06-client-notes.spec.ts` — e2e stubs for CLNT-08 (booking sheet + appointment sheet)
- [ ] `playwright.config.ts` — Playwright config for local dev base URL
- [ ] Seed data fixture for client with notes and colour formulas

*Note: TypeScript compilation via `npx tsc --noEmit` is available immediately with no setup cost and catches the majority of bugs in this purely UI phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Notes section is collapsible and non-blocking | CLNT-08 | Visual interaction — toggle state and scroll position | 1. Open booking sheet, select client with notes. 2. Verify notes section collapsed by default. 3. Tap to expand. 4. Verify services list is still accessible without excessive scrolling. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
