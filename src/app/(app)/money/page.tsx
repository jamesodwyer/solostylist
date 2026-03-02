import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MoneyView } from '@/components/payments/money-view'
import { Payment } from '@/lib/types/database'

interface MoneyPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function MoneyPage({ searchParams }: MoneyPageProps) {
  const { date } = await searchParams
  const dateStr = date ?? new Date().toISOString().split('T')[0]

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dayStart = `${dateStr}T00:00:00.000Z`
  const dayEnd = `${dateStr}T23:59:59.999Z`

  const { data: rawPayments } = await supabase
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

  const payments = (rawPayments ?? []) as unknown as Payment[]

  // Compute daily totals in integer pennies (no floats)
  const totalCash = payments
    .filter((p) => p.payment_type === 'payment' && p.method === 'cash')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalCard = payments
    .filter((p) => p.payment_type === 'payment' && p.method === 'card')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalRefunds = payments
    .filter((p) => p.payment_type === 'refund' || p.payment_type === 'void')
    .reduce((sum, p) => sum + p.amount, 0)

  const grossTotal = totalCash + totalCard
  const netTotal = grossTotal - totalRefunds

  return (
    <MoneyView
      payments={payments}
      totalCash={totalCash}
      totalCard={totalCard}
      totalRefunds={totalRefunds}
      grossTotal={grossTotal}
      netTotal={netTotal}
      dateStr={dateStr}
    />
  )
}
