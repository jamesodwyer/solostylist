'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { WorkingHours } from '@/lib/types/database'

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string(),
  end: z.string(),
})

const workingHoursSchema = z.object({
  mon: dayScheduleSchema,
  tue: dayScheduleSchema,
  wed: dayScheduleSchema,
  thu: dayScheduleSchema,
  fri: dayScheduleSchema,
  sat: dayScheduleSchema,
  sun: dayScheduleSchema,
})

const onboardingSchema = z.object({
  trading_name: z.string().min(1, 'Trading name is required'),
  phone: z.string().optional().default(''),
  working_hours: workingHoursSchema,
  default_slot_minutes: z.number().int().refine(
    (v) => [15, 30, 45, 60].includes(v),
    { message: 'Slot size must be 15, 30, 45, or 60' }
  ),
})

const PRESET_TAGS = ['Allergy', 'VIP', 'New client', 'Sensitive scalp', 'Regular']

export async function completeOnboarding(data: z.infer<typeof onboardingSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = onboardingSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { trading_name, phone, working_hours, default_slot_minutes } = parsed.data

  const { error } = await supabase
    .from('profiles')
    .update({
      trading_name,
      phone,
      working_hours: working_hours as WorkingHours,
      default_slot_minutes,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  // Seed preset tags (idempotent upsert)
  await supabase.from('tags').upsert(
    PRESET_TAGS.map(name => ({ owner_user_id: user.id, name })),
    { onConflict: 'owner_user_id,name', ignoreDuplicates: true }
  )

  revalidatePath('/')
  redirect('/diary')
}

export async function updateProfile(data: Partial<z.infer<typeof onboardingSchema>>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (data.trading_name !== undefined) updateData.trading_name = data.trading_name
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.working_hours !== undefined) updateData.working_hours = data.working_hours
  if (data.default_slot_minutes !== undefined) updateData.default_slot_minutes = data.default_slot_minutes

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/settings')
}
