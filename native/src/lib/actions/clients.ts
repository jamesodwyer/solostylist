import { supabase } from '@/lib/supabase'
import type { Client } from '@/lib/types/database'

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, client_tags(tag_id, tags(*))')
    .order('first_name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Client[]
}

export async function searchClients(query: string): Promise<Client[]> {
  const q = query.trim()
  if (!q) return getClients()

  const { data, error } = await supabase
    .from('clients')
    .select('*, client_tags(tag_id, tags(*))')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    .order('first_name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Client[]
}

export async function getClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*, client_tags(tag_id, tags(*))')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Client
}

interface CreateClientData {
  firstName: string
  lastName?: string
  phone?: string
  email?: string
}

export async function createClient(input: CreateClientData): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('clients')
    .insert({
      owner_user_id: user.id,
      first_name: input.firstName.trim(),
      last_name: input.lastName?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Client
}

export async function updateClient(
  id: string,
  updates: Partial<Pick<Client, 'first_name' | 'last_name' | 'phone' | 'email'>>
) {
  const { error } = await supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
