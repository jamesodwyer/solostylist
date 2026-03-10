# Phase 6: Booking Client Notes - Research

**Researched:** 2026-03-10
**Domain:** React client-state data fetch, Supabase JS browser client, bottom-sheet UI patterns (Next.js 16 / React 19)
**Confidence:** HIGH

---

## Summary

Phase 6 closes the integration gap between the booking sheet / appointment sheet and the client notes and colour formula data that already exists in the database. The `client_notes` and `colour_formulas` tables are fully built, populated via the client detail view, and protected by RLS. Nothing new needs to be created at the schema level.

The work is entirely UI: (1) in `BookingSheet`, after a client is selected, fetch and display a compact summary of recent notes and the latest colour formula; (2) in `AppointmentSheet`, in view mode, surface the same data inline. Both components use the Supabase browser client (`createClient()`) for ad-hoc queries, consistent with every other live-query pattern in the codebase (search debounce, payment check, etc.).

The "compact and non-blocking" success criterion rules out full-page navigations or heavy modals. The established pattern in this app is a collapsible section or a small inline summary block inside the existing sheet scroll area. No new sheet nesting is needed.

**Primary recommendation:** Fetch client notes and colour formulas with the browser Supabase client when a client is confirmed in BookingSheet (on advancing to step 2) and when an appointment is opened in AppointmentSheet. Display as a compact read-only summary section — most-recent 3 notes plus most-recent colour formula — inside the existing scroll area.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLNT-08 | Notes are visible during booking and appointment view | Fetch `client_notes` + `colour_formulas` via browser client when client is known; render compact summary inside existing sheet scroll areas. No schema changes needed. |
</phase_requirements>

---

## Standard Stack

### Core (all already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.98.0 | Browser client queries | RLS enforced; same pattern as search/payment checks in sheets |
| React `useState` / `useEffect` | React 19 | Local async fetch state | Matches all other ad-hoc queries in booking/appointment sheets |
| Tailwind CSS v4 | ^4 | Compact layout classes | All UI built with Tailwind; no CSS modules in project |
| lucide-react | ^0.575.0 | Icons (`FileText`, `Palette`, `ChevronDown`) | Already used throughout |

### No new dependencies needed

This phase introduces zero new packages. All required tools are already installed.

---

## Architecture Patterns

### Recommended File Changes

```
src/components/diary/
├── booking-sheet.tsx        # Add client notes fetch + display in step 2 ("services" step)
├── appointment-sheet.tsx    # Add client notes section in view mode
└── client-notes-preview.tsx # NEW: shared read-only compact notes component
```

A shared `ClientNotesPreview` component is the right call — both `BookingSheet` and `AppointmentSheet` need the same read-only rendering logic. Avoids duplication.

### Pattern 1: Fetch on client selection (BookingSheet)

**What:** When the user picks a client and advances to step 2 ('services'), fire a browser-client query for `client_notes` (latest 3) and `colour_formulas` (latest 1).

**When to use:** Client ID is now known; notes are needed for the services and confirm steps where the stylist is actively thinking about what to book.

```typescript
// Triggered when selectedClient changes and step advances to 'services'
useEffect(() => {
  if (!selectedClient) return
  const supabase = createClient()
  Promise.all([
    supabase
      .from('client_notes')
      .select('id, note_type, content, created_at')
      .eq('client_id', selectedClient.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('colour_formulas')
      .select('id, formula, notes, created_at')
      .eq('client_id', selectedClient.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]).then(([notesRes, formulasRes]) => {
    setClientNotes(notesRes.data ?? [])
    setLatestFormula(formulasRes.data?.[0] ?? null)
    setNotesLoaded(true)
  })
}, [selectedClient])
```

Source: Same pattern as the payment check in `appointment-sheet.tsx` lines 83-91 (browser client Promise chain in useEffect).

### Pattern 2: Fetch on appointment open (AppointmentSheet)

**What:** When `appointment` prop changes (sheet opens for a specific appointment), fetch notes for `appointment.client_id`.

**When to use:** Appointment sheet opens; the `client_id` is available from the appointment object.

```typescript
useEffect(() => {
  if (!appointment) return
  const supabase = createClient()
  Promise.all([
    supabase
      .from('client_notes')
      .select('id, note_type, content, created_at')
      .eq('client_id', appointment.client_id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('colour_formulas')
      .select('id, formula, notes, created_at')
      .eq('client_id', appointment.client_id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]).then(([notesRes, formulasRes]) => {
    setClientNotes(notesRes.data ?? [])
    setLatestFormula(formulasRes.data?.[0] ?? null)
  })
}, [appointment])
```

Source: Mirrors `hasPayment` check useEffect in `appointment-sheet.tsx` at line 83.

### Pattern 3: ClientNotesPreview — compact read-only component

**What:** Shared presentational component. Renders a collapsible section showing up to 3 recent notes and the latest colour formula if present.

**When to use:** Rendered inside both sheets' scrollable content area.

