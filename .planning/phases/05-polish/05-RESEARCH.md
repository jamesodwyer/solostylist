# Phase 5: Polish - Research

**Researched:** 2026-03-10
**Domain:** CSV data export, audit log completeness, iOS Safari PWA mobile UX
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-02 | User can export clients, appointments, payments, and notes as CSV | Next.js Route Handler returns `text/csv` response; no npm CSV library needed — hand-crafting RFC 4180 is 10 lines per entity; four separate downloads (one per entity type) |
| DATA-03 | Audit log tracks sensitive actions (adjustments, refunds, deletions) | `audit_log` table already deployed and append-only; `createPayment` and `createAdjustment` already log to it; gaps are: deletion actions (`deleteNote`, `deleteColourFormula`) have no audit insert; `updateAppointmentStatus` has no audit insert for cancellations |
</phase_requirements>

---

## Summary

Phase 5 is the final polish phase with three independent workstreams: CSV export, audit log completeness, and iOS Safari PWA UX verification. None require new npm packages or database migrations beyond audit log correctness.

**CSV export (DATA-02):** The cleanest implementation is a Next.js Route Handler at `/api/export/[entity]/route.ts` that queries Supabase server-side and returns a `Response` with `Content-Type: text/csv` and `Content-Disposition: attachment`. No CSV library is needed — the four entity shapes are known at design time and the RFC 4180 format is straightforward to build inline. The export is triggered from a Settings page button that opens the download URL. All queries use `getUser()` + RLS, so data is automatically scoped to the authenticated user.

**Audit log completeness (DATA-03):** The `payments.ts` Server Actions (`createPayment`, `createAdjustment`) already insert audit log entries. The gaps are: `deleteNote` and `deleteColourFormula` in `notes.ts` have no audit insert, and `updateAppointmentStatus` in `appointments.ts` has no audit insert for `cancelled` / `no_show` transitions. Adding audit inserts to those three functions closes DATA-03.

**iOS Safari PWA UX (AUTH-05):** The app already has `viewportFit: "cover"` in the Next.js Viewport export and `.pb-safe { padding-bottom: env(safe-area-inset-bottom) }` in globals.css applied to the bottom nav. The manifest is properly excluded from the auth middleware matcher. The primary PWA UX gap is the keyboard scroll-trap on iOS Safari: when a text input in a bottom sheet is focused, iOS Safari shrinks the visual viewport rather than pushing content up, causing fixed-position elements to overlap the input. The fix is `interactive-widget: resizes-content` in the viewport meta (supported from iOS 16+) or a JavaScript `visualViewport` resize listener that adjusts sheet scroll behaviour. The home indicator clearance is already handled by `pb-safe` on the bottom nav.

**Primary recommendation:** Build the CSV export as Route Handlers (no library), patch audit log into the three missing actions, and verify + fix the iOS keyboard/sheet interaction. All three are mechanical changes against established project patterns.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Route Handlers for CSV download, Server Components for export page | Already installed; Route Handlers return native `Response` objects |
| @supabase/ssr + @supabase/supabase-js | 0.8.0 / 2.98.0 | Server-side data queries for export, audit log inserts | Already installed |
| Tailwind CSS | 4.x | Styling the export UI (Settings page addition) | Already installed |
| lucide-react | 0.575.0 | Download icon for export buttons | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Button | installed | Export trigger buttons | Already at `src/components/ui/button.tsx` |
| shadcn Separator | installed | Visual section dividers in Settings | Check if installed; likely present from prior phases |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline CSV string building | `csv-stringify` npm package | No benefit for 4 fixed schemas; adds a dependency for 40 lines of equivalent code |
| Route Handler download | Server Action + blob | Route Handlers are the correct Next.js primitive for file downloads; Server Actions return JSON, not file streams |
| `interactive-widget` viewport meta | JavaScript `visualViewport` listener | `interactive-widget: resizes-content` is cleaner and supported iOS 16+; JS fallback only if iOS 15 support required (target users likely iOS 16+) |

**No new npm packages are required for this phase.** All needed libraries are already installed.

