# Phase 2: Setup - Research

**Researched:** 2026-03-01
**Domain:** Next.js App Router + Supabase CRUD, multi-step onboarding, mobile-first bottom sheet UI, client CRM with search
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Onboarding flow**
- Step-by-step wizard (not single form) — one screen per step with progress indicator
- Steps: 1) Trading name (required), 2) Working hours, 3) Slot size
- Only trading name is required — phone, address, working hours, slot size all have sensible defaults (Mon-Fri 9-5, 15-min slots)
- Working hours use toggle per day + start/end time dropdowns (not visual grid)
- After completing onboarding, land on the diary (home screen) — no intermediate prompts
- Sets `onboarding_completed = true` on the profiles table when finished

**Services catalogue**
- Services grouped by category with collapsible sections — uncategorised services show at top
- Add/edit service via bottom sheet (slide-up panel) — name, duration, price, category, deposit config
- Swipe left to deactivate a service — deactivated services move to greyed-out "Hidden" section at bottom
- Swipe again on hidden service to reactivate
- Subtle "Deposit" badge visible on list for services with deposit rules configured
- Each service row shows: name, duration, price, category colour/label

**Client management**
- Alphabetical list with pinned search bar at top and A-Z section headers
- Search matches partial name or phone — must return results in under 3 seconds
- Each list row shows: client name, phone snippet, tag chips
- Add new client via bottom sheet (consistent with services pattern)
- Client detail page uses tabbed sections: "Details" (contact info, tags, marketing consent), "Notes" (general + treatment timeline), "Colour" (formulas)
- Tap to edit client details inline

**Client tags**
- Preset tags available out of the box (e.g. "Allergy", "VIP", "New client")
- Stylist can also type to create custom tags on the fly
- Tags display as coloured chips on client list rows and detail page

**Notes & colour formulas**
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

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-02 | User can set up business profile (trading name, phone, optional address) | Onboarding wizard — Step 1 captures trading name; profile PATCH via Supabase server action |
| AUTH-03 | User can configure working hours per weekday | Onboarding wizard — Step 2; working_hours JSONB column on profiles; toggle + time dropdowns; sensible UK salon defaults |
| AUTH-04 | User can set default appointment slot size (15-min default) | Onboarding wizard — Step 3; default_slot_minutes INTEGER on profiles; select dropdown 15/30/45/60 |
| SERV-01 | User can create services with name, duration, and price | Services bottom sheet + Server Action; services table ready; price stored as integer pennies |
| SERV-02 | User can assign optional categories to services | service_categories table with sort_order; category_id FK on services; create-on-fly from bottom sheet |
| SERV-03 | User can toggle services active/inactive without deleting | is_active boolean on services; swipe-left gesture triggers PATCH; deactivated services in "Hidden" section |
| SERV-04 | User can set per-service deposit rules (fixed £ or %, optional/required) | deposit_type, deposit_value, deposit_required on services; configure in bottom sheet form |
| CLNT-01 | User can create clients with name (required), phone, email, address | Clients bottom sheet; clients table has first_name (required), last_name, phone, email, address |
| CLNT-02 | User can set marketing consent flag per client | marketing_consent boolean on clients; toggle in Details tab |
| CLNT-03 | User can search clients by name or phone (partial matching) | Supabase `.ilike()` with `%query%`; indexes idx_clients_owner_name + idx_clients_owner_phone; debounced client-side search |
| CLNT-04 | User can view client timeline (past appointments, payments) | Client detail "Notes" tab provides note/formula timeline; full appointment history deferred to Phase 3 diary views |
| CLNT-05 | User can add general notes to clients (free text) | client_notes table, note_type='general'; reverse-chronological timeline display |
| CLNT-06 | User can store colour formulas and treatment notes per client | colour_formulas table (formula + notes fields) and client_notes with note_type='treatment'; Colour tab on client detail |
| CLNT-07 | User can tag clients (allergy, preferences, custom tags) | tags table with UNIQUE(owner_user_id, name); client_tags junction; preset seed + create-on-fly |
| CLNT-08 | Notes are visible during booking and appointment view | Client detail tabs; note data available via Supabase query when client is loaded (Phase 3 will reuse same data layer) |
</phase_requirements>

---

## Summary