```typescript
// src/components/diary/client-notes-preview.tsx
'use client'

interface ClientNotesPreviewProps {
  notes: Array<{ id: string; note_type: string; content: string; created_at: string }>
  latestFormula: { id: string; formula: string; notes: string | null } | null
  loading?: boolean
}

export function ClientNotesPreview({ notes, latestFormula, loading }: ClientNotesPreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const hasData = notes.length > 0 || latestFormula !== null

  if (loading) return <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400">Loading notes...</div>
  if (!hasData) return null  // No notes — silent, non-blocking

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
      >
        <span>Client Notes</span>
        <ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="space-y-2">
          {latestFormula && (
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2">
              <p className="text-xs font-medium text-purple-700 mb-0.5">Colour Formula</p>
              <p className="text-sm font-mono text-purple-900">{latestFormula.formula}</p>
              {latestFormula.notes && <p className="text-xs text-purple-600 mt-0.5">{latestFormula.notes}</p>}
            </div>
          )}
          {notes.map(note => (
            <div key={note.id} className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">{note.note_type}</p>
              <p className="text-sm text-gray-700 line-clamp-3">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Anti-Patterns to Avoid

- **Nesting a sheet inside AppointmentSheet to show notes:** iOS Safari z-index issues with stacked sheets are a documented project decision (see STATE.md: "PaymentSheet rendered as sibling sheet in DiaryView — avoids sheet-inside-sheet z-index complexity"). Do not open a new sheet for notes display.
- **Fetching notes on the BookingSheet client step (step 1 search results):** Notes are only useful once a client is confirmed. Fetching per search result would cause N queries on every keystroke.
- **Fetching notes server-side in DiaryView:** The diary page does not know which appointment will be opened; per-appointment notes must be fetched lazily on open, not at page-render time.
- **Loading all notes (no limit):** Some clients will accumulate many notes over time. Always use `.limit(3)` for general notes and `.limit(1)` for colour formulas in the preview context.
- **Blocking the sheet open on notes load:** Notes fetch must be non-blocking. Sheet should open and render the skeleton/nothing state while notes load in background.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Collapsible section | Custom animation library | `useState` + Tailwind `hidden`/`block` or `rotate-180` on chevron | App has no animation library; CSS class toggle is sufficient and consistent |
| Truncated text | Custom ellipsis JS | Tailwind `line-clamp-3` | Tailwind v4 includes line-clamp utilities natively |
| Type badges | Custom badge component | Reuse `TypeBadge` pattern from `notes-tab.tsx` or inline span | Pattern already exists; no need to re-invent |

---

## Common Pitfalls

### Pitfall 1: State not reset between clients in BookingSheet

**What goes wrong:** User selects Client A (notes load), goes back to client step, selects Client B — stale Client A notes still show until the new fetch completes.

**Why it happens:** The `useEffect` runs on `selectedClient` change, but there's a render gap between the state update and the resolved Promise.

**How to avoid:** Reset `clientNotes`, `latestFormula`, and `notesLoaded` to their empty defaults immediately when `selectedClient` changes (before the async fetch), or when the sheet resets on open (the existing `open` effect already resets all state).

**Warning signs:** Notes section showing wrong client's data during the brief fetch window.

### Pitfall 2: Notes section occupies too much vertical space in compact sheet

**What goes wrong:** A client with many notes makes the service-selection area hard to reach; stylist has to scroll past a wall of text.

**Why it happens:** Showing full content of all notes without truncation.

**How to avoid:** Use `line-clamp-3` on note content, limit to 3 notes (`limit(3)`), and make the section collapsible. Default state should be **collapsed** (expanded=false) so notes don't dominate the sheet on open.

**Warning signs:** Notes section taller than the service list on first opening.

### Pitfall 3: query runs even after sheet closes / component unmounts

**What goes wrong:** setState called on unmounted component after Promise resolves.

**Why it happens:** No cleanup in the `useEffect` that fires the browser client Promise.

**How to avoid:** Add a `cancelled` flag pattern:

```typescript
useEffect(() => {
  if (!selectedClient) return
  let cancelled = false
  const supabase = createClient()
  // ... query ...
  .then(([notesRes, formulasRes]) => {
    if (cancelled) return
    setClientNotes(notesRes.data ?? [])
    setLatestFormula(formulasRes.data?.[0] ?? null)
    setNotesLoaded(true)
  })
  return () => { cancelled = true }
}, [selectedClient])
```

**Warning signs:** React "Can't perform a state update on an unmounted component" console warnings.

### Pitfall 4: RLS — no explicit owner_user_id filter needed

**What goes wrong:** Developer adds `.eq('owner_user_id', userId)` but `userId` is not available in the browser-client context without an extra `getUser()` call.

**Why it happens:** Forgetting that RLS enforces `auth.uid() = owner_user_id` automatically.

**How to avoid:** Only filter by `client_id`. RLS handles user scoping. This is already documented in STATE.md: "Client search uses browser Supabase client with RLS — no explicit owner_user_id filter needed".

---

## Code Examples

### BookingSheet: where to insert the notes section

In step 2 ('services'), after the header and before the service list, insert `<ClientNotesPreview>`:

```tsx
{/* --- Step 2: Select Services --- */}
{step === 'services' && (
  <>
    <SheetHeader>...</SheetHeader>

    <div className="flex-1 overflow-y-auto px-4 pb-4">
      {/* Client notes preview — new in Phase 6 */}
      {notesLoaded && (
        <div className="mt-3 mb-1">
          <ClientNotesPreview
            notes={clientNotes}
            latestFormula={latestFormula}
          />
        </div>
      )}
      {!notesLoaded && selectedClient && (
        <div className="mt-3 mb-1 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400 animate-pulse">
          Loading notes...
        </div>
      )}

      {/* existing service list ... */}
    </div>
  </>
)}
```

### AppointmentSheet: where to insert the notes section

In view mode, after the existing "Notes" section (appointment notes), add a "Client Notes" section:

```tsx
{/* Existing appointment notes section already present */}
<div>
  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Appointment Notes</p>
  {/* ... */}