**Installation:**
```bash
# Nothing to install — all dependencies already present
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── api/
│   │   └── export/
│   │       └── [entity]/
│   │           └── route.ts          # Route Handler: GET /api/export/clients, /api/export/appointments, etc.
│   └── (app)/
│       └── settings/
│           └── page.tsx              # Add Export Data section with 4 download buttons
├── lib/
│   ├── actions/
│   │   ├── notes.ts                  # Patch: add audit log to deleteNote, deleteColourFormula
│   │   └── appointments.ts           # Patch: add audit log to updateAppointmentStatus for cancellation/no-show
│   └── csv.ts                        # Shared CSV builder utility (optional — or inline in route.ts)
```

The proxy.ts matcher already excludes static assets. Add `/api/export/:path*` to the auth matcher exclusion? No — the export endpoint MUST be authenticated. The matcher passes all non-static requests through `getUser()`, so `/api/export/...` will correctly redirect unauthenticated requests to `/login`.

### Pattern 1: CSV Route Handler (one per entity)
**What:** GET route that queries the authenticated user's data and returns a CSV file download.
**When to use:** User clicks "Export [Entity]" button in Settings.

```typescript
// src/app/api/export/[entity]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { entity } = await params

  let csv = ''
  let filename = ''

  if (entity === 'clients') {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, email, address, marketing_consent, created_at')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })

    filename = 'clients.csv'
    const headers = ['id', 'first_name', 'last_name', 'phone', 'email', 'address', 'marketing_consent', 'created_at']
    csv = buildCsv(headers, data ?? [])
  }
  // ... similar blocks for 'appointments', 'payments', 'notes'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function buildCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
  ]
  return lines.join('\n')
}
```

### Pattern 2: Export Buttons in Settings
**What:** Client Component buttons that navigate to the Route Handler URL — the browser handles the download.
**When to use:** User visits Settings and wants to export their data.

```typescript
// src/app/(app)/settings/page.tsx (addition to existing Settings page)
// Four anchor links styled as buttons — href="/api/export/clients" etc.
// Use <a href="/api/export/clients" download> — browser triggers download automatically
// OR use window.location.href = '/api/export/clients' from a button onClick

// Simplest approach: plain anchor tags
<a
  href="/api/export/clients"
  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded-xl"
>
  <Download size={16} />
  Export Clients
</a>
```

Note: `<a download>` attribute doesn't work cross-origin, but same-origin Route Handlers work fine with either `<a href>` or `window.location.href`. The `Content-Disposition: attachment` header is what triggers the download — no `download` attribute needed.

### Pattern 3: Audit Log Patch — Deletions
**What:** Add non-blocking audit log inserts to `deleteNote`, `deleteColourFormula`, and sensitive status updates.
**When to use:** DATA-03 requires audit trail for "sensitive actions ... (adjustments, refunds, deletions)".

```typescript
// Patch to src/lib/actions/notes.ts — deleteNote
// After successful .delete() call, add:
await supabase.from('audit_log').insert({
  owner_user_id: user.id,
  action: 'note_deleted',
  entity_type: 'client_note',
  entity_id: id,                       // note UUID
  details: { client_id: clientId },
})
// Non-blocking: same pattern as createPayment/createAdjustment — log error, don't fail

// Patch to src/lib/actions/notes.ts — deleteColourFormula
await supabase.from('audit_log').insert({
  owner_user_id: user.id,
  action: 'colour_formula_deleted',
  entity_type: 'colour_formula',
  entity_id: id,
  details: { client_id: clientId },
})

// Patch to src/lib/actions/appointments.ts — updateAppointmentStatus (cancellations)
// The requirement says "sensitive actions". Cancellation is a business-impacting action.
// Log when status transitions to 'cancelled' or 'no_show':
if (status === 'cancelled' || status === 'no_show') {
  await supabase.from('audit_log').insert({
    owner_user_id: user.id,
    action: `appointment_${status}`,   // 'appointment_cancelled' or 'appointment_no_show'
    entity_type: 'appointment',
    entity_id: appointmentId,
    details: { status },
  })
}
```

### Pattern 4: iOS Safari Keyboard Scroll Fix
**What:** Prevent the iOS keyboard from trapping scroll inside bottom sheets when an input is focused.
**When to use:** Any bottom sheet containing text inputs (`PaymentSheet`, `AdjustmentSheet`, `BookingSheet`, `NoteSheet`, etc.).

