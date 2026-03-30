# Phase 7: Diary Calendar - Research

**Researched:** 2026-03-29
**Domain:** React Native calendar UI, scheduling, bottom sheets, gesture navigation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Three views: Month, Week, Day — switched via segmented control at top
- Month view: compact grid showing dot indicators for days with bookings, tap day to jump to Day view
- Week view: 7-day horizontal layout with appointment blocks visible
- Day view: vertical time slot grid (like web app) with absolutely positioned appointment blocks
- Swipe left/right on Day/Week to navigate dates
- Date navigation arrows + tap date header to return to today
- Status-based colour coding: booked=primary blue, completed=green, cancelled=grey (dimmed), no-show=amber (dimmed)
- Show client name, first service, time range (conditional on block height)
- Tap block opens appointment detail sheet
- FAB (+) button or tap empty time slot to start booking
- 3-step bottom sheet: Select Client → Select Services → Confirm & Book
- Client search with debounced input
- Service selection with multi-select, running totals (count, duration, price)
- End time auto-calculated from start + sum of service durations
- Working hours validation with soft override
- Client notes and colour formula preview visible during booking
- Bottom sheet with appointment details
- Status actions: Complete, No Show, Cancel (for booked), Re-open (for completed/cancelled/no-show)
- Reschedule with date/time pickers
- Edit appointment notes
- Take Payment button (for completed, no existing payment)
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

### Deferred Ideas (OUT OF SCOPE)
- Drag-to-reschedule appointments on grid
- Week view with drag-to-create
- Recurring appointments
- Push notifications for upcoming appointments
- Client self-booking
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIARY-01 | Month view with dot indicators showing days with bookings | react-native-calendars Calendar component with `marked`/`dotColor` via `markedDates` |
| DIARY-02 | Week view showing 7-day overview with appointment blocks | Custom 7-column layout with absolute-positioned blocks (no library does this well at the required quality) |
| DIARY-03 | Day view with time slot grid and positioned appointment blocks | Direct port of web `DiaryGrid` pattern to React Native ScrollView + absolute positioning |
| DIARY-04 | Segmented control to switch between Month/Week/Day views | Custom pure-JS segmented control using TouchableOpacity row (no native module needed) |
| DIARY-05 | Date navigation (arrows, swipe, tap-to-select from month) | PanGestureHandler from react-native-gesture-handler (already installed v2.28) |
| DIARY-06 | Booking flow — select client, select services, confirm with time/date | @gorhom/bottom-sheet v5.2+ with BottomSheetModal; 3-step state machine ported from web |
| DIARY-07 | Appointment detail view — view, reschedule, mark complete/no-show/cancel | @gorhom/bottom-sheet v5.2+ BottomSheetModal; @react-native-community/datetimepicker for reschedule |
| DIARY-08 | Services CRUD — create, edit, delete services with name/price/duration/category | Stack screen at `app/services/` with list + modal form; new `lib/actions/services.ts` |
| DIARY-09 | Status-based colour coding (booked=blue, completed=green, cancelled=grey, no-show=amber) | Exact palette from web app `AppointmentBlock` ported to React Native StyleSheet |
| DIARY-10 | Take Payment integration from appointment completion | Reuse existing `recordPayment` from `lib/actions/payments.ts` |
| DIARY-11 | Working hours enforcement with soft override | Port `isWithinWorkingHours` logic from web `appointments.ts` to native `lib/actions/appointments.ts` |
| DIARY-12 | Double-booking prevention (database EXCLUDE constraint) | PostgreSQL EXCLUDE constraint already in place; catch error code `23P01` in native action |
| DIARY-13 | Client notes and colour formula visible during booking | Query `client_notes` and `colour_formulas` tables after client selection (same Supabase pattern as web) |
| DIARY-14 | Current time indicator (red line) on day view | Absolutely positioned View with red background; position computed from current time minutes |
| DIARY-15 | Auto-scroll to current time (today) or working hours start (other days) | ScrollView ref `.scrollTo()` in `useEffect` when date changes |
</phase_requirements>