Phase 2 covers three distinct feature areas all within the established Next.js 16 App Router + Supabase stack: an onboarding wizard (profile setup), a services catalogue (CRUD with swipe gestures), and a client CRM (search, notes, tags, colour formulas). The database schema is already fully deployed — all 12 tables with RLS policies are live. No new migrations are needed for this phase.

The dominant technical challenge is building a bottom sheet component (slide-up panel) that doesn't exist in the codebase yet. Shadcn's `Sheet` component built on `@radix-ui/react-dialog` is the right tool — `@radix-ui/react-dialog` is already installed, and the shadcn CLI is in devDependencies. `vaul` (the native drawer library) is not installed and should not be introduced; the Radix Dialog-based Sheet has sufficient animation via `tw-animate-css` which is already configured.

Client search must use `ilike` queries against Supabase with the indexed columns rather than client-side filtering over large datasets. The requirement is "under 3 seconds" — Supabase with indexes will comfortably meet this; debouncing at 200-300ms prevents excessive round trips. Form validation uses the established `react-hook-form` + `zod@^3` + `@hookform/resolvers@^5` pattern already in the project (STATE.md confirms zod v4 is blocked due to resolver incompatibility).

**Primary recommendation:** Install shadcn Sheet component (`npx shadcn add sheet`), build the wizard as a single `/onboarding` page with step state in React, and use Server Actions for all Supabase mutations (matching the existing `actions.ts` pattern in `(auth)/login/`).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Routing, Server Actions, RSC | Already installed; phase 1 established patterns |
| @supabase/ssr + @supabase/supabase-js | 0.8.0 / 2.98.0 | Database queries, auth | Already installed; client + server helpers ready |
| react-hook-form | 7.71.2 | Form state management | Already installed; used in login pattern |
| zod | 3.25.76 | Schema validation | Already installed; NOTE: must stay on v3, not upgrade to v4 |
| @hookform/resolvers | 5.2.2 | Connects zod schemas to react-hook-form | Already installed |
| shadcn/ui | 3.8.5 (CLI) | Component library via code-gen | Already configured (components.json, globals.css tokens) |
| @radix-ui/react-dialog | installed | Powers Sheet (bottom sheet) | Already in node_modules as radix-ui dependency |
| @radix-ui/react-tabs | installed | Powers Tabs (client detail) | Already in node_modules |
| @radix-ui/react-collapsible | installed | Powers collapsible category sections | Already in node_modules |
| lucide-react | 0.575.0 | Icons | Already installed; used in bottom nav |
| tailwindcss | 4.x | Styling | Already installed; v4 config via CSS |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tw-animate-css | 1.4.0 | CSS animations | Bottom sheet slide-in, step transitions |
| class-variance-authority | 0.7.1 | Component variants | Tag chip colour variants |
| tailwind-merge + clsx | installed | Class merging | `cn()` utility already in src/lib/utils.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Sheet (Radix Dialog) | vaul | vaul is a better native drawer but not installed; Radix Dialog Sheet is sufficient for this phase and requires no new dependencies |
| Server Actions | Route Handlers | Server Actions match existing pattern in login/actions.ts; simpler for this CRUD-heavy phase |
| ilike search via Supabase | Full-text search (pg_vector, fts) | FTS is overkill for name/phone partial matching; ilike with indexes is fast enough; under 3s is easily met |
| React useState for wizard step | URL-based step routing | URL routing (e.g. `/onboarding/step-2`) adds complexity; wizard is linear so in-memory step state is appropriate |

**Installation (shadcn components needed):**
```bash
npx shadcn add sheet
npx shadcn add tabs
npx shadcn add collapsible
npx shadcn add badge
```