</div>

{/* Client notes preview — new in Phase 6 */}
<ClientNotesPreview
  notes={clientNotes}
  latestFormula={latestFormula}
  loading={!clientNotesLoaded}
/>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fetching related data server-side and drilling down as props | Lazy browser-client fetch in useEffect when entity ID becomes known | Established in Phase 3 (hasPayment check) | Avoids bloating diary page server query; notes only loaded when needed |

---

## Open Questions

1. **Default expanded or collapsed?**
   - What we know: Success criterion says "compact and non-blocking"; collapsible is specified.
   - What's unclear: Whether notes should default open or closed.
   - Recommendation: Default to **closed** (expanded=false). Stylist can expand if needed. Keeps the sheet uncluttered and respects the "compact" requirement.

2. **Show notes in the BookingSheet confirm step too, or only services step?**
   - What we know: Notes are fetched when client is selected; they are available from step 2 onward.
   - What's unclear: Whether the confirm step should repeat the notes section.
   - Recommendation: Show in **services step only**. Confirm step is focused on booking details; notes are most relevant when choosing services (e.g., colour formula influences which services to pick). Duplicating them in confirm adds noise.

3. **Should the `ClientNotesPreview` link through to the full client profile?**
   - What we know: The full client detail is at `/clients/[id]`.
   - What's unclear: Whether a "View all notes" link is in scope for Phase 6.
   - Recommendation: Include a subtle "View all" link (text-xs, text-blue-600) that navigates to `/clients/[clientId]` opened in the same tab. Simple, low-risk, useful context.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 |
| Config file | None detected — Wave 0 gap |
| Quick run command | `npx playwright test --grep "client-notes"` |
| Full suite command | `npx playwright test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLNT-08 | After client selected in BookingSheet, notes section appears with correct data | e2e | `npx playwright test --grep "CLNT-08"` | No — Wave 0 gap |
| CLNT-08 | In AppointmentSheet view mode, client notes section shows data | e2e | `npx playwright test --grep "CLNT-08"` | No — Wave 0 gap |
| CLNT-08 | Notes section is collapsible and non-blocking | e2e (visual) | manual review | manual-only |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit` (TypeScript check, fast)
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/phase-06-client-notes.spec.ts` — covers CLNT-08 booking sheet + appointment sheet
- [ ] `playwright.config.ts` — Playwright config for local dev base URL
- [ ] Seed data fixture for client with notes and colour formulas

*(Note: TypeScript compilation via `npx tsc --noEmit` is available immediately with no setup cost and catches the majority of bugs in this purely UI phase.)*

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection:
  - `src/components/diary/booking-sheet.tsx` — full component reviewed
  - `src/components/diary/appointment-sheet.tsx` — full component reviewed
  - `src/components/clients/detail/notes-tab.tsx` — existing notes rendering pattern
  - `src/components/clients/detail/colour-tab.tsx` — existing colour formula rendering
  - `src/lib/actions/notes.ts` — server actions for notes CRUD
  - `src/lib/types/database.ts` — `ClientNote`, `ColourFormula` types
  - `supabase/migrations/20260301000000_initial_schema.sql` — `client_notes`, `colour_formulas` table definitions and indexes
  - `.planning/STATE.md` — project decisions (RLS scoping, browser client pattern, sheet z-index rule)

### Secondary (MEDIUM confidence)

- `package.json` — confirmed Tailwind v4 (has `line-clamp` built-in), Playwright available

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all dependencies confirmed in package.json; all patterns confirmed in codebase
- Architecture: HIGH — fetch pattern directly derived from existing appointment-sheet useEffect; no new patterns introduced
- Pitfalls: HIGH — derived from documented project decisions in STATE.md and direct code review

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable codebase; no fast-moving dependencies)
