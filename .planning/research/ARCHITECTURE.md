# Architecture Research

**Domain:** Solo beauty professional business management PWA (Next.js + Supabase)
**Researched:** 2026-03-01
**Confidence:** HIGH (Next.js official docs, Supabase official docs, multiple verified sources)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / PWA Shell                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Today   │  │   Book    │  │ Clients  │  │    Money     │   │
│  │  (Diary) │  │ (New Appt)│  │  (CRM)   │  │  (Finance)   │   │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │              │             │               │             │
│  ┌────▼──────────────▼─────────────▼───────────────▼──────────┐ │
│  │              Bottom Tab Nav (Client Component)              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────┐
│                     Next.js App Router (Server)                  │
│  ┌───────────────┐  ┌─────────────────┐  ┌────────────────────┐ │
│  │ Server Pages  │  │  Server Actions  │  │    Middleware       │ │
│  │ (async RSC)   │  │  (mutations)     │  │  (auth guard)      │ │
│  └───────┬───────┘  └────────┬─────────┘  └────────────────────┘ │
│          │                  │                                     │
│  ┌───────▼──────────────────▼─────────────────────────────────┐  │
│  │                  lib/ (Database Layer)                       │  │
│  │  queries/        actions/         utils/supabase/           │  │
│  │  (read fns)      (write fns)      (client|server|middleware)│  │
│  └───────────────────────────┬────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ Supabase Client (SSR)
┌──────────────────────────────▼──────────────────────────────────┐
│                         Supabase                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐│
│  │  Auth (OTP)  │  │  Postgres DB │  │  Row Level Security      ││
│  │              │  │  (12 tables) │  │  (owner_user_id policy)  ││
│  └──────────────┘  └──────────────┘  └─────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Server Pages (RSC) | Fetch data, compose layout, pass props to client components | `async function Page()` in `app/**/page.tsx` |
| Server Actions | Handle all writes: create, update, delete, mutations | `'use server'` functions called from forms or client components |
| Client Components | Interactivity: forms, date pickers, tabs, modals | `'use client'` with useState/useEffect |
| Middleware | Auth session refresh, route protection for all `/app/**` routes | `middleware.ts` using `@supabase/ssr` updateSession |
| lib/queries | All Supabase read operations, one file per domain | Pure async functions returning typed data |
| lib/actions | All Supabase write operations with revalidatePath | Server actions with Zod validation |
| utils/supabase | Supabase client factories split by environment | `client.ts` (browser), `server.ts` (RSC/actions) |
| Bottom Tab Nav | Mobile navigation, active state, PWA chrome | Client component fixed to viewport bottom |

---

## Recommended Project Structure