These components are code-generated into `src/components/ui/` and customised from there.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── onboarding/
│   │   └── page.tsx          # Wizard (replaces placeholder)
│   ├── (app)/
│   │   ├── settings/
│   │   │   ├── page.tsx      # Business profile edit (post-onboarding settings)
│   │   │   └── services/
│   │   │       └── page.tsx  # Services catalogue
│   │   └── clients/
│   │       ├── page.tsx      # Client list with search
│   │       └── [id]/
│   │           └── page.tsx  # Client detail (tabbed)
├── components/
│   ├── ui/                   # shadcn generated components (sheet, tabs, badge, etc.)
│   ├── onboarding/
│   │   ├── onboarding-wizard.tsx
│   │   ├── step-trading-name.tsx
│   │   ├── step-working-hours.tsx
│   │   └── step-slot-size.tsx
│   ├── services/
│   │   ├── services-list.tsx
│   │   ├── service-sheet.tsx  # add/edit bottom sheet
│   │   └── service-row.tsx
│   └── clients/
│       ├── client-list.tsx
│       ├── client-sheet.tsx   # add new client bottom sheet
│       ├── client-row.tsx
│       └── detail/
│           ├── client-detail-tabs.tsx
│           ├── notes-tab.tsx
│           └── colour-tab.tsx
└── lib/
    └── actions/
        ├── profile.ts         # updateProfile Server Action
        ├── services.ts        # createService, updateService Server Actions
        └── clients.ts         # createClient, updateClient, addNote, addTag Server Actions
```

### Pattern 1: Server Actions for Mutations

All writes go through `'use server'` action files, matching the `(auth)/login/actions.ts` pattern. The action creates the Supabase server client, validates with zod, performs the mutation, then calls `revalidatePath` or redirects.

```typescript
// src/lib/actions/profile.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { redirect } from 'next/navigation'

const profileSchema = z.object({
  trading_name: z.string().min(1, 'Trading name is required'),
  phone: z.string().optional(),
  default_slot_minutes: z.number().int().min(15).max(60),
  working_hours: z.record(z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
  })),
})

export async function completeOnboarding(data: z.infer<typeof profileSchema>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = profileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...parsed.data,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_user_id', user.id)

  if (error) return { error: error.message }

  redirect('/diary')
}
```

### Pattern 2: Supabase CRUD Operations

```typescript
// Client-side search (debounced, runs in useEffect)
// Source: @supabase/supabase-js docs — ilike for case-insensitive partial match
const { data: clients } = await supabase
  .from('clients')
  .select(`
    id, first_name, last_name, phone,
    client_tags(tag_id, tags(name))
  `)
  .eq('owner_user_id', user.id)
  .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
  .order('first_name', { ascending: true })
  .limit(50)

// Service create
const { error } = await supabase
  .from('services')
  .insert({
    owner_user_id: user.id,
    name: data.name,
    duration_minutes: data.duration_minutes,
    price: data.price, // INTEGER pennies: £15.00 = 1500
    category_id: data.category_id || null,
    deposit_type: data.deposit_type,
    deposit_value: data.deposit_value,
    deposit_required: data.deposit_required,
  })

// Toggle service active/inactive (swipe action)
const { error } = await supabase
  .from('services')
  .update({ is_active: !service.is_active, updated_at: new Date().toISOString() })
  .eq('id', service.id)
  .eq('owner_user_id', user.id) // belt-and-suspenders (RLS already enforces)
```

### Pattern 3: Onboarding Wizard (multi-step with React state)

```typescript
// src/app/onboarding/page.tsx — Server Component shell
// Redirect to /diary if already onboarded
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) redirect('/diary')

  return <OnboardingWizard />
}
```

```typescript
// src/components/onboarding/onboarding-wizard.tsx — Client Component
'use client'

import { useState } from 'react'
import { StepTradingName } from './step-trading-name'
import { StepWorkingHours } from './step-working-hours'
import { StepSlotSize } from './step-slot-size'

const STEPS = ['trading-name', 'working-hours', 'slot-size'] as const
type Step = typeof STEPS[number]

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>('trading-name')
  const [data, setData] = useState({
    trading_name: '',
    working_hours: DEFAULT_WORKING_HOURS,
    default_slot_minutes: 15,
  })

  // Progress: (currentIndex / total) * 100
  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  // ...
}

