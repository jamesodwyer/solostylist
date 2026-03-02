# Phase 3: Booking - Research

**Researched:** 2026-03-02
**Domain:** Slot-based diary UI, appointment CRUD, PostgreSQL exclusion constraint, multi-service booking, status management, reschedule UX
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BOOK-01 | User can view today's diary with slot-based schedule | Slot grid rendered from working_hours + default_slot_minutes on profiles; scroll to current time on mount; time slots as div grid rows |
| BOOK-02 | User can navigate to other days via date picker | Date picker via shadcn Calendar or native `<input type="date">`; URL search param `?date=YYYY-MM-DD` for shareable/server-renderable day view |
| BOOK-03 | User can create appointments by selecting client and one or more services | Multi-step bottom sheet: 1) pick client (search), 2) pick services (checkbox list), 3) confirm time; appointments + appointment_services insert in a single Server Action transaction |
| BOOK-04 | User can add notes to appointments | `notes TEXT` column already exists on appointments table; notes field in booking sheet and appointment detail view |
| BOOK-05 | User can update appointment status (booked, completed, cancelled, no-show) | Status enum column on appointments (`booked`, `completed`, `cancelled`, `no_show`); status change via Server Action + revalidatePath |
| BOOK-06 | User can move or reschedule appointments | Reschedule via appointment detail sheet — pick new date/time; UPDATE appointments SET starts_at, ends_at WHERE id = ? AND owner_user_id = ?; exclusion constraint re-evaluates automatically |
| BOOK-07 | System prevents double-booking (PostgreSQL exclusion constraint) | `EXCLUDE USING gist (owner_user_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'booked')` already in schema; Supabase returns error code `P0001` or constraint violation on conflict; catch in Server Action and return user-friendly error |
| BOOK-08 | Appointments respect working hours with manual override option | Validate starts_at/ends_at against working_hours JSONB in Server Action; return warning if outside hours; allow override with explicit user confirmation (checkbox or second submit) |
</phase_requirements>

---

## Summary

Phase 3 builds the diary — the core screen of the app. The database is fully ready: the `appointments` table, `appointment_services` junction table, the btree_gist exclusion constraint preventing double-booking, and indexes for fast date-range queries are all live from the Phase 1 migration. No new migrations are needed.