---

## Summary

The diary calendar is the most complex screen in the native app. The web app already has a proven implementation — the native build is a direct port with three additions: Month view and Week view (the web only has Day view), a bottom-sheet-based booking flow, and native gesture navigation. The core data model, Supabase queries, working hours logic, and appointment block positioning math can all be transferred directly from the web codebase.

The critical technical questions have been resolved. For the Month view, `react-native-calendars` provides exactly the `Calendar` component with dot-marking support needed for DIARY-01, works with Expo without native modules, and is zero-friction to install. For Day and Week views, a custom implementation using `ScrollView` + absolute positioning (mirroring the web `DiaryGrid`) is the right choice — no library provides the exact time-grid-with-blocks layout at the quality required. For bottom sheets, `@gorhom/bottom-sheet` v5.2.8 is confirmed to support Reanimated v4 (added in v5.1.8), resolving the earlier compatibility concern. For gesture navigation, `react-native-gesture-handler` v2.28 is already installed and ready to use.

**Primary recommendation:** Use react-native-calendars for Month view only; custom ScrollView time grid for Day and Week views; @gorhom/bottom-sheet v5.2.8 for all sheets; custom pure-JS segmented control for view switching.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-calendars | ^1.1314.0 | Month view calendar with dot marking | Only pure-JS RN calendar with dot indicators, Expo compatible, no native linking |
| @gorhom/bottom-sheet | ^5.2.8 | Bottom sheets for booking flow and appointment detail | v5.1.8+ confirmed supports Reanimated v4; industry standard for RN sheets |
| @react-native-community/datetimepicker | 8.4.4 | Date/time selection for reschedule | Already installed; uses native iOS/Android pickers |
| react-native-gesture-handler | ~2.28.0 | Swipe navigation between days/weeks | Already installed; needed for PanGestureHandler |
| react-native-reanimated | ~4.1.1 | Sheet animations and gesture-driven UI | Already installed; required by bottom-sheet |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-calendars | same | CalendarUtils for date math helpers | Date arithmetic within calendar logic |
| lucide-react-native | ^1.7.0 | Icons (already installed) | FAB icon, nav arrows, action buttons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-calendars (Month) | flash-calendar | flash-calendar is faster but month-only date picker; no week/day time grid. react-native-calendars dot-marking API is exactly what DIARY-01 needs |
| @gorhom/bottom-sheet | Custom Modal + Animated | gorhom is production-tested with snap points, keyboard avoidance, scrollable content. Custom is ~200 lines to match quality |
| Custom segmented control | @react-native-segmented-control | The segmented-control library requires native modules — NOT available in Expo Go without custom dev client. Custom TouchableOpacity row is simpler, fully themeable |
| Custom time grid (Day/Week) | react-native-week-view | react-native-week-view API is unstable (pre-1.0), doesn't match our exact slot-height/gutter pattern, and adds drag-and-drop we explicitly deferred |

**Installation:**
```bash
# From native/ directory:
npm install react-native-calendars @gorhom/bottom-sheet
```

Note: `@react-native-community/datetimepicker`, `react-native-gesture-handler`, and `react-native-reanimated` are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
native/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # DiaryScreen — Month/Week/Day with segmented control
│   │   └── settings.tsx       # Add link to Services
│   └── services/
│       ├── _layout.tsx        # Stack layout for services screens
│       ├── index.tsx          # ServicesList screen
│       └── [id].tsx           # ServiceForm screen (create/edit)
└── src/
    ├── components/
    │   └── diary/
    │       ├── SegmentedControl.tsx      # Month/Week/Day switcher
    │       ├── MonthView.tsx             # react-native-calendars Calendar wrapper
    │       ├── WeekView.tsx              # Custom 7-column horizontal layout
    │       ├── DayView.tsx               # Custom ScrollView time grid
    │       ├── TimeGrid.tsx              # Shared time grid logic (Day + Week)
    │       ├── AppointmentBlock.tsx      # Absolutely positioned block with status colours
    │       ├── CurrentTimeLine.tsx       # Red line indicator
    │       ├── BookingSheet.tsx          # 3-step BottomSheetModal
    │       ├── AppointmentSheet.tsx      # Detail/actions BottomSheetModal
    │       └── ClientNotesPreview.tsx    # Notes widget for booking step 2
    └── lib/
        └── actions/
            ├── appointments.ts  # NEW: createAppointment, updateStatus, reschedule
            └── services.ts      # NEW: getServices, createService, updateService, deleteService
