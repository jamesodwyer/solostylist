# Phase 4: Payments - Research

**Researched:** 2026-03-02
**Domain:** Payment logging, refund/void adjustment records, audit trail, money page UI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PAY-01 | User can record a cash payment against a client/appointment | payments table already has `method IN ('cash', 'card')` and `payment_type = 'payment'`; Server Action inserts with owner_user_id, appointment_id, client_id, amount (pennies), method, paid_at |
| PAY-02 | User can record a card payment against a client/appointment (log only) | Same table + Server Action as PAY-01; method = 'card'; no Stripe — log-only per PROJECT.md decision |
| PAY-03 | Payment records store method, amount, timestamp | Schema columns: `method TEXT`, `amount INTEGER`, `paid_at TIMESTAMPTZ DEFAULT now()`; all required fields enforced at DB level |
| PAY-04 | User can record refund/void as adjustment transaction (audit trail) | `payment_type IN ('payment', 'refund', 'void')`, `reference_payment_id UUID REFERENCES payments(id)`; original row untouched; new row inserted as adjustment; audit_log table records action |
</phase_requirements>

---

## Summary

Phase 4 is the lightest schema-work phase in the project. The `payments` table and `audit_log` table were fully designed in the Phase 1 migration and are already live. No new Supabase migrations are required. The table supports `payment_type IN ('payment', 'refund', 'void')` with a `reference_payment_id` self-reference for linking adjustments to originals. RLS is already enabled with per-user policies. The `idx_payments_owner_date` and `idx_payments_appointment` indexes are already deployed.

The primary work in this phase is: (1) a payment Server Action file at `src/lib/actions/payments.ts`, (2) a payment-recording UI (bottom sheet triggered from the appointment detail sheet when status is 'completed'), (3) a refund/void UI (accessible from any paid appointment or from the Money page), and (4) populating the Money page stub at `/money` with daily payment totals and a payment list. Payments also need to appear in the client timeline at `/clients/[id]` — this page already has tabs and a timeline pattern that can be extended.

No new npm packages are required. The stack — Next.js App Router, Supabase JS client, react-hook-form + zod v3, shadcn Sheet, Tailwind, lucide-react — is identical to Phase 3. The `parsePriceToPennies` and `formatPrice` utilities are already in `src/lib/utils.ts`. The audit log pattern is new to this phase but is a simple Supabase insert with no additional library.

**Primary recommendation:** Build a `createPayment` and `createAdjustment` Server Action against the existing schema, trigger payment recording from the appointment sheet post-completion, display payments on the Money page and in the client timeline.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 16.1.6 | Server Components, Server Actions, routing | Already installed; matches all prior phases |
| @supabase/ssr + @supabase/supabase-js | 0.8.0 / 2.98.0 | payments table queries, audit_log inserts | Already installed |
| zod | 3.25.76 | Schema validation for payment inputs | Already installed; must stay v3 (hookform/resolvers TS incompatibility with v4) |
| react-hook-form | 7.71.2 | Form state in payment sheet | Already installed |
| @hookform/resolvers | 5.2.2 | zodResolver — must cast `as any` per STATE.md decision | Already installed |
| shadcn Sheet | installed | Bottom sheet for payment recording | Already at `src/components/ui/sheet.tsx` |
| lucide-react | 0.575.0 | Icons (Banknote, CreditCard, RotateCcw, etc.) | Already installed |
| tailwindcss | 4.x | Styling | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | installed | cn() utility | Already in `src/lib/utils.ts` |
| tw-animate-css | 1.4.0 | Sheet slide animations | Already configured |
| radix-ui | 1.4.3 | Tabs on Money page (reuse existing shadcn Tabs pattern) | Already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions | Route handlers (API routes) | Server Actions match established Phase 2/3 pattern; no reason to deviate |
| Self-referencing payments table | Separate refunds/adjustments table | Existing schema uses self-ref; no migration needed; accepted design |
| Manual audit_log inserts | DB trigger | DB trigger would require a migration and is harder to add context (action label, details JSON); manual insert from Server Action is simpler and more flexible |

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
│   └── (app)/
│       └── money/
│           └── page.tsx              # Server Component: loads today's payments, daily total
├── components/
│   └── payments/
│       ├── payment-sheet.tsx         # Client Component: bottom sheet for recording cash/card payment
│       ├── adjustment-sheet.tsx      # Client Component: bottom sheet for recording refund/void
│       └── payment-list.tsx          # Client Component: list of payment rows with method/amount/type
└── lib/
    └── actions/
        └── payments.ts               # createPayment, createAdjustment Server Actions