The primary technical challenge is building the slot-based diary grid. This is a CSS Grid layout where rows represent time slots (driven by `default_slot_minutes` from the user's profile) and appointment blocks span multiple rows proportional to their duration. This is a custom UI — no third-party calendar library is needed or recommended. Libraries like FullCalendar or React Big Calendar are heavyweight, opinionated in appearance, and poorly suited to the mobile-first minimal design of this project.

The booking flow is a multi-step bottom sheet: select a client (using the existing client search pattern), select one or more services (checkbox list), confirm/adjust the time, add optional notes. On submit, a single Server Action inserts into `appointments` then into `appointment_services` for each selected service, snapshotting service name/price/duration at booking time. The PostgreSQL exclusion constraint provides the double-booking guarantee at the database level — the Server Action catches the constraint error and surfaces a user-friendly message.

**Primary recommendation:** Build the diary grid as a pure CSS Grid with time-slot rows, render appointments as absolutely-positioned blocks, implement booking via a multi-step bottom sheet reusing the existing Sheet + client search patterns, and handle all mutations through Server Actions matching the Phase 2 pattern.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Routing, Server Components, Server Actions | Already installed; matches Phase 2 patterns |
| @supabase/ssr + @supabase/supabase-js | 0.8.0 / 2.98.0 | Database queries for appointments | Already installed |
| react-hook-form | 7.71.2 | Form state in booking sheet | Already installed |
| zod | 3.25.76 | Schema validation for booking inputs | Already installed; must stay v3 |
| @hookform/resolvers | 5.2.2 | Connects zod to react-hook-form | Already installed |
| shadcn Sheet | installed | Bottom sheet for booking + appointment detail | Already in src/components/ui/sheet.tsx |
| lucide-react | 0.575.0 | Icons (ChevronLeft, ChevronRight, Clock, etc.) | Already installed |
| tailwindcss | 4.x | Styling | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Calendar or native date input | — | Day navigation date picker | Use native `<input type="date">` first (zero deps); add shadcn Calendar if richer UX is needed |
| tw-animate-css | 1.4.0 | Sheet slide animations | Already configured |
| clsx + tailwind-merge | installed | cn() class merging | Already in src/lib/utils.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom CSS Grid diary | FullCalendar / React Big Calendar | FullCalendar is 300KB+, opinionated styling, hard to match the app's minimal design; overkill for single-stylist solo diary |
| Custom CSS Grid diary | @schedule-x/react | Newer, lighter, but still a dependency with its own styling system; mobile touch support needs investigation |
| Native `<input type="date">` | shadcn Calendar (Radix Popover + react-day-picker) | Native input is zero-deps, works on mobile natively, fast; shadcn Calendar is richer but adds react-day-picker dependency |
| Server Actions | Route handlers (API routes) | Server Actions match the established Phase 2 pattern; no reason to deviate |
| Multi-step sheet | Full page booking flow | Bottom sheet keeps context (you can see the diary behind); consistent with Phase 2 UX patterns |

**No new npm packages are required for this phase.** All needed libraries are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── (app)/
│       └── diary/
│           └── page.tsx              # Server Component: loads profile + appointments for day
├── components/
│   └── diary/
│       ├── diary-view.tsx            # Client Component: full diary with state
│       ├── diary-grid.tsx            # Slot grid + appointment blocks rendering
│       ├── appointment-block.tsx     # Individual appointment card in grid
│       ├── appointment-sheet.tsx     # Bottom sheet: view/edit/status-change existing appointment
│       └── booking-sheet.tsx         # Bottom sheet: multi-step new booking flow
└── lib/
    └── actions/
        └── appointments.ts           # createAppointment, updateAppointmentStatus, rescheduleAppointment
```

### Pattern 1: Diary Page (Server Component + URL date param)

The diary page loads the selected date from a URL search param (`?date=YYYY-MM-DD`). No date means today. The Server Component fetches the user's profile (for slot size + working hours) and all appointments for the day, then passes them to the Client Component.

```typescript
// src/app/(app)/diary/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiaryView } from '@/components/diary/diary-view'

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const dateStr = params.date ?? new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

  // Day boundary in UTC (Supabase stores TIMESTAMPTZ; Europe/London offset applied in display)
  const dayStart = new Date(`${dateStr}T00:00:00+00:00`).toISOString()
  const dayEnd   = new Date(`${dateStr}T23:59:59+00:00`).toISOString()

  const [profileResult, appointmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('default_slot_minutes, working_hours, timezone')
      .eq('owner_user_id', user.id)
      .single(),
    supabase
      .from('appointments')
      .select(`
        id, client_id, starts_at, ends_at, status, notes,
        clients(first_name, last_name),
        appointment_services(service_name, service_price, service_duration_minutes)
      `)
      .eq('owner_user_id', user.id)
      .gte('starts_at', dayStart)
      .lte('starts_at', dayEnd)
      .order('starts_at', { ascending: true })
  ])

  return (
    <DiaryView
      date={dateStr}
      profile={profileResult.data}
      appointments={appointmentsResult.data ?? []}
    />
  )
}
```

### Pattern 2: Slot Grid (CSS Grid)

The diary renders as a CSS Grid where each row = one time slot. Appointment blocks are absolutely positioned within the grid to span the correct rows. This is the same approach used by Google Calendar on mobile.

```typescript
// Slot grid mathematics
// slotHeight = 60px (per slot)
// slotCount = (endMinutes - startMinutes) / slotSizeMinutes
// appointment top offset = (starts_at minutes - dayStart minutes) / slotSizeMinutes * slotHeight
// appointment height = durationMinutes / slotSizeMinutes * slotHeight

