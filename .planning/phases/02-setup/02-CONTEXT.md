# Phase 2: Setup - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

A stylist completes business setup and enters enough data to book an appointment. This phase delivers: business profile onboarding, services catalogue management, and client CRM (create, search, notes, tags, colour formulas). Booking, payments, and diary views are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Onboarding flow
- Step-by-step wizard (not single form) — one screen per step with progress indicator
- Steps: 1) Trading name (required), 2) Working hours, 3) Slot size
- Only trading name is required — phone, address, working hours, slot size all have sensible defaults (Mon-Fri 9-5, 15-min slots)
- Working hours use toggle per day + start/end time dropdowns (not visual grid)
- After completing onboarding, land on the diary (home screen) — no intermediate prompts
- Sets `onboarding_completed = true` on the profiles table when finished

### Services catalogue
- Services grouped by category with collapsible sections — uncategorised services show at top
- Add/edit service via bottom sheet (slide-up panel) — name, duration, price, category, deposit config
- Swipe left to deactivate a service — deactivated services move to greyed-out "Hidden" section at bottom
- Swipe again on hidden service to reactivate
- Subtle "Deposit" badge visible on list for services with deposit rules configured
- Each service row shows: name, duration, price, category colour/label

### Client management
- Alphabetical list with pinned search bar at top and A-Z section headers
- Search matches partial name or phone — must return results in under 3 seconds
- Each list row shows: client name, phone snippet, tag chips
- Add new client via bottom sheet (consistent with services pattern)
- Client detail page uses tabbed sections: "Details" (contact info, tags, marketing consent), "Notes" (general + treatment timeline), "Colour" (formulas)
- Tap to edit client details inline

### Client tags
- Preset tags available out of the box (e.g. "Allergy", "VIP", "New client")
- Stylist can also type to create custom tags on the fly
- Tags display as coloured chips on client list rows and detail page

### Notes & colour formulas
- All notes (general, treatment, colour formula) display in a single reverse-chronological timeline with type badges
- Add notes via floating "+" action button on Notes tab — pick type (General / Treatment / Colour Formula), then enter content
- Colour formulas use a single free-text field (stylists have their own shorthand, e.g. "6.1 + 7.3 30vol 1:1.5") plus optional notes
- Notes are editable and deletable after creation
- The Colour tab on client detail shows colour formulas from the dedicated `colour_formulas` table

### Claude's Discretion
- Wizard animation/transitions between onboarding steps
- Exact preset tag names and colours
- Loading states and skeleton designs
- Error state handling and validation messaging
- Empty states for services list and client list (when no data yet)
- Bottom sheet component implementation details
- Search debounce timing and UX

</decisions>

<specifics>
## Specific Ideas

- Bottom sheet pattern is the standard for add/edit across this phase (services and clients) — keep it consistent
- Working hours defaults should be sensible UK salon hours (e.g. Tue-Sat 9:00-17:00, Sun-Mon off)
- Colour formula input should not try to parse or structure the formula — treat it as opaque text the stylist owns
- The onboarding placeholder page at `/onboarding` already exists and needs to be replaced with the real wizard flow

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BottomNav` (src/components/bottom-nav.tsx): Fixed bottom navigation with 4 tabs — Diary, Clients, Money, Settings
- `InstallBanner` (src/components/install-banner.tsx): PWA install prompt component
- `LoginForm` (src/app/(auth)/login/login-form.tsx): Shows existing form pattern — useState + useTransition + Tailwind styling
- Supabase client/server helpers (src/lib/supabase/client.ts, server.ts): Ready-to-use Supabase clients for data access
- `cn()` utility (src/lib/utils.ts): Tailwind class merging via clsx + tailwind-merge

### Established Patterns
- Next.js App Router with route groups: `(app)` for authenticated pages, `(auth)` for login
- Tailwind CSS for all styling — no CSS modules or styled-components
- shadcn/ui configured (package.json has shadcn, radix-ui, class-variance-authority) but no components installed yet
- react-hook-form + zod available for form validation
- Black/white minimal design language — black primary buttons, white backgrounds, gray-400/500 for secondary text
- Nunito font configured as --font-sans
- Mobile-first: min-h-[44px] touch targets, pb-safe for iOS

### Integration Points
- `/onboarding` page: Replace placeholder with real wizard flow
- `(app)/settings/page.tsx`: Placeholder — needs business profile editing (working hours, trading name, phone, slot size)
- `(app)/clients/page.tsx`: Placeholder — needs client list with search
- Database tables ready: profiles, services, service_categories, clients, client_notes, colour_formulas, tags, client_tags
- Profile auto-creation trigger exists — profiles row created on signup with `onboarding_completed = false`
- All 12 tables have RLS policies enforcing owner_user_id = auth.uid()

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-setup*
*Context gathered: 2026-03-01*