```

### Pattern 1: Custom Segmented Control (DIARY-04)
**What:** Pure-JS three-segment tab bar rendered above the calendar. No native modules needed.
**When to use:** Whenever native segmented control library is unavailable in Expo Go.
**Example:**
```typescript
// Pure-JS segmented control — no native module
type CalendarView = 'month' | 'week' | 'day'

function SegmentedControl({ value, onChange, theme }) {
  const segments: CalendarView[] = ['month', 'week', 'day']
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 8, padding: 2 }}>
      {segments.map(seg => (
        <TouchableOpacity
          key={seg}
          onPress={() => onChange(seg)}
          style={{
            flex: 1,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: value === seg ? theme.card : 'transparent',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: value === seg ? '600' : '400', color: theme.text }}>
            {seg.charAt(0).toUpperCase() + seg.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
```

### Pattern 2: Day View Time Grid (DIARY-03, DIARY-14, DIARY-15)
**What:** ScrollView containing a fixed-height container. Appointment blocks absolutely positioned within it. Mirrors web DiaryGrid exactly.
**When to use:** Day view and each day column in week view.
**Example:**
```typescript
// Port of web DiaryGrid to React Native
const SLOT_HEIGHT = 60  // dp per slot
const TIME_GUTTER = 56  // dp for time labels

function DayView({ date, appointments, slotMinutes, workingHours, scrollRef }) {
  const slots = generateSlots(gridStart, gridEnd, slotMinutes)
  const totalHeight = slots.length * SLOT_HEIGHT

  useEffect(() => {
    // Auto-scroll: today → current time, other days → working hours start
    const targetMinutes = isToday ? nowMinutes : workStartMinutes
    const targetPx = ((targetMinutes - startMinutes) / slotMinutes) * SLOT_HEIGHT
    scrollRef.current?.scrollTo({ y: Math.max(0, targetPx - 100), animated: false })
  }, [date])

  return (
    <ScrollView ref={scrollRef}>
      <View style={{ height: totalHeight, position: 'relative' }}>
        {slots.map((slotTime, i) => (
          <SlotRow key={slotTime} top={i * SLOT_HEIGHT} slotTime={slotTime} />
        ))}
        {appointments.map(appt => (
          <AppointmentBlock key={appt.id} appointment={appt} ... />
        ))}
        {isToday && <CurrentTimeLine top={nowTopPx} />}
      </View>
    </ScrollView>
  )
}
```

### Pattern 3: Month View with Dot Indicators (DIARY-01)
**What:** react-native-calendars `Calendar` component with `markedDates` built from appointment data.
**When to use:** Month view.
**Example:**
```typescript
// Source: https://wix.github.io/react-native-calendars/docs/Components/Calendar
import { Calendar } from 'react-native-calendars'

// Build markedDates from appointments array
const markedDates = appointments.reduce((acc, appt) => {
  const dateKey = appt.starts_at.split('T')[0]  // 'YYYY-MM-DD'
  acc[dateKey] = { marked: true, dotColor: theme.primary }
  return acc
}, {} as Record<string, { marked: boolean; dotColor: string }>)

<Calendar
  markedDates={markedDates}
  onDayPress={day => {
    setSelectedDate(day.dateString)
    setView('day')
  }}
  theme={{
    backgroundColor: theme.background,
    calendarBackground: theme.background,
    textSectionTitleColor: theme.textSecondary,
    selectedDayBackgroundColor: theme.primary,
    todayTextColor: theme.primary,
    dayTextColor: theme.text,
    arrowColor: theme.primary,
  }}
/>
```

### Pattern 4: Bottom Sheet Modal (DIARY-06, DIARY-07)
**What:** @gorhom/bottom-sheet `BottomSheetModal` with snap points. Requires `BottomSheetModalProvider` at root.
**When to use:** Booking flow and appointment detail.
**Example:**
```typescript
// Source: https://gorhom.dev/react-native-bottom-sheet/
import { BottomSheetModal, BottomSheetModalProvider, BottomSheetScrollView } from '@gorhom/bottom-sheet'

// In _layout.tsx: wrap with <BottomSheetModalProvider>

function BookingSheet({ ref }) {
  const snapPoints = useMemo(() => ['85%'], [])

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
    >
      <BottomSheetScrollView>
        {/* Step content */}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
```

### Pattern 5: Swipe Navigation (DIARY-05)
**What:** Gesture.Pan() from react-native-gesture-handler detects left/right swipes to advance dates.
**When to use:** Day view and Week view horizontal navigation.
**Example:**
```typescript
// Source: https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture/
import { Gesture, GestureDetector } from 'react-native-gesture-handler'

const swipeGesture = Gesture.Pan()
  .minDistance(50)
  .onEnd(event => {
    if (event.translationX < -50) {
      // Swipe left → next day/week
      runOnJS(goToNext)()
    } else if (event.translationX > 50) {
      // Swipe right → previous day/week
      runOnJS(goToPrev)()
    }
  })

<GestureDetector gesture={swipeGesture}>
  <View style={{ flex: 1 }}>
    <DayView ... />
  </View>
</GestureDetector>
```

### Pattern 6: DateTimePicker for Reschedule (DIARY-07)
**What:** @react-native-community/datetimepicker with platform-specific display modes.
**When to use:** Reschedule flow inside AppointmentSheet.
**Key behaviour:**
- iOS: `display="spinner"` or `display="inline"` renders inline in the sheet
- Android: `display="default"` opens a native modal dialog (can't be inline in a sheet)
- Always show date picker first, then time picker in sequence

```typescript
import DateTimePicker from '@react-native-community/datetimepicker'

// iOS: renders inline; Android: triggers native dialog
<DateTimePicker
  value={selectedDate}
  mode="date"
  display={Platform.OS === 'ios' ? 'inline' : 'default'}
  onChange={(_, date) => date && setSelectedDate(date)}
  minimumDate={new Date()}
/>
```

### Pattern 7: Appointment Block Status Colours (DIARY-09)
**What:** StyleSheet-based status colours ported directly from web `AppointmentBlock.tsx`.
**Example:**
```typescript
// Ported from web src/components/diary/appointment-block.tsx
function getBlockStyle(status: AppointmentStatus, theme: Theme) {
  switch (status) {
    case 'booked':
      return { backgroundColor: theme.primaryLight, borderLeftColor: theme.primary }
    case 'completed':
      return { backgroundColor: theme.successLight, borderLeftColor: theme.success }
    case 'cancelled':
      return { backgroundColor: theme.surface, borderLeftColor: theme.border, opacity: 0.4 }
    case 'no_show':
      return { backgroundColor: theme.warningLight, borderLeftColor: theme.warning, opacity: 0.6 }
  }
}
```

### Anti-Patterns to Avoid
- **Nested ScrollViews:** Avoid putting a vertical ScrollView inside the main tab ScrollView. The DayView ScrollView should own the full screen height with `flex: 1` on its container.
- **Re-creating markedDates on every render:** Memoize with `useMemo` — markedDates object creation is O(n) over appointments.
- **Inline DateTimePicker on Android:** Android datetimepicker doesn't support inline — use the dialog mode and handle the open/close state.
- **FlatList for time grid rows:** FlatList recycling causes appointment blocks to reposition incorrectly. Use a fixed-height View container with absolute positioning instead.
- **Forgetting GestureHandlerRootView:** @gorhom/bottom-sheet requires the gesture handler root. Check that `app/_layout.tsx` already wraps with it; if not, add it.
- **String timezone bugs:** All ISO timestamps from Supabase are UTC. `new Date(isoString)` gives local time. For time display in the grid, use `getHours()` and `getMinutes()` (which respect local timezone). The web app hardcodes Europe/London — keep the same assumption.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month calendar grid | Custom date grid | react-native-calendars `Calendar` | Handles month boundaries, week starts, today highlighting, accessibility — ~500 lines of edge cases |
| Bottom sheet animations | Custom Animated.View | @gorhom/bottom-sheet | Keyboard avoidance, snap points, backdrop, drag handle, ScrollView integration all solved |
| Double-booking prevention | Client-side time overlap check | PostgreSQL EXCLUDE constraint (existing) | Race conditions on simultaneous bookings; DB constraint is atomic. Catch error code `23P01` |
| Date arithmetic | Manual month offset math | `CalendarUtils` from react-native-calendars or plain `Date` math | Month/week boundary arithmetic has many edge cases (DST, leap years) |
| Currency formatting | Custom formatter | Existing `formatPennies()` from `lib/actions/payments.ts` | Already handles GBP pennies correctly |

**Key insight:** The Web app already has working server actions for `createAppointment`, `updateAppointmentStatus`, and `rescheduleAppointment`. Port these to native `lib/actions/appointments.ts` as direct Supabase JS calls (removing the server-action wrapper) rather than rebuilding from scratch.

---

## Common Pitfalls

### Pitfall 1: @gorhom/bottom-sheet version mismatch with Reanimated v4
**What goes wrong:** Older versions of @gorhom/bottom-sheet (before v5.1.8) crash or refuse to open on Expo SDK 54 with Reanimated v4.
**Why it happens:** Reanimated v4 introduced breaking API changes. Expo SDK 54 ships with Reanimated ~4.1.1 (confirmed in package.json).
**How to avoid:** Install `@gorhom/bottom-sheet@^5` — npm will resolve to 5.2.8+. Verify the installed version is >= 5.1.8 after install.
**Warning signs:** Sheet doesn't open; `TypeError: Cannot read property 'level' of undefined`; crash on close.

### Pitfall 2: BottomSheetModalProvider not at root
**What goes wrong:** `BottomSheetModal` throws "No BottomSheetModalProvider found" at runtime.
**Why it happens:** BottomSheetModal requires a Provider ancestor to manage stacking.
**How to avoid:** Add `<BottomSheetModalProvider>` to `app/(tabs)/_layout.tsx` wrapping the `<Tabs>` component, or to the root `app/_layout.tsx`.
**Warning signs:** Error on first render of any screen that opens a BottomSheetModal.

### Pitfall 3: Month view data loading — appointments for whole month
**What goes wrong:** Querying appointments individually per day causes 30+ Supabase requests when month view loads.
**Why it happens:** Naively fetching appointments "for selected date" only works for day view.
**How to avoid:** When switching to Month view, fetch appointments for the entire visible month range in a single query: `starts_at >= first_of_month AND starts_at < first_of_next_month`. Store in state and build `markedDates` from the result.
**Warning signs:** Slow month view load; multiple network requests in rapid succession.

### Pitfall 4: ScrollView auto-scroll timing
**What goes wrong:** `scrollRef.current?.scrollTo()` silently does nothing when called too early.
**Why it happens:** The ScrollView hasn't finished layout when the effect fires immediately on mount.
**How to avoid:** Use `setTimeout(() => scrollRef.current?.scrollTo(...), 50)` after mount, or trigger scroll in the `onLayout` callback of the ScrollView container.
**Warning signs:** Day view always starts scrolled to top regardless of time.

### Pitfall 5: Appointment block height too small to show content
**What goes wrong:** Very short appointments (15 min) render as 1-line blocks; trying to fit client name + service + time all fail.
**Why it happens:** 15 min at 60px/slot-minute = height depends on `slotMinutes`. A 15-min appointment with 30-min slots = 30px. A 15-min appointment with 15-min slots = 60px.
**How to avoid:** Port the web app's conditional rendering: show time range only if `heightPx >= 90`, show service name only if `heightPx >= 50`. Ensure minimum block height of 28dp.
**Warning signs:** Blocks with text overflowing or invisible.

### Pitfall 6: Week view horizontal scroll conflict with day navigation swipe
**What goes wrong:** Horizontal ScrollView for the 7-day week layout conflicts with swipe-to-navigate gesture.
**Why it happens:** Both want horizontal pan events.
**How to avoid:** For week view, use a fixed 7-column layout (each column = `screenWidth / 7`) without a horizontal ScrollView. Week navigation uses the same swipe gesture as day view. Alternatively, use `simultaneousHandlers` on the gesture detector.
**Warning signs:** Swipe to navigate does not work in week view.

### Pitfall 7: 23P01 double-booking error handling
**What goes wrong:** Supabase returns error code `23P01` (exclusion constraint violation) but native code treats it as a generic error.
**Why it happens:** Error codes must be explicitly checked.
**How to avoid:** In `lib/actions/appointments.ts`, check `error.code === '23P01'` and return a user-friendly message: "This time slot overlaps an existing appointment."
**Warning signs:** Generic "something went wrong" shown instead of helpful message.

---

## Code Examples

Verified patterns from official sources and web app codebase:

### Appointment Query (with joins for grid display)
```typescript
// Fetch appointments for a date range — used for day, week, and month views
export async function getAppointmentsForRange(
  startDate: string,  // 'YYYY-MM-DD'
  endDate: string     // 'YYYY-MM-DD' (exclusive)
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      clients(first_name, last_name),
      appointment_services(
        id, service_name, service_price, service_duration_minutes
      )
    `)
    .gte('starts_at', `${startDate}T00:00:00`)
    .lt('starts_at', `${endDate}T00:00:00`)
    .order('starts_at')

  if (error) throw new Error(error.message)
  return (data ?? []) as Appointment[]
}
```

### Create Appointment with Working Hours Validation
```typescript
// Port of web src/lib/actions/appointments.ts — server action wrapper removed
export async function createAppointment(input: CreateAppointmentInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Working hours check (soft warning pattern)
  if (!input.override_working_hours) {
    const check = isWithinWorkingHours(input.starts_at, input.ends_at, profile.working_hours)
    if (!check.valid) return { warning: check.reason }
  }

  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .insert({ owner_user_id: user.id, ...appointmentFields })
    .select('id').single()

  if (apptError) {
    if (apptError.code === '23P01') {
      return { error: 'This time slot overlaps an existing appointment.' }
    }
    return { error: apptError.message }
  }

  // Insert services snapshot (with manual rollback on failure)
  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(input.services.map(s => ({ ...s, appointment_id: appt.id, owner_user_id: user.id })))

  if (servicesError) {
    // Rollback orphaned appointment
    await supabase.from('appointments').delete().eq('id', appt.id).eq('owner_user_id', user.id)
    return { error: servicesError.message }
  }

  return { success: true, appointmentId: appt.id }
}
```

### Services Query (with categories)
```typescript
export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(*)')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Service[]
}
```

### Time Grid Math (shared between Day and Week views)
```typescript
// Ported from web DiaryGrid — pure functions, no React dependency
const SLOT_HEIGHT_DP = 60
const TIME_GUTTER_DP = 56

export function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function generateSlots(startHHMM: string, endHHMM: string, slotMinutes: number): string[] {
  const start = parseHHMM(startHHMM)
  const end = parseHHMM(endHHMM)
  const slots: string[] = []
  for (let m = start; m < end; m += slotMinutes) {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    slots.push(`${h}:${min}`)
  }
  return slots
}

export function appointmentBlockLayout(
  appointment: Appointment,
  gridStartMinutes: number,
  slotMinutes: number
): { top: number; height: number } {
  const start = new Date(appointment.starts_at)
  const end = new Date(appointment.ends_at)
  const startMins = start.getHours() * 60 + start.getMinutes()
  const durationMins = (end.getTime() - start.getTime()) / 60000
  const top = ((startMins - gridStartMinutes) / slotMinutes) * SLOT_HEIGHT_DP
  const height = Math.max((durationMins / slotMinutes) * SLOT_HEIGHT_DP, 28)
  return { top, height }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @gorhom/bottom-sheet v4 (Reanimated v2/v3 only) | v5.2.8 (Reanimated v4 support added v5.1.8) | July 2025 | Must use v5+ — v4 crashes on Expo SDK 54 |
| SegmentedControlIOS (deprecated RN component) | Custom TouchableOpacity row or @react-native-segmented-control | RN 0.62+ | Native iOS control removed from core; community package needs custom dev client |
| DateTimePicker display="inline" Android | Android doesn't support inline — always dialog | API design | Must handle iOS and Android differently for date/time selection |
| FlatList for time grid rows | Fixed-height View with absolute positioning | N/A for calendar | FlatList recycling is incompatible with absolute-positioned overlays |

**Deprecated/outdated:**
- `Animated.Value` + `PanResponder`: Replaced by Reanimated v4 + Gesture Handler v2 RNGH declarative API. Use `Gesture.Pan()` with `GestureDetector`.
- `useWorkletCallback`: Deprecated in Reanimated v4. Use standard callbacks with `runOnJS()`.
- `CalendarList` from react-native-calendars for month navigation: Suitable for horizontal swipe between months but overkill here — plain `Calendar` with controlled `current` prop is simpler.

---

## Open Questions

1. **Week view column width with time gutter**
   - What we know: Week view shows 7 days; time gutter is 56dp on day view
   - What's unclear: 7 columns + 56dp gutter on a 390px screen = ~47dp per column. That's tight for appointment block text.
   - Recommendation: Either omit the time gutter on week view (show it only on leftmost edge) or reduce gutter to 40dp for week view. Leave exact proportions to Claude's discretion per CONTEXT.md.

2. **Month view appointment data scope**
   - What we know: Must fetch all appointments for the visible month to build dot indicators
   - What's unclear: react-native-calendars shows 6 weeks at once; some weeks span two months
   - Recommendation: Fetch `starts_at >= first visible day` (may be late in prev month) to `last visible day` (may be early in next month). Use `onVisibleMonthsChange` callback from react-native-calendars to trigger refetch.

3. **Services screen routing**
   - What we know: CONTEXT.md leaves this to Claude's discretion
   - What's unclear: Whether services screen lives under settings tab or as a standalone route accessible from booking flow
   - Recommendation: Add a "Services" row in the Settings tab screen that navigates to `app/services/` (stack). The booking flow also navigates there with a "Manage services" link when no active services exist.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test files in native/ |
| Config file | None — Wave 0 gap |
| Quick run command | N/A until framework installed |
| Full suite command | N/A until framework installed |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIARY-01 | Month view renders dot for day with bookings | unit | TBD | ❌ Wave 0 |
| DIARY-02 | Week view shows 7 columns | unit | TBD | ❌ Wave 0 |
| DIARY-03 | Day view positions block at correct top offset | unit | TBD | ❌ Wave 0 |
| DIARY-04 | Segmented control fires onChange | unit | TBD | ❌ Wave 0 |
| DIARY-05 | Swipe left advances date by 1 day | manual-only | N/A — gesture test | ❌ Wave 0 |
| DIARY-06 | createAppointment returns warning on outside hours | unit | TBD | ❌ Wave 0 |
| DIARY-07 | updateAppointmentStatus persists to Supabase | integration | TBD | ❌ Wave 0 |
| DIARY-08 | createService inserts row with all fields | unit | TBD | ❌ Wave 0 |
| DIARY-09 | AppointmentBlock uses correct colour per status | unit | TBD | ❌ Wave 0 |
| DIARY-10 | Take Payment calls recordPayment with correct amount | unit | TBD | ❌ Wave 0 |
| DIARY-11 | Working hours validation rejects outside-hours slot | unit | TBD | ❌ Wave 0 |
| DIARY-12 | 23P01 error returns user-friendly message | unit | TBD | ❌ Wave 0 |
| DIARY-13 | Client notes loaded after client selected in booking | integration | TBD | ❌ Wave 0 |
| DIARY-14 | Current time line top equals expected pixel value | unit | TBD | ❌ Wave 0 |
| DIARY-15 | Auto-scroll target is current-time on today | unit | TBD | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] Jest + React Native Testing Library setup in `native/` — no test framework installed
- [ ] `native/jest.config.js` + `babel.config.js` test preset
- [ ] `native/src/lib/utils/timeGrid.test.ts` — covers DIARY-03, DIARY-14, DIARY-15 (pure functions, easy to unit test)
- [ ] `native/src/lib/actions/appointments.test.ts` — covers DIARY-06, DIARY-11, DIARY-12

Note: Given the React Native nature of this project, pure logic functions (`generateSlots`, `appointmentBlockLayout`, `isWithinWorkingHours`, `parseHHMM`) are the highest-value test targets. UI rendering and gesture tests require a device/simulator and are manual-only for this phase.

---

## Sources

### Primary (HIGH confidence)
- [react-native-calendars docs](https://wix.github.io/react-native-calendars/docs/Components/Calendar) — Calendar component dot marking API
- [@gorhom/bottom-sheet releases](https://github.com/gorhom/react-native-bottom-sheet/releases) — v5.1.8 Reanimated v4 support confirmed
- [react-native-gesture-handler pan gesture](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pan-gesture/) — PanGesture API
- [Reanimated bottom sheet example](https://docs.swmansion.com/react-native-reanimated/examples/bottomsheet/) — confirms Reanimated v4 compatible patterns
- Web app source: `src/components/diary/diary-grid.tsx`, `appointment-block.tsx`, `booking-sheet.tsx` — full logic to port
- Web app source: `src/lib/actions/appointments.ts` — working hours validation and 23P01 handling
- Native app: `native/package.json` — confirmed installed library versions

### Secondary (MEDIUM confidence)
- [@react-native-community/datetimepicker GitHub](https://github.com/react-native-datetimepicker/datetimepicker) — `display="inline"` on iOS 14+, dialog on Android
- [Expo DateTimePicker docs](https://docs.expo.dev/versions/latest/sdk/date-time-picker/) — confirms in Expo Go; `display` modes
- [react-native-calendars npm](https://www.npmjs.com/package/react-native-calendars) — v1.1314.0, published 2 months ago, actively maintained

### Tertiary (LOW confidence)
- WebSearch: Fresha/Booksy UX patterns — general references only; specific implementation verified against web app's existing patterns
- WebSearch: react-native-week-view — considered and rejected; not tested for Expo SDK 54 / Reanimated v4 compatibility

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — library versions confirmed; @gorhom/bottom-sheet Reanimated v4 fix confirmed in release notes
- Architecture: HIGH — direct port of proven web implementation with minimal adaptation
- Pitfalls: HIGH — most identified from actual GitHub issues and library release notes

**Research date:** 2026-03-29
**Valid until:** 2026-04-29 (stable libraries; bottom-sheet fix is released)
