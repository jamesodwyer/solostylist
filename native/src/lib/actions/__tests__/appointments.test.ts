import { isWithinWorkingHours } from '../appointments'
import type { WorkingHours } from '@/lib/types/database'

const workingHours: WorkingHours = {
  mon: { enabled: true, start: '09:00', end: '17:00' },
  tue: { enabled: true, start: '09:00', end: '17:00' },
  wed: { enabled: true, start: '09:00', end: '17:00' },
  thu: { enabled: true, start: '09:00', end: '17:00' },
  fri: { enabled: true, start: '09:00', end: '17:00' },
  sat: { enabled: false, start: '09:00', end: '13:00' },
  sun: { enabled: false, start: '09:00', end: '13:00' },
}

describe('isWithinWorkingHours', () => {
  it('returns valid for appointment within enabled day hours', () => {
    // Monday 10:00-11:00 — within 09:00-17:00
    const result = isWithinWorkingHours(
      '2024-01-15T10:00:00', // Monday
      '2024-01-15T11:00:00',
      workingHours
    )
    expect(result.valid).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('returns invalid with reason for disabled day', () => {
    // Saturday is disabled
    const result = isWithinWorkingHours(
      '2024-01-20T10:00:00', // Saturday
      '2024-01-20T11:00:00',
      workingHours
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toBeTruthy()
    expect(result.reason).toContain('Sat')
  })

  it('returns invalid with reason for appointment starting before working hours', () => {
    // Monday 08:00-09:00 — before 09:00 start
    const result = isWithinWorkingHours(
      '2024-01-15T08:00:00', // Monday
      '2024-01-15T09:00:00',
      workingHours
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toBeTruthy()
    expect(result.reason).toContain('09:00')
  })

  it('returns invalid with reason for appointment ending after working hours', () => {
    // Monday 16:30-17:30 — ends after 17:00
    const result = isWithinWorkingHours(
      '2024-01-15T16:30:00', // Monday
      '2024-01-15T17:30:00',
      workingHours
    )
    expect(result.valid).toBe(false)
    expect(result.reason).toBeTruthy()
    expect(result.reason).toContain('17:00')
  })
})