function minutesFromMidnight(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

// In DiaryGrid:
const SLOT_HEIGHT_PX = 60
const slotMinutes = profile.default_slot_minutes  // e.g. 15
const dayStartMinutes = 8 * 60  // 08:00 (from working_hours or fallback)
const dayEndMinutes = 20 * 60   // 20:00 (safe upper bound)
const totalSlots = (dayEndMinutes - dayStartMinutes) / slotMinutes

// Appointment positioning:
const apptStart = minutesFromMidnight(appointment.starts_at)
const apptDuration = /* ends_at - starts_at in minutes */
const topPx = ((apptStart - dayStartMinutes) / slotMinutes) * SLOT_HEIGHT_PX
const heightPx = (apptDuration / slotMinutes) * SLOT_HEIGHT_PX
```

The grid should:
1. Display time labels (left gutter) at each major hour boundary
2. Show subtle horizontal rule at each slot boundary
3. Auto-scroll to current time on initial render (`useEffect` + `scrollIntoView` or `scrollTop`)
4. Be scrollable vertically within a fixed-height container (the screen minus bottom nav)

### Pattern 3: Server Action for Creating an Appointment

The key requirement is that `appointments` and `appointment_services` are inserted atomically. Supabase does not expose PostgreSQL transactions via the JS client directly, but since both inserts happen in the same Server Action on the same server-side client, if the second insert fails, the action returns an error and the UI stays open (the appointment row will exist but with no services — a known limitation unless a DB trigger or RPC is used).

**Recommendation:** Use a Supabase RPC (database function) to insert the appointment + services atomically, OR accept the two-step insert and use a DB-level cleanup if `appointment_services` is empty (simplest approach: just handle the error in the Server Action and delete the orphaned appointment on services insert failure).

```typescript
// src/lib/actions/appointments.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createAppointmentSchema = z.object({
  client_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().optional().default(''),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    service_name: z.string(),
    service_price: z.number().int(),
    service_duration_minutes: z.number().int(),
  })).min(1, 'At least one service is required'),
})

