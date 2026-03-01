'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  email: z.string().email().or(z.literal('')).optional().default(''),
  address: z.string().optional().default(''),
  marketing_consent: z.boolean().default(false),
})

export async function createClient(data: {
  first_name: string
  last_name?: string
  phone?: string
  email?: string
  address?: string
  marketing_consent?: boolean
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const parsed = clientSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      owner_user_id: user.id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      marketing_consent: parsed.data.marketing_consent,
    })
    .select('id, first_name, last_name, phone, email, address, marketing_consent, created_at, updated_at')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true, data: client }
}

export async function updateClient(
  id: string,
  data: Partial<{
    first_name: string
    last_name: string
    phone: string
    email: string
    address: string
    marketing_consent: boolean
  }>
) {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const partialSchema = clientSchema.partial()
  const parsed = partialSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Build update object, converting empty strings to null where appropriate
  const updateData: Record<string, unknown> = {}
  if (parsed.data.first_name !== undefined) updateData.first_name = parsed.data.first_name
  if (parsed.data.last_name !== undefined) updateData.last_name = parsed.data.last_name || null
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address || null
  if (parsed.data.marketing_consent !== undefined) updateData.marketing_consent = parsed.data.marketing_consent
  updateData.updated_at = new Date().toISOString()

  const { data: client, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .eq('owner_user_id', user.id)
    .select('id, first_name, last_name, phone, email, address, marketing_consent, created_at, updated_at')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true, data: client }
}