The root cause: iOS Safari in standalone PWA mode uses `position: fixed` elements relative to the layout viewport (not the visual viewport). When the keyboard opens, the visual viewport shrinks but `fixed` elements stay at their layout position — the bottom nav covers the bottom of the sheet, and inputs can scroll behind the keyboard.

**Fix 1 (recommended): `interactive-widget` viewport meta**

In `src/app/layout.tsx`, the `Viewport` export already sets `viewportFit: 'cover'`. Add `interactiveWidget: 'resizes-content'`:

```typescript
// src/app/layout.tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
  interactiveWidget: 'resizes-content',  // NEW: keyboard resizes content area
}
```

`interactiveWidget: 'resizes-content'` is supported from iOS 16 and Chrome 108+. It tells the browser to shrink the layout viewport (not just visual viewport) when the keyboard opens, so `position: fixed` elements move up correctly and scrollable areas resize.

**Fix 2 (CSS fallback for sheet scroll):** Ensure all bottom sheet `SheetContent` elements use `overflow-y-auto` and have a bounded max-height. This ensures the scrollable region is correct even if the viewport resize doesn't fully kick in:

```typescript
// Already present in most sheets — verify all sheets use this pattern:
<SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe">
```

### Anti-Patterns to Avoid

- **CSV library for fixed-schema exports:** Don't add `csv-stringify` or `papaparse` as dependencies. The four export schemas are known at design time; inline string building is simpler and faster to ship.
- **Server Action for file download:** Server Actions return JSON. Use Route Handlers (`route.ts`) for file responses.
- **`<a download="filename.csv" href="/api/export/...">` relying on download attribute:** The `download` attribute controls the suggested filename but doesn't control whether the browser downloads vs. opens. The `Content-Disposition: attachment` header from the Route Handler is the authoritative download trigger. Both work together; don't omit the header.
- **Blocking user actions on audit log failure:** Established project pattern (from `createPayment`) — log to `console.error`, return success to user. Don't rollback.
- **Exporting JSONB fields verbatim:** The `working_hours` JSONB in `profiles` and `details` JSONB in `audit_log` will look ugly in CSV. For the DATA-02 entities (clients, appointments, payments, notes), there are no JSONB export concerns — all columns are scalar.
- **Not scoping export queries to `owner_user_id`:** Even though RLS enforces this, always add `.eq('owner_user_id', user.id)` in export queries as defence-in-depth. This also documents intent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV escaping | Custom escape logic | Inline `buildCsv` utility (10 lines) | RFC 4180: quote fields containing commas, double-quotes, or newlines; double-up embedded quotes — this is trivially implementable |
| File download | Custom streaming | Native `Response` with `Content-Type: text/csv` | Next.js Route Handler returns a standard Web API `Response`; browser handles the rest |
| Auth in Route Handler | Custom token validation | `createClient()` from `@/lib/supabase/server` + `getUser()` | Identical to Server Component/Action pattern; consistent with all prior phases |
| iOS keyboard fix | Complex JS `visualViewport` listener | `interactiveWidget: 'resizes-content'` viewport meta | One line; CSS-native; no JS required for iOS 16+ |
| Audit log table | New logging infrastructure | Existing `audit_log` table from migration | Already deployed, append-only, SELECT + INSERT RLS only |

**Key insight:** Phase 5 is almost entirely patching and plumbing existing infrastructure. The audit log table, the bottom nav safe-area handling, and the viewport setup are all already built. The work is connecting the remaining gaps.

---

## Common Pitfalls

### Pitfall 1: CSV Fields With Commas or Newlines Break Excel
**What goes wrong:** Client name "Smith, Jane" or a note with a newline causes the CSV to parse incorrectly in Excel — data shifts columns.
**Why it happens:** Developer uses simple `.join(',')` without quoting.
**How to avoid:** RFC 4180 requires quoting any field containing commas, double-quotes, or newline characters. Use the `buildCsv` pattern above. Test with a client whose name contains a comma before shipping.
**Warning signs:** Excel shows a client record split across two rows.