// UK salon defaults (Tue-Sat 9:00-17:00, Sun-Mon off)
const DEFAULT_WORKING_HOURS = {
  mon: { enabled: false, start: '09:00', end: '17:00' },
  tue: { enabled: true,  start: '09:00', end: '17:00' },
  wed: { enabled: true,  start: '09:00', end: '17:00' },
  thu: { enabled: true,  start: '09:00', end: '17:00' },
  fri: { enabled: true,  start: '09:00', end: '17:00' },
  sat: { enabled: true,  start: '09:00', end: '17:00' },
  sun: { enabled: false, start: '09:00', end: '17:00' },
}
```

### Pattern 4: Bottom Sheet (shadcn Sheet component)

Shadcn's Sheet is a Dialog variant pre-configured to slide from a chosen side. Install via `npx shadcn add sheet` which generates `src/components/ui/sheet.tsx`. Use `side="bottom"` for the slide-up panel pattern.

```typescript
// src/components/services/service-sheet.tsx
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  duration_minutes: z.number().int().min(5),
  price: z.number().int().min(0), // pennies
  category_id: z.string().uuid().optional(),
  deposit_type: z.enum(['none', 'fixed', 'percentage']),
  deposit_value: z.number().int().min(0),
  deposit_required: z.boolean(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

interface ServiceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service // undefined = create mode
}

export function ServiceSheet({ open, onOpenChange, service }: ServiceSheetProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? {
      name: service.name,
      duration_minutes: service.duration_minutes,
      price: service.price,
      // ...
    } : {
      deposit_type: 'none',
      deposit_value: 0,
      deposit_required: false,
    }
  })

  async function onSubmit(values: ServiceFormValues) {
    // Call Server Action
    const result = await (service ? updateService(service.id, values) : createService(values))
    if (!result?.error) onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{service ? 'Edit Service' : 'Add Service'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* fields */}
        </form>
      </SheetContent>
    </Sheet>
  )
}
```

### Pattern 5: Swipe-to-Deactivate with Touch Events

No third-party swipe library is needed. The pattern uses a combination of CSS `transform: translateX` driven by React pointer/touch event handlers. Alternatively, a simple "swipe affordance" can be achieved with a long-press context menu or a secondary tap action — but the CONTEXT.md explicitly specifies swipe left.

Implementation approach (no library):
- Track `touchstart`/`touchmove`/`touchend` on the service row
- If horizontal delta > 80px leftward, animate the row and call the deactivate action
- Use `useRef` for swipe state (not `useState`) to avoid re-renders during drag
- Reset position on `touchend` if threshold not met

```typescript
// Swipe detection in service-row.tsx
const touchStartX = useRef<number>(0)
const [swiped, setSwiped] = useState(false)

function handleTouchStart(e: React.TouchEvent) {
  touchStartX.current = e.touches[0].clientX
}
function handleTouchEnd(e: React.TouchEvent) {
  const delta = touchStartX.current - e.changedTouches[0].clientX
  if (delta > 80) { // px threshold
    setSwiped(true)
  }
}
```

When `swiped` is true, reveal a red "Deactivate" button or immediately trigger the action.

### Pattern 6: Client Search with Debounce

```typescript
// src/app/(app)/clients/page.tsx (Server Component loads initial list)
// Client search happens client-side via useEffect + Supabase browser client

'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useTransition } from 'react'

function useClientSearch(query: string) {
  const [results, setResults] = useState<Client[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        if (!query.trim()) {
          // load default (all, alphabetical)
          return
        }
        const supabase = createClient()
        const { data } = await supabase
          .from('clients')
          .select('id, first_name, last_name, phone, client_tags(tag_id, tags(name))')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
          .order('first_name')
          .limit(50)
        setResults(data ?? [])
      })
    }, 250) // 250ms debounce
    return () => clearTimeout(timer)
  }, [query])

  return { results, isPending }
}
```

### Pattern 7: Price Handling (Pennies)

All monetary values are stored as integers (pennies). Display and input conversion:

```typescript
// Display: pennies → formatted string
function formatPrice(pennies: number): string {
  return `£${(pennies / 100).toFixed(2)}`
}

// Input: user types "15.00" → store as 1500
function parsePriceToPennies(input: string): number {
  return Math.round(parseFloat(input) * 100)
}
```

The form collects price as a string input (type="text" with inputMode="decimal"), converts to pennies before calling the Server Action.

### Pattern 8: Tabs for Client Detail (shadcn Tabs)

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="details">
  <TabsList className="w-full grid grid-cols-3">
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="notes">Notes</TabsTrigger>
    <TabsTrigger value="colour">Colour</TabsTrigger>
  </TabsList>
  <TabsContent value="details">...</TabsContent>
  <TabsContent value="notes">...</TabsContent>
  <TabsContent value="colour">...</TabsContent>
</Tabs>
```

### Anti-Patterns to Avoid