```
solostylist/
├── app/                            # Next.js App Router (routes only)
│   ├── (auth)/                     # Route group — unauthenticated
│   │   ├── login/
│   │   │   └── page.tsx            # OTP/magic link entry
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts        # Supabase auth callback handler
│   ├── (app)/                      # Route group — authenticated
│   │   ├── layout.tsx              # App shell: bottom nav, auth check
│   │   ├── today/
│   │   │   └── page.tsx            # Day diary view (default)
│   │   ├── book/
│   │   │   ├── page.tsx            # New appointment flow
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Appointment detail / edit
│   │   ├── clients/
│   │   │   ├── page.tsx            # Client list + search
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Client profile + notes + timeline
│   │   ├── money/
│   │   │   ├── page.tsx            # Daily totals dashboard
│   │   │   ├── cashup/
│   │   │   │   └── page.tsx        # End of day cash up
│   │   │   └── invoices/
│   │   │       └── [id]/
│   │   │           └── page.tsx    # Invoice view + checkout
│   │   └── settings/
│   │       └── page.tsx            # Business profile, services, export
│   ├── layout.tsx                  # Root layout (fonts, manifest, providers)
│   ├── manifest.ts                 # PWA manifest (generated)
│   └── globals.css                 # Tailwind base styles
│
├── components/                     # Shared UI components
│   ├── ui/                         # shadcn/ui generated components
│   ├── nav/
│   │   └── bottom-tab-nav.tsx      # 'use client' — mobile tab bar
│   ├── diary/
│   │   ├── day-view.tsx            # Slot timeline display
│   │   └── appointment-card.tsx    # Single appointment block
│   ├── clients/
│   │   ├── client-search.tsx       # 'use client' — search input + results
│   │   └── client-notes-list.tsx   # Notes by type display
│   ├── billing/
│   │   ├── invoice-form.tsx        # 'use client' — invoice editor
│   │   └── payment-logger.tsx      # 'use client' — cash/card payment
│   └── shared/
│       ├── currency-display.tsx    # Pennies → £ format utility component
│       ├── date-picker.tsx         # 'use client' — date navigation
│       └── status-badge.tsx        # Appointment/invoice status pill
│
├── lib/                            # Business logic (server-only)
│   ├── queries/                    # All Supabase read operations
│   │   ├── appointments.ts         # getAppointmentsForDay, getAppointmentById
│   │   ├── clients.ts              # getClients, getClientById, searchClients
│   │   ├── services.ts             # getServices, getActiveServices
│   │   ├── invoices.ts             # getInvoice, getInvoiceWithItems
│   │   ├── payments.ts             # getPaymentsForInvoice, getDailyTotals
│   │   ├── cashups.ts              # getCashupForDate
│   │   └── settings.ts             # getProfile, getSettings
│   ├── actions/                    # All Supabase write operations (Server Actions)
│   │   ├── appointments.ts         # createAppointment, updateStatus, cancel
│   │   ├── clients.ts              # createClient, updateClient
│   │   ├── services.ts             # createService, toggleService
│   │   ├── invoices.ts             # createInvoice, applyDiscount, voidInvoice
│   │   ├── payments.ts             # logPayment, recordRefund
│   │   ├── cashups.ts              # saveCashup
│   │   ├── notes.ts                # createNote, updateNote
│   │   ├── audit.ts                # writeAuditLog (called from other actions)
│   │   └── export.ts               # generateCSV for all tables
│   ├── validations/                # Zod schemas — shared between client + server
│   │   ├── appointment.ts
│   │   ├── client.ts
│   │   ├── invoice.ts
│   │   └── service.ts
│   └── utils/
│       ├── currency.ts             # penniesTo£, £toPennies helpers
│       ├── dates.ts                # London timezone helpers, slot generation
│       └── booking.ts              # Double-booking detection logic
│
├── utils/
│   └── supabase/
│       ├── client.ts               # createBrowserClient() — for 'use client' components
│       ├── server.ts               # createServerClient() — for RSC + Server Actions
│       └── middleware.ts           # updateSession() — session refresh in middleware
│
├── supabase/
│   ├── migrations/                 # SQL migration files (numbered)
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_seed_data.sql
│   └── seed.sql                    # Local dev seed data
│
├── middleware.ts                   # Route protection + session refresh
├── next.config.ts                  # PWA config (next-pwa or built-in)
└── public/
    ├── icons/                      # PWA app icons (192, 512px)
    └── screenshots/                # Optional PWA install screenshots
```

### Structure Rationale

- **`app/(auth)/` vs `app/(app)/`:** Route groups keep auth pages (no nav) separate from the protected app shell (with bottom nav). The `(app)/layout.tsx` renders the tab bar and can perform the auth redirect server-side.
- **`lib/queries/` vs `lib/actions/`:** Hard separation between reads and writes. Queries are pure async functions called in Server Components. Actions are `'use server'` functions called from forms or client event handlers. This makes auditing and testing straightforward.
- **`utils/supabase/`:** Three files because Next.js runs code in both environments and Supabase's `@supabase/ssr` package requires different client creation functions per context. This is the official Supabase convention.
- **`lib/validations/`:** Zod schemas colocated with business logic, not inside components. Shared between client-side form validation and server-side action validation, preventing duplication.
- **`supabase/migrations/`:** SQL files version-controlled in the repo. Each migration is numbered and idempotent. RLS policies ship as a dedicated migration (002) so they can be reviewed independently.
- **`components/ui/`:** shadcn/ui output goes here (auto-generated by CLI). Do not manually edit these files — regenerate via shadcn CLI when updating.

---

## Architectural Patterns

### Pattern 1: Server Component Data Fetch + Client Component Interactivity

