import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClientDetailTabs } from '@/components/clients/detail/client-detail-tabs'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*, client_tags(*, tags(*))')
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .single()

  if (!client) {
    redirect('/clients')
  }

  const { data: notes } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const { data: colourFormulas } = await supabase
    .from('colour_formulas')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const { data: allTags } = await supabase
    .from('tags')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('name')

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <Link
          href="/clients"
          className="p-1 -ml-1 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {client.first_name}
          {client.last_name ? ` ${client.last_name}` : ''}
        </h1>
      </div>

      {/* Tabs */}
      <ClientDetailTabs
        client={client}
        notes={notes ?? []}
        colourFormulas={colourFormulas ?? []}
        allTags={allTags ?? []}
      />
    </div>
  )
}
