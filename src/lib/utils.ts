import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format integer pennies to £ string. E.g. 1500 → "£15.00" */
export function formatPrice(pennies: number): string {
  return `£${(pennies / 100).toFixed(2)}`
}

/** Parse a decimal string to integer pennies. E.g. "15.00" → 1500 */
export function parsePriceToPennies(input: string): number {
  const value = parseFloat(input)
  if (isNaN(value)) return 0
  return Math.round(value * 100)
}

/** Format ISO timestamp to "HH:MM" in Europe/London timezone. E.g. "09:30" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

/** Format 'YYYY-MM-DD' to "Monday 2 March" in Europe/London timezone */
export function formatDiaryDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  })
}

/** Format minutes to human-readable duration. E.g. 90 → "1h 30m", 30 → "30m" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
