import { supabase } from '@/lib/supabase'
import type { Appointment, AppointmentStatus, WorkingHours } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Input / Result types
// ---------------------------------------------------------------------------

export interface CreateAppointmentInput {
  client_id: string
  starts_at: string   // ISO 8601 TIMESTAMPTZ
  ends_at: string     // ISO 8601 TIMESTAMPTZ
  notes?: string
  override_working_hours?: boolean
  services: Array<{
    service_id: string
    service_name: string
    service_price: number          // integer pennies
    service_duration_minutes: number
  }>
}

export interface CreateAppointmentResult {
  success?: boolean
  appointmentId?: string
  error?: string | null
  warning?: string
}

export interface RescheduleInput {
  appointment_id: string
  new_starts_at: string  // ISO 8601 TIMESTAMPTZ
  new_ends_at: string    // ISO 8601 TIMESTAMPTZ
  override_working_hours?: boolean
}

// ---------------------------------------------------------------------------
// Pure helper — exported for UI pre-validation and tests
// ---------------------------------------------------------------------------

/**
 * Check whether a proposed appointment falls within the stylist's working hours.
 * Uses local timezone hours/minutes (same as web).
 */
export function isWithinWorkingHours(
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

// ---------------------------------------------------------------------------
// Supabase actions
// ---------------------------------------------------------------------------

/**
 * Fetch appointments in [startDate, endDate) range (date strings "YYYY-MM-DD").
 * Joins clients and appointment_services, ordered by starts_at.
 */
export async function getAppointmentsForRange(
  startDate: string,
  endDate: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, clients(first_name, last_name), appointment_services(*)')
    .gte('starts_at', `${startDate}T00:00:00`)
    .lt('starts_at', `${endDate}T00:00:00`)
    .order('starts_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Appointment[]
}

/**
 * Fetch appointments for a full calendar month.
 * Pads a few days before/after for calendar display edge cases.
 */
export async function getAppointmentsForMonth(
  year: number,
  month: number  // 1-based (1 = January)
): Promise<Appointment[]> {
  // Pad: start a week before the 1st, end a week after last day
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  const padStart = new Date(firstDay)
  padStart.setDate(padStart.getDate() - 7)
  const padEnd = new Date(lastDay)
  padEnd.setDate(padEnd.getDate() + 8)

  const startDate = padStart.toISOString().slice(0, 10)
  const endDate = padEnd.toISOString().slice(0, 10)

  return getAppointmentsForRange(startDate, endDate)
}

/**
 * Create a new appointment with service snapshots.
 * Handles 23P01 double-booking error and rolls back on partial failure.
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<CreateAppointmentResult> {
  // Runtime validation
  if (!input.client_id) return { error: 'client_id is required' }
  if (!input.starts_at || !input.ends_at) return { error: 'starts_at and ends_at are required' }
  if (!input.services || input.services.length === 0) return { error: 'At least one service is required' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch working hours for validation
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('working_hours')
    .eq('owner_user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not load your profile. Please try again.' }
  }

  // Validate working hours (soft warning with override)
  if (!input.override_working_hours) {
    const hoursCheck = isWithinWorkingHours(
      input.starts_at,
      input.ends_at,
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
      client_id: input.client_id,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      notes: input.notes || null,
      status: 'booked',
    })
    .select('id')
    .single()

  if (apptError) {
    if (apptError.code === '23P01') {
      return { error: 'This time slot overlaps an existing appointment.' }
    }
    return { error: apptError.message }
  }

  // Insert appointment_services (snapshot values)
  const { error: servicesError } = await supabase
    .from('appointment_services')
    .insert(
      input.services.map(s => ({
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

  return { success: true, appointmentId: appt.id }
}

/**
 * Update an appointment's status.
 * Writes an audit log entry for cancellation and no-show actions.
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<{ success?: boolean; error?: string }> {
  if (!appointmentId) return { error: 'appointmentId is required' }

  const validStatuses: AppointmentStatus[] = ['booked', 'completed', 'cancelled', 'no_show']
  if (!validStatuses.includes(status)) return { error: 'Invalid status' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('owner_user_id', user.id)

  if (error) return { error: error.message }

  // Audit log for cancellation/no-show (non-blocking)
  if (status === 'cancelled' || status === 'no_show') {
    const { error: auditError } = await supabase.from('audit_log').insert({
      owner_user_id: user.id,
      action: `appointment_${status}`,
      entity_type: 'appointment',
      entity_id: appointmentId,
      details: { status },
    })
    if (auditError) {
      console.error('Audit log insert failed:', auditError.message)
    }
  }

  return { success: true }
}

/**
 * Reschedule an appointment to a new time range.
 * Validates working hours and handles double-booking errors.
 */
export async function rescheduleAppointment(
  input: RescheduleInput
): Promise<{ success?: boolean; error?: string | null; warning?: string }> {
  if (!input.appointment_id || !input.new_starts_at || !input.new_ends_at) {
    return { error: 'appointment_id, new_starts_at, and new_ends_at are required' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Fetch working hours for validation
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('working_hours')
    .eq('owner_user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not load your profile. Please try again.' }
  }

  // Validate working hours (soft warning with override)
  if (!input.override_working_hours) {
    const hoursCheck = isWithinWorkingHours(
      input.new_starts_at,
      input.new_ends_at,
      profile.working_hours as WorkingHours
    )
    if (!hoursCheck.valid) {
      return { error: null, warning: hoursCheck.reason }
    }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      starts_at: input.new_starts_at,
      ends_at: input.new_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.appointment_id)
    .eq('owner_user_id', user.id)

  if (error) {
    if (error.code === '23P01') {
      return { error: 'The new time overlaps an existing appointment.' }
    }
    return { error: error.message }
  }

  return { success: true }
}