export async function createAppointment(data: z.infer<typeof createAppointmentSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createAppointmentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  // Insert appointment (exclusion constraint auto-enforced here)
  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .insert({
      owner_user_id: user.id,
      client_id: parsed.data.client_id,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      notes: parsed.data.notes || null,
      status: 'booked',
    })
    .select('id')
    .single()

  if (apptError) {
    // Exclusion constraint violation — Postgres error code 23P01
    if (apptError.code === '23P01') {
      return { error: 'This time slot overlaps an existing appointment. Please choose a different time.' }
    }
    return { error: apptError.message }
  }

  // Insert appointment_services (snapshot service details at booking time)
  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(
      parsed.data.services.map(s => ({
        owner_user_id: user.id,
        appointment_id: appt.id,
        service_id: s.service_id,
        service_name: s.service_name,
        service_price: s.service_price,
        service_duration_minutes: s.service_duration_minutes,
      }))
    )

  if (servicesError) {
    // Rollback: delete the orphaned appointment
    await supabase.from('appointments').delete().eq('id', appt.id).eq('owner_user_id', user.id)
    return { error: servicesError.message }
  }

  revalidatePath('/diary')
  return { success: true, appointmentId: appt.id }
}
```

### Pattern 4: Status Update Server Action

```typescript
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'booked' | 'completed' | 'cancelled' | 'no_show'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('owner_user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/diary')
  return { success: true }
}
```

Note: Changing status from `booked` to `cancelled`/`completed`/`no_show` removes it from the exclusion constraint (the constraint has `WHERE (status = 'booked')`), so cancelled appointments do NOT block the slot for re-booking.

### Pattern 5: Reschedule Server Action

```typescript
export async function rescheduleAppointment(
  appointmentId: string,
  newStartsAt: string,
  newEndsAt: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('appointments')
    .update({
      starts_at: newStartsAt,
      ends_at: newEndsAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)
    .eq('owner_user_id', user.id)
    .eq('status', 'booked')  // Only allow rescheduling booked appointments

  if (error) {
    if (error.code === '23P01') {
      return { error: 'The new time slot overlaps an existing appointment.' }
    }
    return { error: error.message }
  }

  revalidatePath('/diary')
  return { success: true }
}
```

### Pattern 6: Working Hours Validation in Server Action

The `working_hours` JSONB stores enabled/disabled per day + start/end times as `"HH:MM"` strings. The Server Action validates the proposed booking time against these hours:

```typescript
function isWithinWorkingHours(
  startsAt: string,
  endsAt: string,
  workingHours: WorkingHours
): { valid: boolean; reason?: string } {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const dayKey = dayKeys[start.getDay()]
  const daySchedule = workingHours[dayKey]

  if (!daySchedule.enabled) {
    return { valid: false, reason: `You are not scheduled to work on ${dayKey}s.` }
  }

  const [startH, startM] = daySchedule.start.split(':').map(Number)
  const [endH, endM] = daySchedule.end.split(':').map(Number)
  const workStart = start.getHours() * 60 + start.getMinutes()
  const workEnd = end.getHours() * 60 + end.getMinutes()
  const schedStart = startH * 60 + startM
  const schedEnd = endH * 60 + endM

  if (workStart < schedStart || workEnd > schedEnd) {
    return { valid: false, reason: `This appointment is outside your working hours (${daySchedule.start}–${daySchedule.end}).` }
  }

  return { valid: true }
}
```

BOOK-08 requires showing this warning AND allowing override. The Server Action should accept an `override_working_hours: boolean` flag. When `false`, validate and return warning if outside hours. When `true`, skip the check and proceed.

### Pattern 7: Booking Sheet (Multi-Step)

The booking flow is a three-step bottom sheet:
1. **Step 1: Select Client** — reuse client search (Supabase ilike, same as Phase 2 pattern)
2. **Step 2: Select Services** — checkbox list of active services; sum durations to compute `ends_at`
3. **Step 3: Confirm** — show selected time slot (from diary tap), client, services, total duration; add optional notes; submit

```typescript
// State shape for booking sheet
type BookingStep = 'client' | 'services' | 'confirm'

interface BookingState {
  step: BookingStep
  selectedClient: Client | null
  selectedServices: Service[]
  startsAt: string | null  // ISO string from the tapped slot
  notes: string
  overrideWorkingHours: boolean
}
```

The user taps a slot in the diary grid → sets `startsAt` → opens booking sheet at Step 1. The `endsAt` is computed as `startsAt + sum(service.duration_minutes)` across all selected services.

### Pattern 8: Scroll-to-Current-Time

On initial render, the diary should scroll so that the current time is visible near the top of the viewport:

```typescript
// In DiaryView client component
const nowRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  // Only scroll on initial render for today's date
  if (isToday && nowRef.current) {
    nowRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}, [isToday])

