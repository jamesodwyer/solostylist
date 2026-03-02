'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { WorkingHours } from '@/lib/types/database'

const createAppointmentSchema = z.object({
  client_id: z.string().uuid(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().optional().default(''),
  override_working_hours: z.boolean().default(false),
  services: z.array(
    z.object({
      service_id: z.string().uuid(),
      service_name: z.string(),
      service_price: z.number().int(),
      service_duration_minutes: z.number().int(),
    })
  ).min(1, 'At least one service is required'),
})

const rescheduleSchema = z.object({
  appointment_id: z.string().uuid(),
  new_starts_at: z.string().datetime(),
  new_ends_at: z.string().datetime(),
  override_working_hours: z.boolean().default(false),
})

const updateStatusSchema = z.object({
  appointment_id: z.string().uuid(),
  status: z.enum(['booked', 'completed', 'cancelled', 'no_show']),
})

function isWithinWorkingHours(
  startsAt: string,
  endsAt: string,
  workingHours: WorkingHours
): { valid: boolean; reason?: string } {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const dayKey = dayKeys[start.getDay()]
  const daySchedule = workingHours[dayKey]

  if (!daySchedule.enabled) {
    return {
      valid: false,
      reason: `You're not scheduled to work on ${dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}s.`,
    }
  }

  const [startH, startM] = daySchedule.start.split(':').map(Number)
  const [endH, endM] = daySchedule.end.split(':').map(Number)
  const apptStartMinutes = start.getHours() * 60 + start.getMinutes()
  const apptEndMinutes = end.getHours() * 60 + end.getMinutes()
  const schedStartMinutes = startH * 60 + startM
  const schedEndMinutes = endH * 60 + endM

  if (apptStartMinutes < schedStartMinutes || apptEndMinutes > schedEndMinutes) {
    return {
      valid: false,
      reason: `This appointment is outside your working hours (${daySchedule.start}–${daySchedule.end}).`,
    }
  }

  return { valid: true }
}

export async function createAppointment(data: z.infer<typeof createAppointmentSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = createAppointmentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.flatten().formErrors.join(', ') || 'Invalid appointment data' }
  }

  // Fetch profile to get working_hours
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('working_hours')
    .eq('owner_user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not load your profile. Please try again.' }
  }

  // Validate working hours (soft warning with override)
  if (!parsed.data.override_working_hours) {
    const hoursCheck = isWithinWorkingHours(
      parsed.data.starts_at,
      parsed.data.ends_at,
      profile.working_hours as WorkingHours
    )
    if (!hoursCheck.valid) {
      return { error: null, warning: hoursCheck.reason }
    }
  }

  // Insert appointment
  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .insert({
      owner_user_id: user.id,
      client_id: parsed.data.client_id,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      notes: parsed.data.notes || null,
      status: 'booked',
    })
    .select('id')
    .single()

  if (apptError) {
    if (apptError.code === '23P01') {
      return { error: 'This time slot overlaps an existing appointment. Please choose a different time.' }
    }
    return { error: apptError.message }
  }

  // Insert appointment_services (snapshot values)
  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(
      parsed.data.services.map(s => ({
        owner_user_id: user.id,
        appointment_id: appt.id,
        service_id: s.service_id,
        service_name: s.service_name,
        service_price: s.service_price,
        service_duration_minutes: s.service_duration_minutes,
      }))
    )

  if (servicesError) {
    // Rollback: delete the orphaned appointment row
    await supabase
      .from('appointments')
      .delete()
      .eq('id', appt.id)
      .eq('owner_user_id', user.id)
    return { error: servicesError.message }
  }

  revalidatePath('/diary')
  return { success: true, appointmentId: appt.id }
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'booked' | 'completed' | 'cancelled' | 'no_show'
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = updateStatusSchema.safeParse({ appointment_id: appointmentId, status })
  if (!parsed.success) {
    return { error: 'Invalid appointment ID or status' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.appointment_id)
    .eq('owner_user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/diary')
  return { success: true }
}

export async function rescheduleAppointment(data: z.infer<typeof rescheduleSchema>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const parsed = rescheduleSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Invalid reschedule data' }
  }

  // Fetch profile to get working_hours
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('working_hours')
    .eq('owner_user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not load your profile. Please try again.' }
  }

  // Validate working hours (soft warning with override)
  if (!parsed.data.override_working_hours) {
    const hoursCheck = isWithinWorkingHours(
      parsed.data.new_starts_at,
      parsed.data.new_ends_at,
      profile.working_hours as WorkingHours
    )
    if (!hoursCheck.valid) {
      return { error: null, warning: hoursCheck.reason }
    }
  }

  // Update appointment times (only reschedule booked appointments)
  const { error } = await supabase
    .from('appointments')
    .update({
      starts_at: parsed.data.new_starts_at,
      ends_at: parsed.data.new_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.appointment_id)
    .eq('owner_user_id', user.id)
    .eq('status', 'booked')

  if (error) {
    if (error.code === '23P01') {
      return { error: 'The new time overlaps an existing appointment.' }
    }
    return { error: error.message }
  }

  revalidatePath('/diary')
  return { success: true }
}
