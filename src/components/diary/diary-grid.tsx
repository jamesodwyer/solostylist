'use client'

import { useEffect, useRef } from 'react'
import { Appointment, WorkingHours } from '@/lib/types/database'
import { AppointmentBlock } from './appointment-block'

interface DiaryGridProps {
  date: string
  isToday: boolean
  slotMinutes: number
  workingHours: WorkingHours
  appointments: Appointment[]
  onSlotTap: (slotTime: string) => void
  onAppointmentTap: (appointment: Appointment) => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

const SLOT_HEIGHT_PX = 60
const TIME_GUTTER_WIDTH = 56

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function addMinutes(hhmm: string, minutes: number): string {
  const total = parseHHMM(hhmm) + minutes
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function clampHHMM(hhmm: string, min: string, max: string): string {
  const val = parseHHMM(hhmm)
  const minVal = parseHHMM(min)
  const maxVal = parseHHMM(max)
  const clamped = Math.min(Math.max(val, minVal), maxVal)
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function generateSlots(startHHMM: string, endHHMM: string, slotMinutes: number): string[] {
  const startTotal = parseHHMM(startHHMM)
  const endTotal = parseHHMM(endHHMM)
  const slots: string[] = []
  for (let m = startTotal; m < endTotal; m += slotMinutes) {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    slots.push(`${h}:${min}`)
  }
  return slots
}

export function DiaryGrid({
  date,
  isToday,
  slotMinutes,
  workingHours,
  appointments,
  onSlotTap,
  onAppointmentTap,
  scrollContainerRef,
}: DiaryGridProps) {
  const currentTimeRef = useRef<HTMLDivElement>(null)

  // Determine the day of week and its schedule
  const dayOfWeek = new Date(date + 'T12:00:00Z').getDay()
  const dayKey = DAY_KEYS[dayOfWeek]
  const daySchedule = workingHours[dayKey]

  const isDayOff = !daySchedule.enabled

  // Compute grid range with padding and clamping
  let gridStart: string
  let gridEnd: string

  if (isDayOff) {
    gridStart = '08:00'
    gridEnd = '18:00'
  } else {
    const paddedStart = addMinutes(daySchedule.start, -30)
    const paddedEnd = addMinutes(daySchedule.end, 30)
    gridStart = clampHHMM(paddedStart, '06:00', '22:00')
    gridEnd = clampHHMM(paddedEnd, '06:00', '22:00')
  }

  const startMinutes = parseHHMM(gridStart)
  const slots = generateSlots(gridStart, gridEnd, slotMinutes)

  // Scroll effect: scroll to current time for today, or working hours start for other days
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let targetMinutes: number
    if (isToday) {
      const now = new Date()
      targetMinutes = now.getHours() * 60 + now.getMinutes()
    } else {
      targetMinutes = isDayOff ? parseHHMM('08:00') : parseHHMM(daySchedule.start)
    }

    const targetPx = ((targetMinutes - startMinutes) / slotMinutes) * SLOT_HEIGHT_PX
    container.scrollTop = Math.max(0, targetPx - 100)
  }, [date, isToday, startMinutes, slotMinutes, isDayOff, daySchedule.start, scrollContainerRef])

  // Compute current time indicator position
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTopPx = ((nowMinutes - startMinutes) / slotMinutes) * SLOT_HEIGHT_PX

  return (
    <div>
      {/* Day-off banner */}
      {isDayOff && (
        <div className="mx-4 mt-3 mb-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-500">You&apos;re not scheduled today</p>
        </div>
      )}

      {/* Grid */}
      <div
        className="relative"
        style={{ height: slots.length * SLOT_HEIGHT_PX }}
      >
        {/* Time labels and slot rows */}
        {slots.map((slotTime, i) => {
          const isHourBoundary = slotTime.endsWith(':00')
          return (
            <div
              key={slotTime}
              className="absolute w-full flex"
              style={{ top: i * SLOT_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
              onClick={() => onSlotTap(slotTime)}
            >
              {/* Time label — only show on hour boundaries */}
              <div className="w-14 shrink-0 text-right pr-2 pt-0.5">
                {isHourBoundary && (
                  <span className="text-xs text-gray-400">{slotTime}</span>
                )}
              </div>
              {/* Slot area */}
              <div
                className={`flex-1 border-t ${isHourBoundary ? 'border-gray-200' : 'border-gray-100'}`}
              />
            </div>
          )
        })}

        {/* Appointment blocks — absolutely positioned */}
        {appointments.map((appointment) => (
          <AppointmentBlock
            key={appointment.id}
            appointment={appointment}
            dayStartMinutes={startMinutes}
            slotMinutes={slotMinutes}
            slotHeightPx={SLOT_HEIGHT_PX}
            gutterWidth={TIME_GUTTER_WIDTH}
            onClick={() => onAppointmentTap(appointment)}
          />
        ))}

        {/* Current time indicator (red line) — only on today */}
        {isToday && (
          <div
            ref={currentTimeRef}
            className="absolute left-14 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ top: nowTopPx }}
          >
            <div className="absolute -left-1.5 -top-1 w-3 h-3 rounded-full bg-red-500" />
          </div>
        )}
      </div>
    </div>
  )
}