- **Using `getSession()` server-side:** Always `getUser()` — this is already enforced in the proxy.ts and established as a firm project decision.
- **Storing prices as floats:** All monetary values are INTEGER pennies. Never `parseFloat` without rounding to integer before storing.
- **Using zod v4:** The `@hookform/resolvers` package has a known TypeScript incompatibility with zod v4. Stay on zod@^3.
- **Client-side filtering of all clients:** Don't load all clients into memory and filter in JS. Use Supabase `ilike` with the indexed columns.
- **Building a custom dialog/modal from scratch:** Radix Dialog is already available. Use shadcn Sheet.
- **Storing working hours as separate rows:** The `working_hours` column is JSONB on the profiles table — store the entire week as a single JSON object.
- **Seeding preset tags via migration:** Preset tags should be created per-user (belong to `owner_user_id`). Seed them as part of the onboarding completion Server Action, not a global migration.
- **Re-fetching after every mutation without revalidation:** Use `revalidatePath` in Server Actions to trigger Next.js cache invalidation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-up panel / bottom sheet | Custom CSS drawer with z-index hacks | `npx shadcn add sheet` (Radix Dialog) | Focus trap, escape key, backdrop, accessibility — all handled |
| Tabbed navigation on client detail | Custom tab state + CSS | `npx shadcn add tabs` (Radix Tabs) | Keyboard navigation, ARIA roles, active state |
| Form validation | Manual field-by-field validation | react-hook-form + zod (already installed) | Already in the codebase; consistent with login form |
| Swipe detection library | External library (react-swipeable, etc.) | Native touch events (see Pattern 5) | Simple 80px threshold is all that's needed; saves a dependency |
| Search debouncing | Custom debounce hook | `setTimeout` in `useEffect` (see Pattern 6) | Too simple to warrant a library; lodash.debounce is unnecessary |
| Tag colour assignment | Manual colour picker per tag | Deterministic colour from tag name/index | Users don't need to choose — assign from a palette based on tag ID hash |

**Key insight:** This phase is CRUD-heavy, not algorithmically complex. The value is in the UX polish (bottom sheets, swipe, search feel), not custom infrastructure. Reach for shadcn components immediately rather than building primitives.

---

## Common Pitfalls

### Pitfall 1: Onboarding Route Not Protected After Completion
**What goes wrong:** User bookmarks `/onboarding` and re-completes wizard, overwriting their profile.
**Why it happens:** The onboarding route doesn't check `onboarding_completed`.
**How to avoid:** The onboarding page server component reads `onboarding_completed` from profiles and redirects to `/diary` if true (see Pattern 3 above).
**Warning signs:** Users re-entering wizard unexpectedly.

### Pitfall 2: Services Catalogue Has No Route
**What goes wrong:** There is no `/services` route in the app (and none in the bottom nav). Services belong under Settings.
**Why it happens:** Easy to create `/services` as a standalone tab, but CONTEXT.md implies services are managed within settings.
**How to avoid:** Create `/settings/services/page.tsx` and link to it from the Settings page. The bottom nav already has Settings. No new nav tab needed for Phase 2.
**Warning signs:** Adding a 5th tab to the bottom nav.

### Pitfall 3: Working Hours JSONB Validation Gap
**What goes wrong:** Invalid JSON shapes written to `working_hours` column (e.g. missing `enabled` key) break booking logic in Phase 3.
**Why it happens:** JSONB has no column-level schema — database accepts any JSON.
**How to avoid:** Validate the complete working_hours object with a strict zod schema before updating (see Server Action pattern above). Use a typed interface for the working hours structure throughout the codebase.

### Pitfall 4: Preset Tags Created at Migration Time (Wrong)
**What goes wrong:** Global tags created in the migration are not scoped to individual users (no `owner_user_id`), violating RLS. RLS policies only allow selecting rows where `owner_user_id = auth.uid()`.
**Why it happens:** It feels natural to seed default data in migrations.
**How to avoid:** Insert preset tags (e.g. "Allergy", "VIP", "New client") in the `completeOnboarding` Server Action after the profile is updated, using the authenticated user's ID as `owner_user_id`. Use upsert to be idempotent.