**What:** Pages are async Server Components that fetch data directly from Supabase and pass it as props to small Client Components that handle interactivity.
**When to use:** Every page. This is the default App Router pattern.
**Trade-offs:** Maximum performance (no client-side fetching waterfalls), zero JavaScript for static parts. Client components get slightly more complex prop types.

**Example:**
```typescript
// app/(app)/today/page.tsx — Server Component
import { getAppointmentsForDay } from '@/lib/queries/appointments'
import { DayView } from '@/components/diary/day-view'

export default async function TodayPage() {
  const today = new Date().toISOString().split('T')[0]
  const appointments = await getAppointmentsForDay(today)

  return <DayView appointments={appointments} date={today} />
}
```

```typescript
// components/diary/day-view.tsx — Client Component
'use client'
import { useState } from 'react'
import type { Appointment } from '@/lib/types'

export function DayView({ appointments, date }: {
  appointments: Appointment[]
  date: string
}) {
  const [selectedDate, setSelectedDate] = useState(date)
  // interactivity here — date picker, tap slot, etc.
}
```

### Pattern 2: Server Actions for All Mutations

**What:** All write operations (create, update, delete) go through `'use server'` functions. Client components call these functions directly — no API routes needed.
**When to use:** Every form submission, status update, payment log, etc.
**Trade-offs:** Simpler than API routes (no fetch, no endpoint to maintain). Less flexible for complex async workflows, but suitable for this app's scope.

**Example:**
```typescript
// lib/actions/appointments.ts
'use server'
import { createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CreateAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  startAt: z.string().datetime(),
  notes: z.string().optional(),
})

export async function createAppointment(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = CreateAppointmentSchema.parse({
    clientId: formData.get('clientId'),
    serviceIds: formData.getAll('serviceIds'),
    startAt: formData.get('startAt'),
    notes: formData.get('notes'),
  })

  // Double-booking check
  const conflict = await checkDoubleBooking(parsed.startAt, endAt, supabase)
  if (conflict) return { error: 'Time slot is already booked' }

  const { error } = await supabase.from('appointments').insert({
    owner_user_id: user.id,
    client_id: parsed.clientId,
    start_at: parsed.startAt,
    // ...
  })

  if (error) return { error: error.message }
  revalidatePath('/today')
  return { success: true }
}
```

### Pattern 3: RLS as the Authorization Layer (Read) + Server Validation (Write)

**What:** Supabase RLS policies enforce `owner_user_id = auth.uid()` for all SELECT operations automatically. Write operations (INSERT/UPDATE/DELETE) are validated in Server Actions before reaching the database, providing a defense-in-depth approach.
**When to use:** Always. Never bypass RLS. Never expose the service role key to the browser.
**Trade-offs:** RLS adds marginal query overhead. Mitigate by indexing `owner_user_id` on every table. The safety guarantee is worth it.

**Example:**
```sql
-- supabase/migrations/002_rls_policies.sql

-- Enable RLS on every table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Owner-only access policy (applied to all owner_user_id tables)
CREATE POLICY "owner_access" ON appointments
  FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Index to prevent RLS performance degradation on large tables
CREATE INDEX idx_appointments_owner ON appointments(owner_user_id);
CREATE INDEX idx_appointments_date ON appointments(owner_user_id, start_at);
```

```typescript
// lib/queries/appointments.ts — RLS handled automatically by Supabase
import 'server-only'  // Prevent accidental client import
import { createServerClient } from '@/utils/supabase/server'

export async function getAppointmentsForDay(date: string) {
  const supabase = await createServerClient()
  // No need to filter by user — RLS does it automatically
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients(full_name, phone), appointment_services(*)')
    .gte('start_at', `${date}T00:00:00`)
    .lt('start_at', `${date}T23:59:59`)
    .order('start_at', { ascending: true })

  if (error) throw error
  return data
}
```

### Pattern 4: Audit Log via Server Action Wrapper

**What:** Sensitive mutations (refunds, voids, deletions) call `writeAuditLog()` within the same Server Action transaction, capturing before/after state.
**When to use:** Invoice adjustments, refunds/voids, client/appointment deletions.
**Trade-offs:** Slightly more code per action. Essential for the trust/compliance requirements of a financial tool.

