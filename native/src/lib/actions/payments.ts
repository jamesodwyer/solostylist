import { supabase } from '@/lib/supabase'
import type { Payment, PaymentMethod, PaymentType } from '@/lib/types/database'

export async function getDailyPayments(date: string): Promise<Payment[]> {
  // date is 'YYYY-MM-DD'
  const startOfDay = `${date}T00:00:00`
  const endOfDay = `${date}T23:59:59`

  const { data, error } = await supabase
    .from('payments')
    .select('*, clients(first_name, last_name), appointments(starts_at)')
    .gte('paid_at', startOfDay)
    .lte('paid_at', endOfDay)
    .order('paid_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Payment[]
}

export interface DailyTotals {
  cash: number   // pennies
  card: number   // pennies
  total: number  // pennies
  refunds: number // pennies (positive value)
  count: number
}

export function calculateDailyTotals(payments: Payment[]): DailyTotals {
  let cash = 0
  let card = 0
  let refunds = 0
  let count = 0

  for (const p of payments) {
    if (p.payment_type === 'refund' || p.payment_type === 'void') {
      refunds += Math.abs(p.amount)
    } else {
      if (p.method === 'cash') cash += p.amount
      if (p.method === 'card') card += p.amount
      count++
    }
  }

  return {
    cash,
    card,
    total: cash + card - refunds,
    refunds,
    count,
  }
}

interface RecordPaymentData {
  appointmentId?: string
  clientId: string
  amount: number // pennies
  method: PaymentMethod
  notes?: string
}

export async function recordPayment(input: RecordPaymentData): Promise<Payment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('payments')
    .insert({
      owner_user_id: user.id,
      appointment_id: input.appointmentId || null,
      client_id: input.clientId,
      amount: input.amount,
      method: input.method,
      payment_type: 'payment' as PaymentType,
      notes: input.notes?.trim() || null,
      paid_at: new Date().toISOString(),
    })
    .select('*, clients(first_name, last_name)')
    .single()

  if (error) throw new Error(error.message)
  return data as Payment
}

export async function recordRefund(paymentId: string, amount: number): Promise<Payment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get original payment for context
  const { data: original } = await supabase
    .from('payments')
    .select('client_id, method')
    .eq('id', paymentId)
    .single()

  if (!original) throw new Error('Original payment not found')

  const { data, error } = await supabase
    .from('payments')
    .insert({
      owner_user_id: user.id,
      client_id: original.client_id,
      amount: Math.abs(amount),
      method: original.method,
      payment_type: 'refund' as PaymentType,
      reference_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .select('*, clients(first_name, last_name)')
    .single()

  if (error) throw new Error(error.message)
  return data as Payment
}

export function formatPennies(pennies: number): string {
  const pounds = Math.abs(pennies) / 100
  const formatted = pounds.toFixed(2)
  return pennies < 0 ? `-£${formatted}` : `£${formatted}`
}