```

The appointment sheet (`src/components/diary/appointment-sheet.tsx`) gets a "Take Payment" button added when `appointment.status === 'completed'` and no payment has been recorded yet. This button opens `PaymentSheet`.

The client detail page (`src/app/(app)/clients/[id]/page.tsx`) needs payment data fetched and passed to the timeline tab — existing tabs pattern supports this.

### Pattern 1: createPayment Server Action
**What:** Insert a payment row; also insert an audit_log row.
**When to use:** User records cash or card payment for a completed appointment.

```typescript
// src/lib/actions/payments.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPaymentSchema = z.object({
  appointment_id: z.string().uuid().optional(),
  client_id: z.string().uuid(),
  amount: z.number().int().positive(),  // INTEGER pennies
  method: z.enum(['cash', 'card']),
  notes: z.string().optional(),
})

export async function createPayment(data: z.infer<typeof createPaymentSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createPaymentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(', ') || 'Invalid payment data' }
  }

  // Insert payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      owner_user_id: user.id,
      appointment_id: parsed.data.appointment_id ?? null,
      client_id: parsed.data.client_id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      payment_type: 'payment',
      notes: parsed.data.notes ?? null,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (paymentError) {
    return { error: paymentError.message }
  }

  // Audit log: record payment action
  await supabase.from('audit_log').insert({
    owner_user_id: user.id,
    action: 'payment_created',
    entity_type: 'payment',
    entity_id: payment.id,
    details: {
      amount: parsed.data.amount,
      method: parsed.data.method,
      appointment_id: parsed.data.appointment_id ?? null,
      client_id: parsed.data.client_id,
    },
  })

  revalidatePath('/money')
  revalidatePath('/diary')
  if (parsed.data.client_id) {
    revalidatePath(`/clients/${parsed.data.client_id}`)
  }
  return { success: true, paymentId: payment.id }
}
```

### Pattern 2: createAdjustment Server Action (Refund / Void)
**What:** Insert a new payment row with `payment_type = 'refund'` or `'void'`, referencing the original via `reference_payment_id`. Original row is NOT modified.
**When to use:** User records a refund or void against an existing payment.

```typescript
const createAdjustmentSchema = z.object({
  reference_payment_id: z.string().uuid(),
  adjustment_type: z.enum(['refund', 'void']),
  amount: z.number().int().positive(),  // Refund amount in pennies (may be partial)
  method: z.enum(['cash', 'card']),     // Matches original payment method typically
  notes: z.string().optional(),
})

