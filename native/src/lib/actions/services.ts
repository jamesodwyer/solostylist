import { supabase } from '@/lib/supabase'
import type { Service, ServiceCategory } from '@/lib/types/database'

export interface ServiceWithCategory extends Service {
  service_categories?: ServiceCategory
}

// Plan 07-01 types — used by diary booking flow
export interface CreateServiceInput {
  name: string
  price: number              // integer pennies
  duration_minutes: number
  category_id?: string | null
  is_active?: boolean
}

export interface ServiceUpdateFields {
  name?: string
  price?: number             // integer pennies
  duration_minutes?: number
  category_id?: string | null
  is_active?: boolean
}

export async function getServices(): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(*)')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as ServiceWithCategory[]
}

/**
 * Fetch active services grouped by category name.
 * Services without a category are placed under "General".
 */
export async function getServicesByCategory(): Promise<Map<string, Service[]>> {
  const services = await getServices()
  const map = new Map<string, Service[]>()

  for (const service of services) {
    const categoryName = service.service_categories?.name ?? 'General'
    if (!map.has(categoryName)) {
      map.set(categoryName, [])
    }
    map.get(categoryName)!.push(service)
  }

  return map
}

export async function getService(id: string): Promise<ServiceWithCategory | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*, service_categories(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data as ServiceWithCategory
}

export async function getServiceCountActive(): Promise<number> {
  const { count, error } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) return 0
  return count ?? 0
}

export async function getOrCreateCategory(name: string): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Look for existing category with this name
  const { data: existing } = await supabase
    .from('service_categories')
    .select('id')
    .ilike('name', trimmed)
    .single()

  if (existing) return existing.id

  // Create new category
  const { data: maxSort } = await supabase
    .from('service_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxSort?.sort_order ?? 0) + 1

  const { data: created, error } = await supabase
    .from('service_categories')
    .insert({
      owner_user_id: user.id,
      name: trimmed,
      sort_order: nextOrder,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return created.id
}

interface CreateServiceData {
  name: string
  price: number // pennies
  duration_minutes: number
  category_id: string | null
  is_active: boolean
}

export async function createService(input: CreateServiceData): Promise<Service> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('services')
    .insert({
      owner_user_id: user.id,
      name: input.name.trim(),
      price: input.price,
      duration_minutes: input.duration_minutes,
      category_id: input.category_id,
      is_active: input.is_active,
      deposit_type: 'none',
      deposit_value: 0,
      deposit_required: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Service
}

interface UpdateServiceData {
  name?: string
  price?: number // pennies
  duration_minutes?: number
  category_id?: string | null
  is_active?: boolean
}

export async function updateService(id: string, updates: UpdateServiceData): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.price !== undefined) payload.price = updates.price
  if (updates.duration_minutes !== undefined) payload.duration_minutes = updates.duration_minutes
  if (updates.category_id !== undefined) payload.category_id = updates.category_id
  if (updates.is_active !== undefined) payload.is_active = updates.is_active

  const { error } = await supabase
    .from('services')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