// Render a div at the current time position
const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
const nowTopPx = ((nowMinutes - dayStartMinutes) / slotMinutes) * SLOT_HEIGHT_PX
// <div ref={nowRef} style={{ top: nowTopPx - 100 }} ... /> (scroll target, offset up slightly)
```

### Anti-Patterns to Avoid

- **Installing a calendar library (FullCalendar, React Big Calendar, @schedule-x):** Heavyweight, opinionated styling, hard to match the app's design. The CSS Grid approach requires ~100 lines of custom code and gives full control.
- **Storing times in local time (no timezone):** All `starts_at`/`ends_at` values are `TIMESTAMPTZ`. Store in UTC via ISO strings. The UK uses `Europe/London` (GMT/BST). Display conversion uses `Date` API or `Intl.DateTimeFormat`.
- **Using `getSession()` server-side:** Must use `getUser()` — established pattern from STATE.md.
- **Two separate Supabase inserts without error rollback:** If `appointment_services` insert fails, delete the orphaned `appointments` row (see Pattern 3 above).
- **Not catching the exclusion constraint error code:** Supabase returns `code: '23P01'` for exclusion constraint violations. Catching `error.code === '23P01'` produces a user-friendly message instead of a raw Postgres error.
- **Computing `ends_at` on the client only:** The Server Action must recompute or validate `ends_at` based on service durations — never trust client-computed timestamps blindly.
- **Ignoring the `WHERE (status = 'booked')` in the exclusion constraint:** Cancelled and completed appointments do NOT block slots — they are intentionally excluded from the constraint. This is correct and expected behaviour.
- **Rendering the full day (00:00–23:59) as slots:** Use working hours to determine visible range; show a slightly extended window (e.g. 30 minutes before/after working hours) for visual context. Rendering 96 slots for a 15-minute day is wasteful.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Double-booking prevention | Time-overlap check in application code | PostgreSQL exclusion constraint (btree_gist) — already in schema | Race conditions: two concurrent requests would both pass an application-level check and both insert; DB constraint is atomic |
| Client search in booking sheet | Custom search implementation | Supabase ilike pattern from Phase 2 (`client-search.tsx`) | Pattern already validated and tested |
| Bottom sheet for booking | Custom modal/dialog | shadcn Sheet (`src/components/ui/sheet.tsx`) — already installed | Focus trap, backdrop, escape key, iOS Safari handling already solved |
| Calendar/diary grid | Third-party calendar library | CSS Grid + absolute positioning | Lighter, full design control, no conflict with Tailwind v4 |
| Working hours validation | Complex library | Plain arithmetic on `HH:MM` strings (see Pattern 6) | The data structure is simple; library is overkill |
| Timezone conversion | moment.js / date-fns | `Intl.DateTimeFormat` + `Date` API | Both are already built into modern browsers and Node.js; no dependency needed for this level of complexity |

**Key insight:** The database does the hard work (exclusion constraint for double-booking, indexed date-range queries for diary load). The application layer handles UX and validation. Do not re-implement what the database already guarantees.

---

## Common Pitfalls

### Pitfall 1: Timezone Bug — Booking on Wrong Day
**What goes wrong:** User books at 23:30 on 01/03 (London time, which is UTC+00:00 in winter), appointment appears on 02/03 in the diary.
**Why it happens:** If you store `new Date().toISOString()` directly from the client, it's UTC. But the user picks "today" based on their local date. In winter (GMT = UTC) this is fine; in summer (BST = UTC+1), a booking at 23:30 local would store as the next day in UTC.
**How to avoid:** Always compute `starts_at` as a `TIMESTAMPTZ` from the selected date + slot time with the user's timezone applied. The profile stores `timezone: 'Europe/London'`. Use `Intl.DateTimeFormat` or construct the ISO string with explicit offset: `${date}T${slotTime}:00+00:00` for GMT, `${date}T${slotTime}:00+01:00` for BST. The Server Action should validate the timezone is correct.
**Warning signs:** Appointments appearing on wrong days in summer months.

### Pitfall 2: Exclusion Constraint Error Not Caught
**What goes wrong:** Supabase returns `{ code: '23P01', message: 'conflicting key value violates exclusion constraint...' }` and the UI shows a raw Postgres error.
**Why it happens:** Developer handles `error.message` but doesn't check `error.code`.
**How to avoid:** In the `createAppointment` and `rescheduleAppointment` Server Actions, check `error.code === '23P01'` and return a friendly message. See Pattern 3 above.
**Warning signs:** Users seeing "conflicting key value violates exclusion constraint" in the UI.

### Pitfall 3: Multi-Service Duration Not Summed for ends_at
**What goes wrong:** `ends_at` is set to `starts_at + firstService.duration_minutes` — only the first service. Appointment block appears too short in the diary.
**Why it happens:** Developer iterates over services but only takes the first, or forgets to sum.
**How to avoid:** `ends_at = starts_at + services.reduce((sum, s) => sum + s.service_duration_minutes, 0)` minutes. Do this in the booking sheet UI (to show the user how long the appointment will be) and re-verify in the Server Action.
**Warning signs:** Multi-service appointments showing incorrect duration in the diary grid.

### Pitfall 4: Diary Grid Slot Tap Conflicts with Appointment Block Tap
**What goes wrong:** Tapping an existing appointment block to view it also fires the slot tap handler, opening the booking sheet.
**Why it happens:** The appointment block sits on top of the slot grid div; both have click handlers; event bubbles.
**How to avoid:** Call `event.stopPropagation()` in the appointment block's `onClick` handler. The slot tap only fires if the click target is the bare slot, not an appointment block.
**Warning signs:** Booking sheet opens unexpectedly when tapping existing appointments.

### Pitfall 5: Cancelling an Appointment via Status Change Doesn't Visually Update Immediately
**What goes wrong:** User marks an appointment as cancelled; it disappears from the diary but the slot shows as empty. User expects to see the cancelled appointment still (greyed out) or expects immediate visual feedback.
**Why it happens:** `revalidatePath('/diary')` triggers re-fetch, which can cause a flash.
**How to avoid:** Use `useOptimistic` (React 19 pattern, available in Next.js 16) to immediately update UI before the server confirms. Or use `useTransition` + local state to mark the appointment as pending-cancellation while the action completes. A simpler approach: keep cancelled appointments visible in the diary with a strikethrough/grey style (filter by status in the UI, not in the query).
**Warning signs:** Flashing diary grid after status changes.

### Pitfall 6: Working Hours Day Key Mismatch
**What goes wrong:** `working_hours.monday` is undefined when code does `working_hours[dayName]`.
**Why it happens:** The `WorkingHours` type uses 3-letter keys (`mon`, `tue`, `wed`, etc.) but `new Date().toLocaleDateString('en-US', { weekday: 'long' })` returns `"Monday"`.
**How to avoid:** Use the `dayKeys` array from Pattern 6: `const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']`. Index with `new Date().getDay()` (0=Sunday). This matches the WorkingHours type from `src/lib/types/database.ts`.
**Warning signs:** `Cannot read properties of undefined` on working hours checks.