### Pitfall 2: UTF-8 BOM Missing — Excel Shows Garbled Characters
**What goes wrong:** Excel on Windows opens the CSV and shows `£` as `Â£` or similar mojibake.
**Why it happens:** Excel on Windows doesn't detect UTF-8 without a BOM (byte order mark). The `Content-Type: text/csv; charset=utf-8` header helps browsers but Excel ignores it on double-click open.
**How to avoid:** Prepend a UTF-8 BOM (`\uFEFF`) to the CSV string: `csv = '\uFEFF' + csv`. This is the standard fix for Excel UTF-8 compatibility.
**Warning signs:** £ signs appear as garbage characters when opening in Excel on Windows.

### Pitfall 3: Route Handler Not Excluded From Auth Middleware — Redirect Loop
**What goes wrong:** `/api/export/clients` returns 302 to `/login` even for authenticated users.
**Why it happens:** The proxy.ts matcher hits all non-static paths. If the Route Handler's Supabase cookie isn't read correctly, `getUser()` returns null and the middleware redirects.
**Why it WON'T happen here:** The Route Handler itself calls `createClient()` + `getUser()` and handles the auth check internally. The proxy middleware ALSO runs, but since the user is authenticated, it passes through. Both layers are redundant-safe.
**Warning signs:** Export button triggers a login page redirect for a logged-in user.

### Pitfall 4: iOS Keyboard Covers Input Fields in Sheets
**What goes wrong:** User types in the Notes field inside a bottom sheet. The iOS keyboard opens. The input scrolls behind the keyboard and is unreachable.
**Why it happens:** `position: fixed` bottom nav sits at layout viewport bottom. iOS Safari shrinks the visual viewport on keyboard open but `fixed` elements don't move. The sheet's scroll container may not account for the keyboard height.
**How to avoid:** Add `interactiveWidget: 'resizes-content'` to the Viewport export. Verify all sheet `SheetContent` elements have `overflow-y-auto` and `max-h-[90vh]`.
**Warning signs:** Tapping into a text field in any bottom sheet and not being able to see what you're typing on a real iOS device.

### Pitfall 5: Export Includes Other Users' Data (RLS Bypass in Route Handler)
**What goes wrong:** Export query runs without `owner_user_id` filter and returns data from other users (if RLS is somehow misconfigured).
**Why it happens:** Developer trusts RLS alone and omits the `.eq('owner_user_id', user.id)` filter.
**How to avoid:** Always add explicit `.eq('owner_user_id', user.id)` in all export queries, even though RLS enforces it at DB level. Defence in depth. Matches project convention.
**Warning signs:** Export file contains more rows than the user's own data; client UUIDs in the export don't match what the user sees in the app.

### Pitfall 6: Audit Log for Deletions — Entity ID Already Gone Before Insert
**What goes wrong:** The note is deleted, then the audit log insert references the now-deleted UUID. The insert succeeds (UUID is stored as text in `entity_id`, not a FK), but in future analysis the entity can't be retrieved.
**Why it happens:** This is expected and acceptable — the audit log records what happened, not a foreign key join. The `entity_id` is a reference for audit trail purposes.
**How to avoid:** Read the note's `id` before deleting. Pass it to the audit insert. The existing `deleteNote(id: string, clientId: string)` signature already provides the `id` — use it.
**Warning signs:** No warning signs — this works correctly. Just ensure `entity_id` is captured before the delete call.

### Pitfall 7: Appointments Export Missing Services (Flat vs. Nested Data)
**What goes wrong:** The appointments CSV is exported but doesn't include which services were booked — just the appointment ID, client, dates, and status.
**Why it happens:** `appointment_services` is a separate join table. The export query doesn't join it.
**How to avoid:** For MVP, the appointments export can include service names as a pipe-separated field: `services: "Haircut | Blow Dry"`. Join `appointment_services` in the query and concatenate `service_name` fields. This makes the CSV useful in Excel without complex normalisation.
**Warning signs:** Stylists export appointments CSV and can't see what services were booked.

---

## Code Examples

Verified patterns from project codebase inspection:

### Full CSV Route Handler (clients entity)
```typescript
// src/app/api/export/[entity]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

function escape(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function buildCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(','))
  ]
  return '\uFEFF' + lines.join('\r\n')  // UTF-8 BOM + CRLF line endings (Excel-friendly)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { entity } = await params
  let csv = ''
  let filename = `solostylist-${entity}-${new Date().toISOString().split('T')[0]}.csv`

  if (entity === 'clients') {
    const { data } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, email, address, marketing_consent, created_at')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })
    csv = buildCsv(
      ['id', 'first_name', 'last_name', 'phone', 'email', 'address', 'marketing_consent', 'created_at'],
      (data ?? []) as Record<string, unknown>[]
    )
  } else if (entity === 'appointments') {
    const { data } = await supabase
      .from('appointments')
      .select(`
        id, client_id,
        clients(first_name, last_name),
        starts_at, ends_at, status, notes, created_at,
        appointment_services(service_name, service_price)
      `)
      .eq('owner_user_id', user.id)
      .order('starts_at', { ascending: true })
    const rows = (data ?? []).map(a => ({
      id: a.id,
      client_id: a.client_id,
      client_name: a.clients ? `${(a.clients as {first_name: string; last_name?: string | null}).first_name} ${(a.clients as {first_name: string; last_name?: string | null}).last_name ?? ''}`.trim() : '',
      starts_at: a.starts_at,
      ends_at: a.ends_at,
      status: a.status,
      notes: a.notes ?? '',
      services: Array.isArray(a.appointment_services)
        ? a.appointment_services.map((s: {service_name: string}) => s.service_name).join(' | ')
        : '',
      created_at: a.created_at,
    }))
    csv = buildCsv(
      ['id', 'client_id', 'client_name', 'starts_at', 'ends_at', 'status', 'notes', 'services', 'created_at'],
      rows
    )
  } else if (entity === 'payments') {
    const { data } = await supabase
      .from('payments')
      .select('id, client_id, appointment_id, amount, method, payment_type, reference_payment_id, notes, paid_at, created_at')
      .eq('owner_user_id', user.id)
      .order('paid_at', { ascending: true })
    // amount is stored in pennies — convert to decimal GBP for export
    const rows = (data ?? []).map(p => ({
      ...p,
      amount_gbp: (p.amount / 100).toFixed(2),
    }))
    csv = buildCsv(
      ['id', 'client_id', 'appointment_id', 'amount_gbp', 'method', 'payment_type', 'reference_payment_id', 'notes', 'paid_at', 'created_at'],
      rows as Record<string, unknown>[]
    )
  } else if (entity === 'notes') {
    const { data } = await supabase
      .from('client_notes')
      .select('id, client_id, note_type, content, created_at, updated_at')
      .eq('owner_user_id', user.id)
      .order('created_at', { ascending: true })
    csv = buildCsv(
      ['id', 'client_id', 'note_type', 'content', 'created_at', 'updated_at'],
      (data ?? []) as Record<string, unknown>[]
    )
  } else {
    return new Response('Not found', { status: 404 })
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

### Viewport Fix for iOS Keyboard
```typescript
// src/app/layout.tsx — add interactiveWidget
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
  interactiveWidget: 'resizes-content',  // Fix: keyboard shrinks content, not just visual viewport
}
```

### Audit Log Patch — deleteNote (src/lib/actions/notes.ts)
```typescript
// After successful delete:
const { error: auditError } = await supabase.from('audit_log').insert({
  owner_user_id: user.id,
  action: 'note_deleted',
  entity_type: 'client_note',
  entity_id: id,  // captured before delete
  details: { client_id: clientId },
})
if (auditError) {
  console.error('Audit log insert failed:', auditError.message)
}
```

### Export Data Section in Settings (UI)
```typescript
// Addition to src/app/(app)/settings/page.tsx
const exports = [
  { entity: 'clients', label: 'Clients' },
  { entity: 'appointments', label: 'Appointments' },
  { entity: 'payments', label: 'Payments' },
  { entity: 'notes', label: 'Notes' },
]

// Render:
<section>
  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Export Data</h2>
  <div className="space-y-2">
    {exports.map(({ entity, label }) => (
      <a
        key={entity}
        href={`/api/export/${entity}`}
        className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
      >
        <span>Export {label} (CSV)</span>
        <Download size={16} className="text-gray-400" />
      </a>
    ))}
  </div>
