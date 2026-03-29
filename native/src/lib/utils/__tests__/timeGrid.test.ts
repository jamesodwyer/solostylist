import {
  parseHHMM,
  generateSlots,
  appointmentBlockLayout,
  currentTimeTop,
  autoScrollTarget,
  SLOT_HEIGHT_DP,
} from '../timeGrid'
import type { Appointment } from '@/lib/types/database'

describe('parseHHMM', () => {
  it('parses 09:00 to 540', () => {
    expect(parseHHMM('09:00')).toBe(540)
  })

  it('parses 17:30 to 1050', () => {
    expect(parseHHMM('17:30')).toBe(1050)
  })

  it('parses 00:00 to 0', () => {
    expect(parseHHMM('00:00')).toBe(0)
  })
})

describe('generateSlots', () => {
  it('generates 32 slots from 06:00 to 22:00 with 30-min slots', () => {
    const slots = generateSlots('06:00', '22:00', 30)
    expect(slots).toHaveLength(32)
    expect(slots[0]).toBe('06:00')
    expect(slots[slots.length - 1]).toBe('21:30')
  })

  it('generates correct 15-min slots from 09:00 to 10:00', () => {
    const slots = generateSlots('09:00', '10:00', 15)
    expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45'])
  })
})

describe('appointmentBlockLayout', () => {
  const makeAppointment = (startsAt: string, endsAt: string): Appointment => ({
    id: 'test-id',
    owner_user_id: 'user-id',
    client_id: 'client-id',
    starts_at: startsAt,
    ends_at: endsAt,
    status: 'booked',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  })

  it('computes correct top and height for 60-min appointment at 10:00 with 06:00 grid start, 30-min slots', () => {
    // gridStart: 06:00 = 360 min, appointmentStart: 10:00 = 600 min
    // slotsFromTop = (600 - 360) / 30 = 8 slots
    // top = 8 * SLOT_HEIGHT_DP = 8 * 60 = 480
    // duration = 60 min, height = (60/30) * 60 = 2 * 60 = 120
    const appt = makeAppointment('2024-01-15T10:00:00', '2024-01-15T11:00:00')
    const layout = appointmentBlockLayout(appt, 360, 30)
    expect(layout.top).toBe(480)
    expect(layout.height).toBe(120)
  })

  it('returns minimum height of 28dp for a 15-min appointment', () => {
    // duration = 15 min, height = (15/30) * 60 = 30 — above minimum, just verify >= 28
    const appt = makeAppointment('2024-01-15T10:00:00', '2024-01-15T10:15:00')
    const layout = appointmentBlockLayout(appt, 360, 30)
    expect(layout.height).toBeGreaterThanOrEqual(28)
  })

  it('enforces minimum height of 28dp even for very short appointments', () => {
    // duration = 5 min, height = (5/30) * 60 = 10 — below minimum
    const appt = makeAppointment('2024-01-15T10:00:00', '2024-01-15T10:05:00')
    const layout = appointmentBlockLayout(appt, 360, 30)
    expect(layout.height).toBe(28)
  })
})

describe('currentTimeTop', () => {
  it('computes Y position for current time', () => {
    // nowMinutes=600, gridStartMinutes=360, slotMinutes=30
    // slots = (600-360)/30 = 8
    // top = 8 * SLOT_HEIGHT_DP = 8 * 60 = 480
    expect(currentTimeTop(600, 360, 30)).toBe(480)
  })
})

describe('autoScrollTarget', () => {
  it('returns current time minutes when isToday=true', () => {
    expect(autoScrollTarget(true, 600, 540)).toBe(600)
  })

  it('returns work start minutes when isToday=false', () => {
    expect(autoScrollTarget(false, 600, 540)).toBe(540)
  })
})

describe('SLOT_HEIGHT_DP', () => {
  it('is 60', () => {
    expect(SLOT_HEIGHT_DP).toBe(60)
  })
})