### Pitfall 7: Date Picker URL Param on Mobile Safari
**What goes wrong:** Native `<input type="date">` works on most browsers but its UI is system-native and looks inconsistent. On older iOS, min/max constraints are ignored.
**Why it happens:** Native date input appearance is OS-controlled.
**How to avoid:** Native input is still preferred for Phase 3 (zero deps). Style the container around it, not the input itself. If UX is unacceptable, add shadcn's Calendar component (`npx shadcn add calendar` which adds `react-day-picker`). Flag this as a discretion area for the planner.
**Warning signs:** Users on iOS reporting confusing date navigation.

### Pitfall 8: Scroll Position Lost on Date Navigation
**What goes wrong:** User navigates to tomorrow, the diary re-renders (Server Component re-fetch), and the scroll position jumps to the top instead of the current time.
**Why it happens:** URL param change triggers full page navigation; scroll state is lost.
**How to avoid:** Use `router.push` with scroll restoration, or default the scroll to a reasonable position (current time for today, start of working hours for other days). On today, scroll to current time; on other days, scroll to start of working hours.
**Warning signs:** Diary always scrolls to top after navigating dates.

---

## Code Examples

### Database Schema — Appointments Table (already deployed)
```sql
-- From: supabase/migrations/20260301000000_initial_schema.sql
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  EXCLUDE USING gist (owner_user_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'booked')
);
```

Key facts:
- Exclusion constraint is `WHERE (status = 'booked')` — cancelled/completed slots are reclaimable
- `appointment_services` snapshots service details (name, price, duration) at booking time
- `idx_appointments_owner_date` index exists on `(owner_user_id, starts_at)` for fast daily queries