### Pitfall 5: Price Input/Output Mismatch (Float vs Pennies)
**What goes wrong:** Displaying `1500` instead of `£15.00`, or storing `15.5` instead of `1550`.
**Why it happens:** Developers forget the pennies convention mid-implementation.
**How to avoid:** Add `formatPrice(pennies: number)` and `parsePriceToPennies(str: string)` helpers in `src/lib/utils.ts`. Use them consistently. Never store the raw `parseFloat` value.

### Pitfall 6: Swipe Gesture Conflicts with Scroll
**What goes wrong:** Attempting to swipe left on a service row accidentally scrolls the page vertically.
**Why it happens:** Touch events need `preventDefault()` only for horizontal swipes, not vertical.
**How to avoid:** In the `touchmove` handler, call `e.preventDefault()` only when the horizontal delta exceeds the vertical delta (i.e. the user's intent is clearly horizontal). Track both X and Y on `touchstart`.

### Pitfall 7: Supabase Search Returns Nothing (Type Mismatch)
**What goes wrong:** Searching "07700" finds no clients even though `phone = '07700 900000'` exists.
**Why it happens:** The `.ilike()` filter is applied but the column contains formatted numbers with spaces.
**How to avoid:** Search with `%query%` pattern — this handles substrings anywhere in the value. Already specified in the pattern above.

### Pitfall 8: Bottom Sheet on iOS Does Not Show Keyboard Correctly
**What goes wrong:** Soft keyboard pushes the bottom sheet off screen on iOS Safari.
**Why it happens:** iOS Safari handles `position: fixed` and keyboard display differently from Android/desktop.
**How to avoid:** Use `max-h-[90vh] overflow-y-auto` on the SheetContent (already in Pattern 4 example). Avoid `min-h-screen` on the sheet. Test on iOS Safari specifically.

---

## Code Examples

Verified patterns from existing codebase and established stack:

### Server Action Pattern (from src/app/(auth)/login/actions.ts)
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createService(data: ServiceInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // validate with zod (see profileSchema pattern above)

  const { error } = await supabase
    .from('services')
    .insert({ owner_user_id: user.id, ...validated })

  if (error) return { error: error.message }

  // Trigger Next.js ISR revalidation for the services page
  revalidatePath('/settings/services')
}
```

### Supabase Browser Client (from src/lib/supabase/client.ts)
```typescript
import { createClient } from '@/lib/supabase/client'

// For client-side search in Client List component
const supabase = createClient() // uses NEXT_PUBLIC_ env vars
```

### cn() Utility (from src/lib/utils.ts)
```typescript
import { cn } from '@/lib/utils'

// Conditionally apply classes
<div className={cn('base-classes', isActive && 'active-classes', className)}>
```

### Working Hours JSON Shape
```typescript
// This is the canonical structure for the working_hours JSONB column
interface WorkingHours {
  mon: { enabled: boolean; start: string; end: string }  // e.g. { enabled: false, start: '09:00', end: '17:00' }
  tue: { enabled: boolean; start: string; end: string }
  wed: { enabled: boolean; start: string; end: string }
  thu: { enabled: boolean; start: string; end: string }
  fri: { enabled: boolean; start: string; end: string }
  sat: { enabled: boolean; start: string; end: string }
  sun: { enabled: boolean; start: string; end: string }
}
```

### Client Notes Timeline Query
```typescript
// Fetch all notes + colour formulas for a client in reverse-chrono order
// Two queries merged client-side (or use Supabase view if preferred)

const [notesResult, formulasResult] = await Promise.all([
  supabase
    .from('client_notes')
    .select('id, note_type, content, created_at, updated_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false }),
  supabase
    .from('colour_formulas')
    .select('id, formula, notes, created_at, updated_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
])

// Merge and sort client-side for single reverse-chrono timeline
const timeline = [
  ...(notesResult.data ?? []).map(n => ({ ...n, type: n.note_type })),
  ...(formulasResult.data ?? []).map(f => ({ ...f, type: 'colour_formula' as const })),
].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
```

### Supabase Tags Upsert (Preset Tag Seeding)
```typescript
// In completeOnboarding Server Action — insert preset tags idempotently
const PRESET_TAGS = ['Allergy', 'VIP', 'New client', 'Sensitive scalp', 'Regular']

await supabase
  .from('tags')
  .upsert(
    PRESET_TAGS.map(name => ({ owner_user_id: user.id, name })),
    { onConflict: 'owner_user_id,name', ignoreDuplicates: true }
  )
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` for auth proxy | `proxy.ts` with `export function proxy()` | Next.js 16 | Already done in this project; middleware.ts deprecated |
| `await cookies()` not needed (Next.js 14) | `const cookieStore = await cookies()` | Next.js 15+ | Already handled in src/lib/supabase/server.ts |
| Zod v4 | Stay on zod@^3 | Active incompatibility (March 2026) | @hookform/resolvers v5 TypeScript incompatibility with zod v4 — do NOT upgrade |
| `getSession()` server-side | `getUser()` | Security fix | Already enforced in proxy.ts |
| Individual @radix-ui/* packages | `radix-ui` monorepo package | Recent | Project uses `radix-ui` (unified); shadcn components may still import from `@radix-ui/*` scoped packages — both are installed |

**Deprecated/outdated:**
- `middleware.ts` default export: Renamed to `proxy.ts` with named export in this project — don't revert.
- Zod v4 API (`z.string().check()`, etc.): Don't use even if IDE suggests — must stay on v3 API.

---

## Open Questions

1. **Where does the Services page live in the navigation?**
   - What we know: Services catalogue is a Phase 2 requirement. No `/services` route exists. The bottom nav has 4 tabs: Diary, Clients, Money, Settings.
   - What's unclear: CONTEXT.md doesn't specify exactly where services are accessed post-onboarding. "Settings" tab is the most natural home.
   - Recommendation: Place services at `/settings/services` and link from the Settings index page. The Settings page is currently a placeholder — it can become a list of settings sections (Business Profile, Services, etc.). Confirm with user if needed during planning.

2. **Services table has no `colour` field for category — how should category colour chips be rendered?**
   - What we know: `service_categories` has `id`, `owner_user_id`, `name`, `sort_order`. No `colour` column.
   - What's unclear: CONTEXT.md mentions "category colour/label" in service rows but the schema has no colour column.
   - Recommendation: Assign colours deterministically from a palette based on `category_id` (first char of UUID maps to a colour). This avoids a schema change. Alternatively, add `colour TEXT` to service_categories in a Phase 2 migration — simple change, low risk. The planner should decide; lean toward a migration for better UX.

3. **CLNT-04 scope for this phase vs Phase 3**
   - What we know: CLNT-04 says "User can view client timeline (past appointments, payments)". Appointments are a Phase 3 concern.
   - What's unclear: How much of CLNT-04 is in scope for Phase 2?
   - Recommendation: Phase 2 satisfies CLNT-04 partially — notes and colour formula timeline are visible. The appointment/payment history portion of the timeline is delivered in Phase 3 when bookings exist. Document this clearly in the plan.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase — `supabase/migrations/20260301000000_initial_schema.sql` — full schema inspection
- Existing codebase — `src/` file tree — established patterns in login, auth callback, supabase client/server helpers
- `package.json` — confirmed exact versions of all dependencies
- `node_modules/@radix-ui/` — confirmed all Radix primitives are installed (dialog, tabs, collapsible, accordion)
- `components.json` — shadcn configured with new-york style, CSS variables, lucide icons
- `.planning/STATE.md` — confirmed zod v3 decision, getUser() enforcement, penny integer convention

### Secondary (MEDIUM confidence)
- shadcn/ui Sheet component docs (shadcn.com) — Radix Dialog variant with `side="bottom"` for slide-up panels
- Supabase docs — `.ilike()` filter for partial string matching
- @hookform/resolvers v5 + zod v3 compatibility — confirmed by STATE.md note referencing GitHub issues #799, #813, #4992

### Tertiary (LOW confidence)
- iOS Safari keyboard + bottom sheet interaction — common knowledge but not verified against specific iOS version
- Swipe gesture conflict resolution (horizontal vs vertical touch events) — general web platform knowledge

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from node_modules and package.json
- Architecture: HIGH — patterns derived directly from existing codebase files
- Database schema: HIGH — full migration file read; all columns and constraints known
- Pitfalls: MEDIUM — iOS keyboard behaviour is LOW confidence; others derived from code analysis
- Swipe implementation: MEDIUM — native touch events are standard but not tested in this specific layout

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable stack; main risk is @hookform/resolvers zod v4 compatibility being resolved)
