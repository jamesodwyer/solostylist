import { supabase } from '@/lib/supabase'
import type { WorkingHours, Profile } from '@/lib/types/database'

const PRESET_TAGS = ['Allergy', 'VIP', 'New client', 'Sensitive scalp', 'Regular']

interface OnboardingData {
  tradingName: string
  phone: string
  workingHours: WorkingHours
  defaultSlotMinutes: number
}

export async function completeOnboarding(data: OnboardingData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      trading_name: data.tradingName,
      phone: data.phone || null,
      working_hours: data.workingHours,
      default_slot_minutes: data.defaultSlotMinutes,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_user_id', user.id)

  if (profileError) throw new Error(profileError.message)

  // Create preset tags
  const tags = PRESET_TAGS.map((name) => ({
    owner_user_id: user.id,
    name,
  }))

  const { error: tagsError } = await supabase.from('tags').upsert(tags, {
    onConflict: 'owner_user_id,name',
    ignoreDuplicates: true,
  })
  if (tagsError) throw new Error(tagsError.message)
}

export async function getProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('owner_user_id', user.id)
    .single()

  if (error) return null
  return data as Profile
}

export async function updateProfile(updates: Partial<Pick<Profile, 'trading_name' | 'phone' | 'working_hours' | 'default_slot_minutes'>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_user_id', user.id)

  if (error) throw new Error(error.message)
}