### Appointment Services Snapshot
```sql
-- From: supabase/migrations/20260301000000_initial_schema.sql
CREATE TABLE public.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,       -- snapshot at booking time
  service_price INTEGER NOT NULL,   -- snapshot, integer pennies
  service_duration_minutes INTEGER NOT NULL, -- snapshot
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Note: `service_id ON DELETE RESTRICT` — cannot delete a service if it has appointment records. This is intentional for data integrity.

### Diary Query with Joined Client and Services
```typescript
// Source: Supabase JS client docs — nested select with foreign key joins
const { data: appointments } = await supabase
  .from('appointments')
  .select(`
    id, client_id, starts_at, ends_at, status, notes,
    clients!inner(first_name, last_name),
    appointment_services(service_id, service_name, service_price, service_duration_minutes)
  `)
  .eq('owner_user_id', user.id)
  .gte('starts_at', dayStart)
  .lt('starts_at', dayEnd)
  .order('starts_at', { ascending: true })
```

### Time Slot Generation
```typescript
// Generate array of slot start times for the diary grid
function generateSlots(
  dayStartHHMM: string,    // e.g. '09:00'
  dayEndHHMM: string,      // e.g. '17:00'
  slotMinutes: number      // e.g. 15
): string[] {
  const [startH, startM] = dayStartHHMM.split(':').map(Number)
  const [endH, endM] = dayEndHHMM.split(':').map(Number)
  const startTotal = startH * 60 + startM
  const endTotal = endH * 60 + endM
  const slots: string[] = []

  for (let m = startTotal; m < endTotal; m += slotMinutes) {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    slots.push(`${h}:${min}`)
  }
  return slots
}
```

### Appointment Block Positioning
```typescript
// Compute CSS positioning for an appointment block in the grid
function getAppointmentStyle(
  appointment: { starts_at: string; ends_at: string },
  dayStartMinutes: number,  // e.g. 8 * 60 = 480
  slotMinutes: number,
  slotHeightPx: number
): React.CSSProperties {
  const start = new Date(appointment.starts_at)
  const end = new Date(appointment.ends_at)
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const durationMinutes = (end.getTime() - start.getTime()) / 60000

  return {
    position: 'absolute',
    top: `${((startMinutes - dayStartMinutes) / slotMinutes) * slotHeightPx}px`,
    height: `${(durationMinutes / slotMinutes) * slotHeightPx}px`,
    left: '64px',  // leave room for time labels
    right: '8px',
  }
}
```

### Formatting Utilities (add to src/lib/utils.ts)
```typescript
// Time display: ISO string → "09:30"
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

// Date display: 'YYYY-MM-DD' → "Monday 2 March"
export function formatDiaryDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  })
}

