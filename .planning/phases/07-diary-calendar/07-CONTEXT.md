# Phase 7: Diary Calendar - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete diary/calendar system for the native React Native app. This is the most important screen — the web version was clunky and couldn't show a full month. The native version must be a significant UX upgrade.

Delivers: Month view (dot indicators), Week view (appointment blocks), Day view (time slot grid), booking flow (3-step), appointment management (view/reschedule/status changes), services CRUD, and payment integration.

</domain>

<decisions>
## Implementation Decisions

### Calendar Views
- Three views: Month, Week, Day — switched via segmented control at top
- Month view: compact grid showing dot indicators for days with bookings, tap day to jump to Day view
- Week view: 7-day horizontal layout with appointment blocks visible
- Day view: vertical time slot grid (like web app) with absolutely positioned appointment blocks
- Swipe left/right on Day/Week to navigate dates
- Date navigation arrows + tap date header to return to today

### Appointment Blocks
- Status-based colour coding: booked=primary blue, completed=green, cancelled=grey (dimmed), no-show=amber (dimmed)
- Show client name, first service, time range (conditional on block height)
- Tap block opens appointment detail sheet

### Booking Flow
- FAB (+) button or tap empty time slot to start booking
- 3-step bottom sheet: Select Client → Select Services → Confirm & Book
- Client search with debounced input
- Service selection with multi-select, running totals (count, duration, price)
- End time auto-calculated from start + sum of service durations
- Working hours validation with soft override
- Client notes and colour formula preview visible during booking

### Appointment Management
- Bottom sheet with appointment details
- Status actions: Complete, No Show, Cancel (for booked), Re-open (for completed/cancelled/no-show)
- Reschedule with date/time pickers
- Edit appointment notes
- Take Payment button (for completed, no existing payment)

### Services CRUD
- Services management screen (accessible from settings or booking flow)
- Create/edit/delete services
- Fields: name, price (pennies), duration (minutes), category, active toggle
- Services grouped by category in booking flow

### Claude's Discretion
- Choice of calendar rendering approach (custom vs library)
- Animation and transition details between views
- Exact layout proportions and grid sizing
- How services screen is accessed (settings tab vs standalone)
- Whether to use a bottom sheet library or custom implementation

</decisions>

<specifics>
## Specific Ideas

- Study Fresha, Booksy, Square Appointments, Timely for UX patterns
- Material You-inspired theming with primary/secondary colour tokens
- 44px minimum tap targets throughout
- Time slots based on user's default_slot_minutes from profile
- Grid range: padded around working hours (like web: 06:00-22:00)
- Red current-time line on today's day view
- Auto-scroll to current time (today) or working hours start (other days)
- Snapshot pattern for services: freeze name/price/duration in appointment_services at booking time
- Prices in pennies, displayed as £X.XX

</specifics>

<deferred>
## Deferred Ideas

- Drag-to-reschedule appointments on grid
- Week view with drag-to-create
- Recurring appointments
- Push notifications for upcoming appointments
- Client self-booking

</deferred>

---

*Phase: 07-diary-calendar*
*Context gathered: 2026-03-29*