**Example:**
```typescript
// lib/actions/invoices.ts
'use server'
import { writeAuditLog } from '@/lib/actions/audit'

export async function voidInvoice(invoiceId: string, reason: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Capture before state for audit
  const { data: before } = await supabase
    .from('invoices').select('*').eq('id', invoiceId).single()

  const { data: after, error } = await supabase
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', invoiceId)
    .select().single()

  if (!error) {
    await writeAuditLog({
      entityType: 'invoice',
      entityId: invoiceId,
      action: 'void',
      before: before,
      after: after,
    })
  }

  revalidatePath('/money')
  return { error: error?.message }
}
```

### Pattern 5: PWA Setup via Next.js Built-in Manifest

**What:** Next.js App Router natively supports PWA manifests via `app/manifest.ts`. Service worker provided by `next-pwa` or `serwist` package. No ejecting needed.
**When to use:** From day one. PWA support is a core requirement.
**Trade-offs:** Built-in manifest generation is clean but service worker setup still requires a third-party package (next-pwa or serwist). Offline support is not required per PRD — aim for "graceful degraded experience" only.

**Example:**
```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Solo Stylist OS',
    short_name: 'Stylist',
    description: 'Run your freelance beauty business from your phone',
    start_url: '/today',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

---

## Data Flow

### Request Flow: Reading Data (Server Component)

```
User navigates to /today
      |
      v
middleware.ts
  - Calls updateSession() to refresh Supabase auth cookie
  - Unauthenticated → redirect to /login
      |
      v
app/(app)/today/page.tsx  [Server Component, async]
  - Calls createServerClient() → Supabase client with user's session cookie
  - Calls getAppointmentsForDay(date) from lib/queries/appointments.ts
  - Supabase applies RLS: WHERE owner_user_id = auth.uid()
      |
      v
RSC renders HTML with appointment data embedded
  - Passes data as props to <DayView> Client Component
  - Client receives pre-rendered HTML (fast FCP on mobile)
      |
      v
<DayView> hydrates in browser
  - useState for selected date, selected appointment
  - onClick handlers trigger Server Actions for mutations
```

### Request Flow: Writing Data (Server Action)

```
User taps "Complete Appointment" on diary
      |
      v
<AppointmentCard> [Client Component]
  - Calls updateAppointmentStatus(id, 'completed')  [Server Action]
      |
      v
lib/actions/appointments.ts
  - createServerClient() → reads auth session from cookie
  - Validates user is authenticated
  - Validates input with Zod schema
  - Checks ownership (belt-and-suspenders with RLS)
  - Executes UPDATE on appointments table
  - Calls revalidatePath('/today') to bust RSC cache
      |
      v
Next.js re-fetches /today page data server-side
  - Updated appointments data returned to client
  - UI reflects new appointment status without full page reload
```

### Request Flow: Authentication

```
User enters email on /login
      |
      v
Server Action calls supabase.auth.signInWithOtp({ email })
  - Supabase sends magic link to email
      |
      v
User taps link → /auth/callback?code=...
      |
      v
app/(auth)/auth/callback/route.ts [Route Handler]
  - Exchanges code for session
  - Sets auth cookie via @supabase/ssr
  - Redirects to /today
      |
      v
middleware.ts on every subsequent request
  - Reads cookie, refreshes session if near expiry
  - Injects fresh auth context for all Server Components
```

### State Management

This app does not use a global client-side state store (no Redux, Zustand, or React Query). State lives in:

```
Server State (source of truth):
  Supabase Postgres
      |
      v (via RSC + Server Actions + revalidatePath)
Route Cache (Next.js):
  Per-route RSC payload cache, invalidated on mutation
      |
      v (passed as props)
Local UI State (Client Components):
  useState — form inputs, selected date, modal open/closed
  No shared global state across routes
