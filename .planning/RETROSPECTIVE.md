# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Solo Stylist OS MVP

**Shipped:** 2026-03-10
**Phases:** 6 | **Plans:** 20 | **Timeline:** 10 days

### What Was Built
- Complete salon booking system: auth, onboarding, services, clients, diary, payments
- Day diary with CSS Grid slot layout, 3-step booking flow, double-booking prevention
- Client CRM with notes, colour formulas, tags, and in-booking notes preview
- Payment recording (cash/card) with refund/void adjustments and audit trail
- CSV data export for all entities, iOS Safari PWA fixes
- 12-table PostgreSQL schema with RLS on every table

### What Worked
- Wave-based plan parallelization kept independent work moving efficiently
- Human verification checkpoints caught real issues (reschedule status filter bug in Phase 3)
- Phase 6 gap closure pattern: audit identified CLNT-08 gap, created targeted phase to close it
- Server Actions + Supabase RLS: clean separation of concerns, minimal auth boilerplate
- Integer pennies for all currency: zero float arithmetic bugs across the entire codebase
- Bottom sheet pattern (shadcn Sheet) worked well for mobile-first CRUD flows

### What Was Inefficient
- Auth flow changed mid-milestone (magic link → email+password) but SUMMARY docs weren't updated, creating documentation drift
- REQUIREMENTS.md traceability table had stale "Pending" entries that were actually complete — manual doc sync is error-prone
- SUMMARY frontmatter `requirements_completed` was inconsistently populated (some plans listed requirements, others left it empty)
- updateProfile Server Action was built but never wired to a UI — orphaned code from onboarding/settings split

### Patterns Established
- `zodResolver as any` workaround for zod@3 + @hookform/resolvers v5 — apply consistently until upstream fix
- Non-blocking audit log inserts (console.error on failure, never block user action)
- Browser Supabase client for client-side reads with RLS scoping (no explicit owner_user_id filter needed)
- PaymentSheet as sibling component (not nested inside AppointmentSheet) to avoid z-index issues on iOS
- RFC 4180 CSV with UTF-8 BOM for Excel Windows compatibility
- ClientNotesPreview defaults collapsed — compact, non-blocking preview pattern

### Key Lessons
1. Pin down auth strategy before Phase 1 — changing it mid-milestone creates documentation drift that accumulates
2. Human verification checkpoints are high-value: they found the reschedule status filter bug and confirmed real mobile UX works
3. Gap closure phases (Phase 6) are a clean pattern for addressing audit findings without disrupting the main phase sequence
4. SUMMARY frontmatter requirements_completed should be mandatory — inconsistent population makes 3-source cross-reference harder at audit time
5. Integer pennies everywhere eliminates an entire category of bugs — worth the upfront decision cost

### Cost Observations
- Model mix: ~70% sonnet (execution, verification), ~20% haiku (research), ~10% opus (planning, audit)
- Notable: Human verification checkpoints dominate wall-clock time but catch real issues; auto execution is fast

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 10 days | 6 | Initial milestone — established all patterns |

### Cumulative Quality

| Milestone | Requirements | Coverage | Tech Debt Items |
|-----------|-------------|----------|-----------------|
| v1.0 | 33/33 | 100% | 7 |

### Top Lessons (Verified Across Milestones)

1. Pin auth strategy early — changing it creates cascading documentation drift
2. Human verification checkpoints catch real bugs and are worth the time investment
3. Gap closure phases cleanly address audit findings without disrupting main sequence
