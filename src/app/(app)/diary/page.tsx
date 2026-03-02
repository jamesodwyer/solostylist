import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Appointment } from '@/lib/types/database'
import { DiaryView } from '@/components/diary/diary-view'

interface DiaryPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DiaryPage({ searchParams }: DiaryPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const dateStr = params.date ?? new Date().toISOString().split('T')[0]

  // Compute UTC day boundaries for the query
  // Note: Uses UTC boundaries — for Europe/London (UTC+0 winter, UTC+1 summer),
  // late-evening BST bookings could cross the UTC day boundary. Acceptable for MVP.
  const dayStart = `${dateStr}T00:00:00.000Z`
  const dayEnd = `${dateStr}T23:59:59.999Z`

  const [profileResult, appointmentsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('default_slot_minutes, working_hours, timezone')
      .eq('owner_user_id', user.id)
      .single(),
    supabase
      .from('appointments')
      .select(`
        id, owner_user_id, client_id, starts_at, ends_at, status, notes, created_at, updated_at,
        clients(first_name, last_name),
        appointment_services(id, owner_user_id, appointment_id, service_id, service_name, service_price, service_duration_minutes, created_at)
      `)
      .eq('owner_user_id', user.id)
      .gte('starts_at', dayStart)
      .lt('starts_at', dayEnd)
      .order('starts_at', { ascending: true })
  ])

  if (!profileResult.data) {
    redirect('/onboarding')
  }

  // Cast is required because Supabase infers joined rows as arrays, but clients is a
  // many-to-one join (single object) matching our Appointment type definition.
  const appointments = (appointmentsResult.data ?? []) as unknown as Appointment[]

  return (
    <DiaryView
      date={dateStr}
      profile={profileResult.data}
      appointments={appointments}
    />
  )
}
