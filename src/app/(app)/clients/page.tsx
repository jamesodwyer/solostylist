import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientList } from '@/components/clients/client-list'
import { Client } from '@/lib/types/database'

export default async function ClientsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, owner_user_id, first_name, last_name, phone, email, address, marketing_consent, created_at, updated_at, client_tags(tag_id, tags(name))')
    .eq('owner_user_id', user.id)
    .order('first_name', { ascending: true })
    .limit(200)

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ClientList initialClients={(clients as unknown as Client[]) ?? []} />
    </div>
  )
}
