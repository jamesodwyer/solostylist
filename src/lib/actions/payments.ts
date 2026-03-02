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
  const { error: auditError } = await supabase.from('audit_log').insert({
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

  if (auditError) {
    // Log to console but do NOT fail the user action — payment already recorded
    console.error('Audit log insert failed:', auditError.message)
  }

  revalidatePath('/money')
  revalidatePath('/diary')
  if (parsed.data.client_id) {
    revalidatePath(`/clients/${parsed.data.client_id}`)
  }
  return { success: true, paymentId: payment.id }
}