// Duration: sum of service minutes → "1h 30m"
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getSession()` server-side | `getUser()` | Security fix (ongoing) | Already enforced in this project |
| moment.js for timezone | `Intl.DateTimeFormat` + `Date` API | Modern browsers (2023+) | No library needed; `Intl.DateTimeFormat` with `timeZone: 'Europe/London'` handles GMT/BST automatically |
| React Big Calendar | Custom CSS Grid | Ongoing preference for lighter builds | Control over styling, no style conflicts with Tailwind v4 |
| FullCalendar v5 | FullCalendar v6 (ESM) | 2023 | Irrelevant — neither is being used; custom grid is the approach |
| `new Date()` for ISO strings | `new Date().toISOString()` | — | Standard; must pair with timezone awareness for display |

**Deprecated/outdated:**
- `moment.js`: No new projects should use it. `Intl.DateTimeFormat` replaces all needed functionality for this project.
- `middleware.ts` default export: Already renamed to `proxy.ts` in this project — do not revert.
- Zod v4 API: Must stay on v3 due to @hookform/resolvers incompatibility (active as of March 2026, see STATE.md).

---

## Open Questions

1. **Atomic appointment + services insert: RPC vs two-step with rollback**
   - What we know: Supabase JS client doesn't expose `BEGIN`/`COMMIT` transactions directly. A Postgres function (RPC via `supabase.rpc()`) wraps both inserts in a transaction atomically. Two-step insert with manual rollback on failure is simpler but risks orphaned `appointments` rows if the rollback itself fails.
   - What's unclear: How critical is atomicity for this MVP? The rollback approach in Pattern 3 is likely sufficient since both operations are in the same Server Action.
   - Recommendation: Use the two-step approach with manual rollback for simplicity. If bugs are discovered, promote to an RPC in a follow-up migration. Document this trade-off explicitly in the plan.

2. **Date picker implementation: native input vs shadcn Calendar**
   - What we know: Native `<input type="date">` is zero-deps, mobile-native, but has inconsistent styling. shadcn Calendar (`npx shadcn add calendar`) adds `react-day-picker` (a new dependency).
   - What's unclear: UX preference not specified for this phase.
   - Recommendation: Start with native date input. The plan can specify this, with a note that it can be upgraded to shadcn Calendar in Phase 5 polish if needed.

3. **Diary range: use working_hours start/end or fixed window?**
   - What we know: `working_hours` stores per-day start/end times. The diary should respect these for working days. On days off (enabled: false), show a message rather than a full grid.
   - What's unclear: Edge cases — what if the stylist wants to book outside normal hours? BOOK-08 requires override.
   - Recommendation: Render the grid from `daySchedule.start` to `daySchedule.end` (with 30 min padding each side). For disabled days, show the grid with a "You're not scheduled today" banner but keep slots bookable (supporting BOOK-08 override).

4. **Appointment block display density: what to show on small blocks**
   - What we know: A 15-minute slot at 60px height is 60px tall. Client name + service name won't fit at small font.
   - What's unclear: UX priority not specified.
   - Recommendation: Show client name only when height < 80px; show client name + first service name when >= 80px; show full detail when >= 120px. This is Claude's discretion to decide in planning.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in config.json (the key does not exist). Skip this section.

---

## Sources

### Primary (HIGH confidence)
- `/Users/jamesodwyer/solostylist/supabase/migrations/20260301000000_initial_schema.sql` — full schema inspection; appointments table, appointment_services table, exclusion constraint, all indexes confirmed
- `/Users/jamesodwyer/solostylist/package.json` — exact dependency versions; no calendar library present
- `/Users/jamesodwyer/solostylist/src/lib/types/database.ts` — WorkingHours interface, all type definitions
- `/Users/jamesodwyer/solostylist/src/components/ui/` — confirmed shadcn components installed: sheet, tabs, badge, collapsible
- `/Users/jamesodwyer/solostylist/.planning/STATE.md` — confirmed decisions: getUser() enforcement, zod v3, TIMESTAMPTZ for appointments, btree_gist constraint already in Phase 1 migration, pennies convention
- `/Users/jamesodwyer/solostylist/.planning/phases/02-setup/02-RESEARCH.md` — Phase 2 patterns to inherit: Sheet, Server Actions, client search, react-hook-form + zod pattern

### Secondary (MEDIUM confidence)
- PostgreSQL documentation on exclusion constraints — `23P01` is the SQLSTATE for exclusion constraint violation (ExclusionViolation); Supabase surfaces this in `error.code`
- CSS Grid for calendar-style layouts — well-established pattern used by Google Calendar web, week/day views
- `Intl.DateTimeFormat` with `timeZone: 'Europe/London'` — standard Web API, handles GMT/BST automatically

### Tertiary (LOW confidence)
- iOS Safari scroll behaviour with `scrollIntoView` in PWA mode — general web knowledge, not verified against specific iOS version
- `useOptimistic` (React 19) availability in Next.js 16 — highly likely given Next.js 16 uses React 19.2.3 (confirmed in package.json: `"react": "19.2.3"`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed from package.json and node_modules; no new dependencies needed
- Database schema: HIGH — full migration file inspected; all tables, constraints, and indexes confirmed present
- Architecture patterns: HIGH — derived from existing codebase patterns (Phase 2 actions, sheets, server components)
- CSS Grid diary: MEDIUM — approach is well-established but specific implementation details (scroll, touch targets) need testing
- Timezone handling: MEDIUM — `Intl.DateTimeFormat` with Europe/London is standard but BST edge cases need verification
- Pitfalls: HIGH for most; LOW for iOS-specific scroll/keyboard issues

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable stack; main risk is @hookform/resolvers zod v4 compatibility being resolved, which would be an upgrade opportunity)