```

This is intentional. For a single-user, mobile-first app where the stylist is the only user, client-side caching complexity adds no value. Server state + RSC re-render is simpler and eliminates an entire class of sync bugs.

### Key Data Flows by Feature

1. **Booking flow:** Today page → tap slot → New Appointment form (client) → Server Action creates appointment + appointment_services records → revalidatePath('/today') → diary updates
2. **Checkout flow:** Appointment detail → tap "Checkout" → Invoice auto-created from appointment_services snapshots → Invoice editor (client) → payment logged via Server Action → daily totals invalidated
3. **Cash up:** Money page → tap "Cash Up" → pre-populated form with daily cash total → Server Action saves cashup + petty_cash_items → revalidatePath('/money')
4. **Client search:** Client list page → search input (client component) → debounced Server Action query against `full_name` and `phone` → results rendered inline (no page nav)
5. **CSV export:** Settings page → tap export button → Server Action queries all user data → streams CSV file response → browser download

---

## Component Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Page → Client Component | Props (must be serializable) | Fetch server-side, pass typed data down |
| Client Component → Server Action | Direct function call (no fetch needed) | Next.js handles the HTTP boundary transparently |
| Server Action → Supabase | Supabase SSR client with cookie auth | Session automatically available on server |
| Middleware → Supabase | Session refresh via updateSession | Must run on every request before any route handler |
| lib/queries → Supabase | createServerClient() factory | Always use server client, never browser client in queries |
| lib/actions → lib/queries | Do NOT call queries from actions | Actions re-fetch fresh data only if needed for audit; rely on revalidatePath to trigger page re-fetch |

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` cookie-based sessions | Magic link / OTP flow, no passwords |
| Supabase Postgres | Typed queries via `@supabase/supabase-js` | RLS enforced; always use server client for writes |
| PWA / Service Worker | `next-pwa` or Serwist wrapping `next.config.ts` | Static assets cached aggressively; RSC payloads use NetworkFirst |
| CSV Export | Built-in Node.js stream in Server Action | No third-party library needed for simple CSVs |

### Internal Module Boundaries

| From | To | How | Rule |
|------|----|-----|------|
| `app/**/page.tsx` | `lib/queries/*.ts` | Direct async import | Only in Server Components |
| `app/**/page.tsx` | `components/**` | Props | Pass data, not Supabase clients |
| `components/**` | `lib/actions/*.ts` | Direct function call | Server Actions callable from client |
| `lib/actions/*.ts` | `lib/validations/*.ts` | Import + parse | Validate before DB write |
| `lib/queries/*.ts` | `utils/supabase/server.ts` | createServerClient() | Always server client |
| `components/**` (client) | `utils/supabase/client.ts` | createBrowserClient() | Only for Realtime subscriptions (not needed in MVP) |

---

## Anti-Patterns

### Anti-Pattern 1: Supabase Client in Client Components for Data Fetching

**What people do:** Import `createBrowserClient()` in `'use client'` components and fetch data with `useEffect`.
**Why it's wrong:** Exposes the anon key, bypasses RSC caching, causes loading spinners on every navigation, and makes the app feel slow on mobile. RLS still protects data but the architecture becomes harder to reason about.
**Do this instead:** Fetch in Server Components and pass data as props. Only use the browser client for Supabase Realtime subscriptions (not needed in MVP).

### Anti-Pattern 2: Putting All Logic in Page Components

**What people do:** Write Supabase queries directly inline in `page.tsx` files instead of extracting to `lib/queries/`.
**Why it's wrong:** Pages become untestable, hard to reuse queries across routes, and RLS debugging requires opening full page files. Growing to 12+ tables makes pages unwieldy.
**Do this instead:** One query file per domain table in `lib/queries/`. Pages import and compose.

### Anti-Pattern 3: Skipping `import 'server-only'` in Query Files

**What people do:** Write `lib/queries/clients.ts` without the `server-only` guard.
**Why it's wrong:** A query function accidentally imported into a Client Component will fail silently (the Supabase service URL is missing) or expose server secrets.
**Do this instead:** Add `import 'server-only'` as the first line of every file in `lib/queries/` and `lib/actions/`.

### Anti-Pattern 4: Using `auth.uid()` Without Indexing in RLS

**What people do:** Enable RLS with `owner_user_id = auth.uid()` policies but skip adding database indexes.
**Why it's wrong:** Each row returned triggers an RLS check; without an index on `owner_user_id`, queries degrade to sequential scans as data grows. This causes the app to slow down after months of real use.
**Do this instead:** `CREATE INDEX idx_{table}_owner ON {table}(owner_user_id)` in migration 002 for every table that has RLS.

### Anti-Pattern 5: Editing Paid Invoices Directly