export async function createAdjustment(data: z.infer<typeof createAdjustmentSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parsed = createAdjustmentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(', ') || 'Invalid adjustment data' }
  }

  // Fetch the original payment to get client_id and appointment_id
  const { data: original, error: origError } = await supabase
    .from('payments')
    .select('client_id, appointment_id, amount, method')
    .eq('id', parsed.data.reference_payment_id)
    .eq('owner_user_id', user.id)  // RLS redundancy — defence in depth
    .single()

  if (origError || !original) {
    return { error: 'Original payment not found.' }
  }

  // Insert adjustment row (negative amount for refunds is conventional but not enforced by schema)
  // Store amount as positive integer; payment_type distinguishes direction
  const { data: adjustment, error: adjustError } = await supabase
    .from('payments')
    .insert({
      owner_user_id: user.id,
      appointment_id: original.appointment_id,
      client_id: original.client_id,
      amount: parsed.data.amount,
      method: parsed.data.method,
      payment_type: parsed.data.adjustment_type,  // 'refund' or 'void'
      reference_payment_id: parsed.data.reference_payment_id,
      notes: parsed.data.notes ?? null,
      paid_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (adjustError) {
    return { error: adjustError.message }
  }

  // Audit log: refunds and voids are sensitive — DATA-03 requires this
  await supabase.from('audit_log').insert({
    owner_user_id: user.id,
    action: `payment_${parsed.data.adjustment_type}`,  // 'payment_refund' or 'payment_void'
    entity_type: 'payment',
    entity_id: adjustment.id,
    details: {
      reference_payment_id: parsed.data.reference_payment_id,
      adjustment_type: parsed.data.adjustment_type,
      amount: parsed.data.amount,
      method: parsed.data.method,
      client_id: original.client_id,
      appointment_id: original.appointment_id,
    },
  })

  revalidatePath('/money')
  revalidatePath('/diary')
  revalidatePath(`/clients/${original.client_id}`)
  return { success: true, adjustmentId: adjustment.id }
}
```

### Pattern 3: Money Page — Daily Totals Query
**What:** Load payments for today (or a given date) and group by type/method.
**When to use:** Money page Server Component.

```typescript
// src/app/(app)/money/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const dateStr = params.date ?? new Date().toISOString().split('T')[0]

  const dayStart = new Date(`${dateStr}T00:00:00.000Z`).toISOString()
  const dayEnd   = new Date(`${dateStr}T23:59:59.999Z`).toISOString()

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, amount, method, payment_type, notes, paid_at,
      reference_payment_id,
      clients(first_name, last_name),
      appointments(starts_at)
    `)
    .eq('owner_user_id', user.id)
    .gte('paid_at', dayStart)
    .lte('paid_at', dayEnd)
    .order('paid_at', { ascending: false })

  // Compute daily totals in Server Component
  const totalIn = (payments ?? [])
    .filter(p => p.payment_type === 'payment')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalRefunded = (payments ?? [])
    .filter(p => p.payment_type === 'refund' || p.payment_type === 'void')
    .reduce((sum, p) => sum + p.amount, 0)

  const net = totalIn - totalRefunded

  return (
    // ... render MoneyView with payments, totalIn, totalRefunded, net, dateStr
  )
}
```

### Pattern 4: Payment Sheet (Bottom Sheet UI)
**What:** A bottom sheet for recording a payment. Follows the same multi-mode sheet pattern from Phase 3 (`appointment-sheet.tsx`).
**When to use:** Triggered from appointment sheet when appointment is 'completed'.

```typescript
// src/components/payments/payment-sheet.tsx
'use client'
// Props: open, onOpenChange, appointmentId, clientId, suggestedAmount (total from appointment_services)
// Fields: method (cash/card toggle), amount (pre-filled with suggestedAmount), notes (optional)
// On submit: call createPayment Server Action via useTransition
// Pattern: same as appointment-sheet.tsx mode switching
```

The `amount` field should be pre-filled with the sum of `appointment_services.service_price` for the appointment. The user can override it (e.g. partial payment, discount).

Input for amount: use a text input that accepts decimal strings (e.g. "25.00") and converts to pennies on submit using the existing `parsePriceToPennies` from `src/lib/utils.ts`.

### Pattern 5: Payments in Client Timeline
**What:** Fetch and render payment records alongside appointments in the client detail page.
**When to use:** When client timeline (Notes/History tab) is rendered.

The existing client detail page (`src/app/(app)/clients/[id]/page.tsx`) fetches notes, colour_formulas, tags. Add a payments query and pass to `ClientDetailTabs`. The timeline merges payments and appointments chronologically.

```typescript
// Add to client detail page Server Component
const { data: clientPayments } = await supabase
  .from('payments')
  .select('id, amount, method, payment_type, reference_payment_id, paid_at, notes, appointments(starts_at)')
  .eq('client_id', id)
  .eq('owner_user_id', user.id)
  .order('paid_at', { ascending: false })
```

### Anti-Patterns to Avoid

- **Storing amount as float:** The schema defines `amount INTEGER`. Always store pennies. Use `parsePriceToPennies` from `src/lib/utils.ts` to convert user input. Never `parseFloat` directly into the DB.
- **Mutating the original payment row for refunds:** The design uses immutable payment rows. Refunds/voids create NEW rows referencing the original via `reference_payment_id`. Never update `payment_type` on an existing row.
- **Skipping the audit_log insert for adjustments:** DATA-03 requires audit log for refunds and voids. The audit_log insert should happen in the same Server Action, immediately after the payment insert.
- **Computing net totals client-side with floats:** Always compute totals in integer pennies (sum, then divide for display). Never `.toFixed(2)` intermediate values.
- **Using getSession() server-side:** Must use `getUser()` — established project decision from STATE.md.
- **Not revalidating /clients/[clientId]:** After a payment, the client timeline needs to reflect it. Call `revalidatePath('/clients/' + clientId)` in the Server Action.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal-to-pennies conversion | Custom parsing logic | `parsePriceToPennies` from `src/lib/utils.ts` | Already implemented, tested in prior phases |
| Pennies-to-display formatting | Custom £ formatter | `formatPrice` from `src/lib/utils.ts` | Already implemented (1500 → "£15.00") |
| Bottom sheet UI | Custom modal/drawer | shadcn `Sheet` from `src/components/ui/sheet.tsx` | Already installed, iOS Safari handling solved |
| RLS enforcement | Manual user filter on every query | Supabase RLS + `getUser()` pattern | RLS enforces `owner_user_id = auth.uid()` at DB level; `eq('owner_user_id', user.id)` is defence-in-depth only |
| Audit log infrastructure | Custom audit table | `audit_log` table already in schema | Already deployed with SELECT + INSERT policies, no UPDATE/DELETE (append-only) |
| Payment form state | Custom state management | `react-hook-form` + `zod` | Established pattern from Phase 2/3; handles validation, error display, pending state |

**Key insight:** The schema design already solved all the hard problems (immutable audit trail, self-referencing adjustments, indexed queries). Phase 4 is primarily UI + Server Actions gluing the existing schema to the user.

---

## Common Pitfalls

### Pitfall 1: Float Arithmetic for Currency
**What goes wrong:** Amount stored as 15.50 instead of 1550; `£0.00` displays or rounding errors appear.
**Why it happens:** Developer uses `parseFloat(inputValue)` and stores directly, or multiplies float by 100 and gets floating point error (e.g. 14.9999... instead of 1500).
**How to avoid:** Use `Math.round(parseFloat(input) * 100)` — exactly what `parsePriceToPennies` already does. Never store non-integer amounts.
**Warning signs:** £15.499999 appearing in totals, or amount column rejecting inserts (Postgres INTEGER rejects 15.50).

### Pitfall 2: Showing Balance as Sum Without Accounting for Adjustments
**What goes wrong:** Daily total shows £150 when £30 was refunded — net should be £120.
**Why it happens:** Developer sums all payment rows without filtering by `payment_type`.
**How to avoid:** Filter: `payment_type === 'payment'` rows sum to gross; `payment_type IN ('refund', 'void')` rows sum to deductions; net = gross - deductions.
**Warning signs:** Daily totals exceeding what was actually collected.

### Pitfall 3: Audit Log Insert Failure Silently Ignored
**What goes wrong:** A refund is recorded but no audit trail is created. DATA-03 compliance fails.
**Why it happens:** Audit log insert error is not checked (developer assumes it always succeeds).
**How to avoid:** Check `audit_log` insert error. If it fails, log to console but do NOT roll back the payment — the payment already happened. The audit log failure is a secondary concern; surface it in development but don't fail the user action.
**Warning signs:** audit_log table has fewer rows than payments table (for refunds/voids).

### Pitfall 4: Void vs Refund Semantics Confusion
**What goes wrong:** "Void" is treated as "full refund" in the UI but the schema supports them as distinct types.
**Why it happens:** Developer conflates void (cancelled transaction, typically same-day) and refund (return of money after completion).
**How to avoid:** For this MVP, treat them as equivalent in the UI — both create an adjustment row. The distinction is captured in `payment_type`. The UI can offer both options with simple labels: "Refund" and "Void (cancel)". The amount for a void is typically the full original amount; for a refund it may be partial.
**Warning signs:** Users confused by both options appearing; or one option missing.

### Pitfall 5: Payment Sheet Pre-fill Amount Mismatch
**What goes wrong:** Payment sheet pre-fills £0 instead of the appointment total.
**Why it happens:** `appointment_services` data isn't passed to the payment sheet; or the sum is computed incorrectly.
**How to avoid:** The payment trigger (from appointment sheet) should pass `suggestedAmount` = sum of `appointment.appointment_services.service_price`. This data is already available in the `appointment-sheet.tsx` as `totalPrice`. Pass it as a prop to `PaymentSheet`.
**Warning signs:** Payment sheet always opens with empty/zero amount.

### Pitfall 6: Payments Not Showing on Client Timeline After Recording
**What goes wrong:** User records a payment, navigates to client page, timeline still empty.
**Why it happens:** `revalidatePath` in Server Action doesn't include the client's URL, or the client page doesn't fetch payments.
**How to avoid:** (1) Add `revalidatePath('/clients/' + clientId)` to `createPayment` Server Action. (2) Add payments query to `src/app/(app)/clients/[id]/page.tsx`. (3) Pass to `ClientDetailTabs`.
**Warning signs:** Client timeline shows appointments but no payments after Phase 4.

### Pitfall 7: Money Page Date Boundary for Europe/London Timezone
**What goes wrong:** Payments recorded at 23:00–00:00 UK time appear on the wrong day (BST edge case).
**Why it happens:** Day boundary computed as `T00:00:00Z` and `T23:59:59Z` in UTC; in BST (UTC+1) a payment at 23:30 UK time is stored as 22:30 UTC — which is "yesterday" in UTC.
**How to avoid:** For MVP, this is acceptable — the app stores `paid_at` as UTC, and filtering on UTC boundaries is consistent. Document that the Money page shows "payments recorded today in UTC". In BST, a late-evening payment may appear on the next day's tally. Flag this as a known limitation; proper fix would use Europe/London-aware day boundaries.
**Warning signs:** Late-evening payments disappearing from the expected day's money view in summer.

---

## Code Examples

Verified from codebase inspection:

### Payments Table Schema (already deployed)
```sql
-- From: supabase/migrations/20260301000000_initial_schema.sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,  -- nullable
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,  -- pennies, never float
  method TEXT NOT NULL CHECK (method IN ('cash', 'card')),
  payment_type TEXT NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('payment', 'refund', 'void')),
  reference_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,  -- self-ref for adjustments
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes already deployed:
-- idx_payments_owner_date ON payments (owner_user_id, paid_at)
-- idx_payments_appointment ON payments (appointment_id)
```

### Audit Log Table Schema (already deployed)
```sql
-- From: supabase/migrations/20260301000000_initial_schema.sql
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Note: SELECT + INSERT policies only — no UPDATE or DELETE. Append-only by design.
```

### parsePriceToPennies and formatPrice (already in utils.ts)
```typescript
// src/lib/utils.ts — already implemented
export function formatPrice(pennies: number): string {
  return `£${(pennies / 100).toFixed(2)}`
}

export function parsePriceToPennies(input: string): number {
  const value = parseFloat(input)
  if (isNaN(value)) return 0
  return Math.round(value * 100)
}
```

### Query: Payments for a Client Timeline
```typescript
// Add to src/app/(app)/clients/[id]/page.tsx
const { data: clientPayments } = await supabase
  .from('payments')
  .select(`
    id, amount, method, payment_type, reference_payment_id,
    paid_at, notes,
    appointments(starts_at)
  `)
  .eq('client_id', id)
  .eq('owner_user_id', user.id)
  .order('paid_at', { ascending: false })
```

### Query: Daily Payment Totals
```typescript
// In Money page Server Component
const totalCash = (payments ?? [])
  .filter(p => p.payment_type === 'payment' && p.method === 'cash')
  .reduce((sum, p) => sum + p.amount, 0)

const totalCard = (payments ?? [])
  .filter(p => p.payment_type === 'payment' && p.method === 'card')
  .reduce((sum, p) => sum + p.amount, 0)

const totalRefunds = (payments ?? [])
  .filter(p => p.payment_type === 'refund' || p.payment_type === 'void')
  .reduce((sum, p) => sum + p.amount, 0)

const grossTotal = totalCash + totalCard
const netTotal = grossTotal - totalRefunds
// Display: formatPrice(netTotal), formatPrice(totalCash), formatPrice(totalCard)
```

### useTransition Pattern for Payment Sheet (matches Phase 3 pattern)
```typescript
// src/components/payments/payment-sheet.tsx
'use client'
import { useState, useTransition } from 'react'
import { createPayment } from '@/lib/actions/payments'
import { parsePriceToPennies, formatPrice } from '@/lib/utils'

// Amount input as string, convert to pennies on submit
const [amountInput, setAmountInput] = useState(
  suggestedAmount ? (suggestedAmount / 100).toFixed(2) : ''
)
const [isPending, startTransition] = useTransition()

function handleSubmit() {
  const amountPennies = parsePriceToPennies(amountInput)
  if (amountPennies <= 0) {
    setError('Please enter a valid amount.')
    return
  }
  startTransition(async () => {
    const result = await createPayment({
      appointment_id: appointmentId,
      client_id: clientId,
      amount: amountPennies,
      method: selectedMethod,
    })
    if (result.error) { setError(result.error); return }
    onOpenChange(false)
    router.refresh()
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getSession()` server-side | `getUser()` | Security fix (ongoing) | Already enforced; must continue |
| Float currency storage | INTEGER pennies | Established in Phase 1 | All amount fields use integer pennies |
| Stripe integration for card | Log-only card payment | MVP decision | Card payments are logged without processing; no Stripe SDK needed |
| Separate adjustments table | Self-referencing payments table | Design decision Phase 1 | Single table; `reference_payment_id` links adjustment to original |
| Mutable payment records | Immutable + adjustment rows | Accounting best practice | Original payment rows never updated; refunds/voids are new rows |

**Deprecated/outdated:**
- Zod v4 API: Must stay on v3 — @hookform/resolvers TypeScript incompatibility still active as of March 2026 (STATE.md).
- `middleware.ts` default export: Renamed to `proxy.ts` in this project — do not revert.
- `zodResolver as any` cast: Required for all `useForm` calls with `zodResolver` — established decision in STATE.md.

---

## Open Questions

1. **Where does "Take Payment" appear in the UI flow?**
   - What we know: Appointments have a status. A 'completed' appointment is the natural trigger point. The appointment sheet already has status-action buttons.
   - What's unclear: Does the payment sheet open from the appointment sheet (staying in diary context), or does it redirect to a standalone payment page?
   - Recommendation: Add a "Take Payment" button to the appointment sheet view when `status === 'completed'` and no payment exists for that appointment. Open `PaymentSheet` as a secondary sheet. This avoids navigation and keeps context. (Claude's discretion on implementation.)

2. **Can an appointment have multiple payments (partial payments / deposits)?**
   - What we know: The schema allows multiple payments per appointment (no unique constraint on `appointment_id` in payments table). The requirements only say "log a payment against an appointment".
   - What's unclear: Whether partial payments are in scope for PAY-01/02.
   - Recommendation: For MVP, allow recording one payment per appointment from the appointment sheet. Multiple payments per appointment is architecturally supported but the UI does not need to encourage it. If a second "Take Payment" tap occurs on an already-paid appointment, show existing payments and allow a new one.

3. **Should the Money page have date navigation (like the diary)?**
   - What we know: The diary uses `?date=YYYY-MM-DD` URL param. The Money page could reuse this pattern.
   - What's unclear: Not specified in requirements. PAY-03 only requires timestamp on each record.
   - Recommendation: Add date navigation to Money page (same `?date` param pattern from diary). Default to today. This is Claude's discretion — it's valuable for a real stylist.

4. **void vs refund: should both options appear in the UI?**
   - What we know: Schema supports both. In practice, "void" = cancel a transaction (typically same-day); "refund" = return money after completion.
   - What's unclear: UK solo stylist UX preference.
   - Recommendation: Show both as separate options in the adjustment sheet with brief labels: "Refund" and "Void". Keep simple for MVP — amount field defaults to full original amount for void, editable for refund.

---

## Sources

### Primary (HIGH confidence)
- `/Users/jamesodwyer/solostylist/supabase/migrations/20260301000000_initial_schema.sql` — payments table (columns, constraints, indexes), audit_log table (append-only policies, no UPDATE/DELETE), RLS policies — all confirmed present
- `/Users/jamesodwyer/solostylist/package.json` — exact dependency versions; no new packages required for this phase
- `/Users/jamesodwyer/solostylist/src/lib/types/database.ts` — no Payment type yet (needs to be added); existing type patterns confirmed
- `/Users/jamesodwyer/solostylist/src/lib/utils.ts` — `parsePriceToPennies` and `formatPrice` confirmed present and correct
- `/Users/jamesodwyer/solostylist/src/lib/actions/appointments.ts` — Server Action pattern confirmed (getUser, zod safeParse, supabase insert, error handling, revalidatePath)
- `/Users/jamesodwyer/solostylist/src/components/diary/appointment-sheet.tsx` — Sheet + useTransition + multi-mode pattern confirmed; identifies where "Take Payment" trigger should be added
- `/Users/jamesodwyer/solostylist/.planning/STATE.md` — decisions: pennies, zod v3, getUser(), zodResolver as any, audit_log is Data-03 requirement
- `/Users/jamesodwyer/solostylist/.planning/PROJECT.md` — card payments log-only decision confirmed; no Stripe

### Secondary (MEDIUM confidence)
- PostgreSQL documentation: `payment_type IN ('payment', 'refund', 'void')` CHECK constraint; `reference_payment_id` self-reference design validated against standard immutable ledger accounting patterns
- Supabase JS docs: RLS enforcement via `auth.uid()` applies automatically; `.insert()` returns inserted row with `.select('id').single()`

### Tertiary (LOW confidence)
- None — all findings verified from project codebase and schema directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all confirmed from package.json
- Database schema: HIGH — full migration inspected; payments and audit_log tables confirmed with all required columns, constraints, RLS, and indexes
- Architecture patterns: HIGH — derived directly from Phase 2/3 established patterns; payments.ts mirrors appointments.ts structure
- UI patterns: HIGH — appointment-sheet.tsx pattern confirmed; PaymentSheet follows identical structure
- Pitfalls: HIGH for currency/arithmetic pitfalls; MEDIUM for timezone/BST edge cases

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable stack; same validity window as Phase 3 research)
