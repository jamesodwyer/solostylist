# Phase 1: Foundation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

The app exists, is secure by default, and a user can sign in on their phone. Delivers: Supabase schema (all 12 tables) with RLS policies, magic-link auth, app shell with navigation, and PWA add-to-home-screen support. Business profile setup, services, clients, and all other CRUD are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Login Experience
- Warm & branded login screen — full-bleed brand color background, logo prominent, friendly copy (e.g. "Welcome back, gorgeous")
- Dedicated confirmation screen after email submission — new page with icon/illustration, "Check your inbox" message, and "Resend" link
- New users route to onboarding flow after first auth; returning users go straight to diary
- Persistent Supabase session — users stay signed in until explicit logout (no session expiry)

### App Shell & Navigation
- 4 bottom navigation tabs: Diary, Clients, Money, Settings (Today + Book merged into single "Diary" tab)
- Default landing screen: Diary (today's view) for signed-in users
- Icons with text labels on all tabs (iOS tab bar pattern)
- Back button (top-left arrow) on sub-pages/detail views; bottom tabs remain visible at all times

### Visual Identity
- Black and white theme — monochrome palette, no accent colors for now
- Light mode only for MVP (no dark mode)
- Rounded & friendly typography — Nunito, Poppins, or DM Sans family
- Clean and high-contrast

### PWA Install Prompt
- Trigger: after first successful sign-in
- Style: bottom banner with dismiss option (non-blocking)
- Re-prompt: show once more after dismissal (7 days or 5 sessions), then never again
- iOS Safari: detect and show manual step-by-step instructions ("Tap Share -> Add to Home Screen")

### Claude's Discretion
- Specific font choice from the rounded/friendly family
- Loading states, skeleton screens, and error state designs
- Exact spacing and typography scale
- PWA manifest details (theme color, splash screen)
- Onboarding flow specifics (what fields to collect — Phase 2 builds the full business profile, so Phase 1 onboarding is a lightweight welcome/redirect)

</decisions>

<specifics>
## Specific Ideas

- Login should still feel branded and personality-forward with friendly copy, even with a monochrome palette
- The "check your email" screen should feel like a deliberate step, not a dead end — give users confidence the link is coming
- Navigation should be simple enough that a stylist with wet hands can tap the right tab without thinking
- The PRD suggests "Today, Book, Clients, Money, Settings" but user prefers merging Today + Book into "Diary" — 4 tabs feels cleaner and booking happens from the diary anyway

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing codebase — greenfield project
- shadcn/ui selected as component library (accessible, customisable)
- Tailwind CSS for styling

### Established Patterns
- Next.js App Router — file-based routing, server components by default
- Supabase client libraries for auth and database
- Zod v3 for validation (v4 blocked by hookform/resolvers incompatibility)

### Integration Points
- Supabase project needs environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- All 12 tables created in SQL migrations with RLS policies
- Auth middleware protects all routes except login
- btree_gist extension must be enabled for Phase 3 exclusion constraints

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-01*