**What people do:** Allow UPDATE on invoice rows after status = 'paid'.
**Why it's wrong:** Destroys the audit trail. A beauty professional relying on this for tax records needs immutable financial history.
**Do this instead:** Paid invoices are read-only. Corrections are adjustment transactions logged in `audit_log` with `before_json` / `after_json`. Enforce in both Server Action logic and database constraint.

### Anti-Pattern 6: Storing All Working Hours as Separate Rows

**What people do:** Create a `working_hours` table with one row per weekday.
**Why it's wrong:** 7-row query just to know if today is a working day; joining to appointments for schedule validation becomes complex.
**Do this instead:** Store as `working_hours_json` JSONB in the `settings` table (as the PRD specifies). Query once, parse in TypeScript.

---

## Build Order Implications

The component dependency graph determines build order. Each phase must complete before the next can begin:

```
Phase 1 — Foundation (everything depends on this)
  Supabase project + migrations (schema + RLS)
  utils/supabase/ (client, server, middleware)
  middleware.ts (auth protection)
  app/(auth)/login + auth/callback (magic link flow)
  app/(app)/layout.tsx (shell + bottom nav)
  lib/validations/ (shared schemas)
      |
      v
Phase 2 — Data Setup (required before booking)
  lib/queries/services, clients, settings
  lib/actions/services, clients
  app/(app)/settings/ (business profile + services CRUD)
  app/(app)/clients/ (client list + search + profile)
      |
      v
Phase 3 — Booking (requires clients + services)
  lib/queries/appointments
  lib/actions/appointments
  lib/utils/booking.ts (double-booking detection)
  app/(app)/today/ (diary view)
  app/(app)/book/ (new appointment flow)
      |
      v
Phase 4 — Billing (requires appointments)
  lib/queries/invoices, payments
  lib/actions/invoices, payments, audit
  app/(app)/money/invoices/[id]/ (checkout flow)
  app/(app)/money/ (daily totals dashboard)
  app/(app)/money/cashup/ (end of day)
      |
      v
Phase 5 — Polish + Export
  lib/actions/export.ts (CSV generation)
  lib/actions/audit.ts (verify audit trail completeness)
  Client notes improvements
  Error states + empty states
  PWA icons, manifest verification
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current architecture is fine. Single Supabase project, no edge functions, no caching layer beyond RSC. |
| 1k-10k users | Add composite indexes on frequently joined columns (`owner_user_id, start_at`). Consider Supabase connection pooling (PgBouncer, already built-in). Monitor RLS query plans. |
| 10k+ users | Supabase read replicas for diary and reporting queries. Separate the daily totals calculation into a Postgres function or Edge Function to avoid heavy aggregation on the main connection pool. |

### Scaling Priorities

1. **First bottleneck:** RLS policy evaluation on large datasets. Fix by adding proper composite indexes in migration 002 before any data exists.
2. **Second bottleneck:** Daily totals aggregation query (SUM across payments for a day). Extract to a Postgres function or materialized view when response time degrades.

---

## Sources

- [Next.js Server and Client Components — Official Docs (updated 2026-02-27)](https://nextjs.org/docs/app/getting-started/server-and-client-components) — HIGH confidence
- [Next.js App Router Project Structure — Official Docs](https://nextjs.org/docs/app/getting-started/project-structure) — HIGH confidence
- [Supabase Row Level Security — Official Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence
- [Setting up Server-Side Auth for Next.js — Supabase Official](https://supabase.com/docs/guides/auth/server-side/nextjs) — HIGH confidence
- [Next.js PWA Guide — Official](https://nextjs.org/docs/app/guides/progressive-web-apps) — HIGH confidence
- [Next.js Server Actions and Mutations — Official](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) — HIGH confidence
- [Next.js + Supabase in production: what would I do differently — catjam.fi](https://catjam.fi/articles/next-supabase-what-do-differently) — MEDIUM confidence (practitioner post-mortem, verified patterns align with official docs)
- [MakerKit Next.js Supabase Architecture — makerkit.dev](https://makerkit.dev/docs/next-supabase/architecture) — MEDIUM confidence (production SaaS kit, widely referenced)
- [Supabase RLS Performance: index owner_user_id — community guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH confidence (official docs section on performance)

---

*Architecture research for: Solo Stylist OS — Next.js App Router + Supabase PWA*
*Researched: 2026-03-01*