</section>
```

### PWA Status — What's Already Done
```typescript
// Already in src/proxy.ts — manifest excluded from auth middleware:
matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']

// Already in src/app/layout.tsx:
appleWebApp: { capable: true, statusBarStyle: 'default', title: 'SoloStylist' }
viewportFit: 'cover'

// Already in src/app/manifest.ts:
display: 'standalone', start_url: '/diary'

// Already in src/components/bottom-nav.tsx:
<nav className="... pb-safe ...">  // env(safe-area-inset-bottom) — home indicator clearance

// MISSING (to be added):
interactiveWidget: 'resizes-content'  // keyboard scroll fix
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` with `export function proxy()` | Next.js 16 project decision | Already renamed; don't revert |
| `interactive-widget: resizes-visual` (default) | `interactive-widget: resizes-content` | iOS 16 / Chrome 108 support | Fixes keyboard covering inputs in fixed-position sheets |
| UTF-8 CSV without BOM | UTF-8 CSV with `\uFEFF` BOM prefix | Excel compatibility best practice | Required for £ signs and special characters to display correctly in Excel on Windows |
| `getSession()` server-side | `getUser()` | Security decision (Phase 1) | Must continue using `getUser()` in Route Handlers |

**Deprecated/outdated:**
- `middleware.ts` default export: This project uses `proxy.ts` — don't create or reference `middleware.ts`.
- Zod v4 API: Must stay on v3 — @hookform/resolvers TypeScript incompatibility still active as of March 2026.

---

## Open Questions

1. **Should colour_formulas be included in the notes CSV export?**
   - What we know: DATA-02 says "notes" as one export category. `colour_formulas` is a separate table but conceptually a note type.
   - What's unclear: Whether the stylist would want colour formulas in a separate CSV or merged with notes.
   - Recommendation: Export `colour_formulas` as part of the "notes" CSV with a `note_type` column set to `colour_formula`. Alternatively, add a fifth export button for "Colour Formulas". For MVP, merge into notes — simpler for the user.

2. **Should audit log entries be exportable?**
   - What we know: DATA-02 lists "clients, appointments, payments, and notes" — no mention of audit log export.
   - What's unclear: Whether a stylist would ever need their audit log as CSV.
   - Recommendation: Out of scope for this phase. The audit log satisfies DATA-03 as an internal trail, not a user-facing export.

3. **Does `interactiveWidget: 'resizes-content'` require a TypeScript type update for Next.js Viewport?**
   - What we know: Next.js 16 `Viewport` type includes `interactiveWidget` as a valid field (added in Next.js 14.1+).
   - What's unclear: Whether the installed `@types/react` and `next` 16.1.6 types already include this.
   - Recommendation: Try the addition; if TypeScript reports an error, cast with `as any` on that field or use the `viewport` export without strict typing for that property. This is a low-risk single-field change.

---

## Validation Architecture

> nyquist_validation is not explicitly disabled in config.json — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright (installed as devDependency `^1.58.2`) |
| Config file | None — see Wave 0 |
| Quick run command | `npx playwright test --reporter=line` |
| Full suite command | `npx playwright test` |

No test infrastructure exists in the project beyond the Playwright package being installed. No `playwright.config.ts`, no `tests/` directory, no test files. All testing for this phase is manual device testing for the PWA/iOS criteria, and browser-based verification for CSV downloads.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-02 | Export clients CSV downloads with correct headers and data | manual-only | N/A — requires browser download verification | No test infrastructure |
| DATA-02 | CSV £ amounts display correctly in Excel (UTF-8 BOM) | manual-only | N/A — requires Excel on Windows or Mac | No test infrastructure |
| DATA-03 | Audit log row inserted for deleteNote | manual-only | Supabase dashboard query: `select * from audit_log where action='note_deleted' limit 5` | No test infrastructure |
| DATA-03 | Audit log row inserted for deleteColourFormula | manual-only | Supabase dashboard query | No test infrastructure |
| DATA-03 | Audit log row inserted for appointment_cancelled | manual-only | Supabase dashboard query | No test infrastructure |
| AUTH-05 | Bottom nav clears home indicator on iOS PWA | manual-only | Real iOS device with app installed to home screen | No test infrastructure |
| AUTH-05 | Keyboard does not trap scroll in sheets on iOS | manual-only | Real iOS device — tap input in booking/payment sheet | No test infrastructure |

**Manual-only justification:** CSV download format, Excel rendering, and iOS Safari PWA keyboard behaviour cannot be tested in a headless environment without significant Playwright infrastructure setup. For an MVP with no existing test suite, the cost/benefit of building that infrastructure in this phase is poor. All three success criteria are verifiable in under 5 minutes on a real device.

### Wave 0 Gaps
- [ ] `playwright.config.ts` — no config file; Playwright installed but unconfigured
- [ ] `tests/` directory — no test directory exists
- Framework install: `npx playwright install chromium` — if browser binaries not present

**For Phase 5 specifically:** Given that all success criteria require either a real iOS device or manual browser/Excel verification, Wave 0 test infrastructure setup is lower priority than in logic-heavy phases. The Supabase dashboard audit log query is the fastest DATA-03 verification path.

---

## Sources

### Primary (HIGH confidence)
- `/Users/jamesodwyer/solostylist/supabase/migrations/20260301000000_initial_schema.sql` — audit_log table structure (SELECT + INSERT only, append-only by design), all entity tables (clients, appointments, appointment_services, payments, client_notes, colour_formulas)
- `/Users/jamesodwyer/solostylist/src/lib/actions/payments.ts` — existing audit log insert pattern confirmed (non-blocking, console.error on failure, `action`, `entity_type`, `entity_id`, `details` JSONB shape)
- `/Users/jamesodwyer/solostylist/src/lib/actions/notes.ts` — `deleteNote` and `deleteColourFormula` confirmed to have NO audit log inserts (the gap to be patched)
- `/Users/jamesodwyer/solostylist/src/lib/actions/appointments.ts` — `updateAppointmentStatus` confirmed to have NO audit log inserts
- `/Users/jamesodwyer/solostylist/src/app/layout.tsx` — existing `Viewport` export confirmed; `viewportFit: 'cover'` already set; `interactiveWidget` missing
- `/Users/jamesodwyer/solostylist/src/components/bottom-nav.tsx` — `pb-safe` class confirmed on nav element; home indicator clearance already handled
- `/Users/jamesodwyer/solostylist/src/proxy.ts` — manifest excluded from auth matcher; Route Handlers at `/api/export/...` will be authenticated (matcher passes them through)
- `/Users/jamesodwyer/solostylist/src/app/globals.css` — `.pb-safe { padding-bottom: env(safe-area-inset-bottom) }` confirmed present
- `/Users/jamesodwyer/solostylist/package.json` — Next.js 16.1.6, no new packages needed; Playwright installed as devDependency

### Secondary (MEDIUM confidence)
- RFC 4180 CSV specification — comma-separated values standard; quoting rules for fields with commas, double-quotes, newlines; CRLF line endings
- MDN Web Docs: `Content-Disposition: attachment; filename="..."` — standard HTTP header for browser file download trigger
- UTF-8 BOM (`\uFEFF`) for Excel compatibility — widely documented cross-source; Microsoft Office requires BOM for UTF-8 CSV recognition on Windows
- MDN Web Docs: `interactive-widget` viewport meta property — `resizes-content` shrinks the layout viewport when keyboard opens; supported iOS 16+, Chrome 108+

### Tertiary (LOW confidence)
- None — all critical findings verified from project codebase or official specifications

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all confirmed from package.json and prior phases
- CSV export approach: HIGH — Route Handler pattern confirmed from Next.js docs; RFC 4180 rules are stable specifications; BOM for Excel is widely documented
- Audit log gap identification: HIGH — direct code inspection of `notes.ts` and `appointments.ts` confirms no audit inserts present for deletions/cancellations
- iOS PWA / `interactiveWidget`: MEDIUM — specification confirmed from MDN; iOS 16+ support documented; actual device behaviour requires manual verification
- Test infrastructure: HIGH — confirmed no test files exist beyond Playwright package installation

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack; CSV and audit log patterns are not time-sensitive)
