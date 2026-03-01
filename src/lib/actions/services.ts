'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  duration_minutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  price: z.number().int().min(0, 'Price must be 0 or more'),
  category_id: z.string().uuid().nullable().optional(),
  deposit_type: z.enum(['none', 'fixed', 'percentage']),
  deposit_value: z.number().int().min(0).default(0),
  deposit_required: z.boolean().default(false),
})

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
})

export type ServiceInput = z.infer<typeof serviceSchema>

export async function createService(data: ServiceInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('services')
    .insert({
      ...parsed.data,
      owner_user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/settings/services')
  return { success: true }
}

export async function updateService(id: string, data: ServiceInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = serviceSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('services')
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_user_id', user.id)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/settings/services')
  return { success: true }
}

export async function toggleServiceActive(id: string, currentlyActive: boolean) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('services')
    .update({
      is_active: !currentlyActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings/services')
  return { success: true }
}

export async function createCategory(data: { name: string }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = categorySchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { data: category, error } = await supabase
    .from('service_categories')
    .insert({
      owner_user_id: user.id,
      name: parsed.data.name,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/settings/services')
  return { data: category }
}
