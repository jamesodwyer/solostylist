import type { Appointment } from '@/lib/types/database'

/** Height in dp for a single time slot in the grid */
export const SLOT_HEIGHT_DP = 60

/** Width in dp for the time label gutter on the left */
export const TIME_GUTTER_DP = 56

/**
 * Parse "HH:MM" string to total minutes since midnight.
 * e.g. "09:00" → 540, "17:30" → 1050, "00:00" → 0
 */
export function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Generate an array of "HH:MM" slot labels from startHHMM (inclusive) to endHHMM (exclusive).
 * e.g. generateSlots("09:00", "10:00", 15) → ["09:00", "09:15", "09:30", "09:45"]
 */
export function generateSlots(
  startHHMM: string,
  endHHMM: string,
  slotMinutes: number
): string[] {
  const start = parseHHMM(startHHMM)
  const end = parseHHMM(endHHMM)
  const slots: string[] = []

  for (let m = start; m < end; m += slotMinutes) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }

  return slots
}

/**
 * Compute the absolute top and height (dp) for an appointment block in the grid.
 * Uses local timezone hours/minutes (matches web Europe/London assumption).
 *
 * Minimum height is 28dp.
 */
export function appointmentBlockLayout(
  appointment: Appointment,
  gridStartMinutes: number,
  slotMinutes: number
): { top: number; height: number } {
  const start = new Date(appointment.starts_at)
  const end = new Date(appointment.ends_at)

  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const durationMinutes = (end.getTime() - start.getTime()) / 60000

  const top = ((startMinutes - gridStartMinutes) / slotMinutes) * SLOT_HEIGHT_DP
  const height = Math.max((durationMinutes / slotMinutes) * SLOT_HEIGHT_DP, 28)

  return { top, height }
}

/**
 * Compute the Y position (dp) of the current-time red line in the grid.
 * currentTimeTop(600, 360, 30) → (600-360)/30 * 60 = 480
 */
export function currentTimeTop(
  nowMinutes: number,
  gridStartMinutes: number,
  slotMinutes: number
): number {
  return ((nowMinutes - gridStartMinutes) / slotMinutes) * SLOT_HEIGHT_DP
}

/**
 * Compute the scroll target (in minutes from midnight) for the diary grid.
 * - For today: scroll to current time so the current moment is visible.
 * - For other days: scroll to working hours start.
 */
export function autoScrollTarget(
  isToday: boolean,
  nowMinutes: number,
  workStartMinutes: number
): number {
  return isToday ? nowMinutes : workStartMinutes
}
