# Milestones

## v1.0 Solo Stylist OS MVP (Shipped: 2026-03-10)

**Phases completed:** 6 phases, 20 plans
**Timeline:** 10 days (2026-03-01 → 2026-03-10)
**Codebase:** 7,491 LOC TypeScript, 146 files, 30 commits
**Requirements:** 33/33 v1 requirements satisfied

**Key accomplishments:**
- Secure auth with email+password, RLS on all 12 tables, PWA add-to-home-screen
- Full business setup: onboarding wizard, services catalogue with categories/deposits, client CRM with notes/formulas/tags
- Day diary with slot-based CSS Grid layout, 3-step booking flow, double-booking prevention via PostgreSQL exclusion constraint
- Payment recording (cash/card), refund/void adjustments with immutable audit trail, daily Money page totals
- CSV data export (clients, appointments, payments, notes), audit log for sensitive actions, iOS Safari PWA keyboard fix
- Client notes and colour formulas surfaced in booking sheet and appointment view (CLNT-08 gap closure)

**Tech debt accepted:**
- Settings page is read-only (updateProfile action exists but no edit UI)
- Login redirects via /onboarding for all users (extra hop for returning users)
- Timezone hardcoded to Europe/London (prop fetched but unused)
- Auth flow docs describe magic link but code uses email+password
- zodResolver as any cast (zod@3 + @hookform/resolvers v5 incompatibility)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`

---

