'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Appointment, WorkingHours } from '@/lib/types/database'
import { formatDiaryDate } from '@/lib/utils'
import { DiaryGrid } from './diary-grid'
import { BookingSheet } from './booking-sheet'
import { AppointmentSheet } from './appointment-sheet'

interface DiaryViewProps {
  date: string  // 'YYYY-MM-DD'
  profile: {
    default_slot_minutes: number
    working_hours: WorkingHours
    timezone: string
  }
  appointments: Appointment[]
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

/** Compute the next slot time from now, rounded up to the nearest slotMinutes boundary */
function nextSlotTime(slotMinutes: number): string {
  const now = new Date()
  const totalMinutes = now.getHours() * 60 + now.getMinutes()
  const remainder = totalMinutes % slotMinutes
  const rounded = remainder === 0 ? totalMinutes : totalMinutes + (slotMinutes - remainder)
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function DiaryView({ date, profile, appointments }: DiaryViewProps) {
  const router = useRouter()
  const dateInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const prevDate = addDays(date, -1)
  const nextDate = addDays(date, 1)

  function handleDatePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      router.push(`/diary?date=${e.target.value}`)
    }
  }

  function handleDateLabelClick() {
    dateInputRef.current?.showPicker()
  }

  function handleFabPress() {
    setSelectedSlotTime(nextSlotTime(profile.default_slot_minutes))
  }

  return (
    <div className="flex flex-col h-[100dvh]" style={{ height: '100dvh' }}>
      {/* Date navigation header */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        {/* Previous day button */}
        <button
          onClick={() => router.push(`/diary?date=${prevDate}`)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-black active:text-black"
          aria-label="Previous day"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Date label — tappable to open native date picker */}
        <div className="relative flex flex-col items-center">
          <button
            onClick={handleDateLabelClick}
            className="flex flex-col items-center gap-0.5"
          >
            <span className={`text-sm font-semibold ${isToday ? 'text-black' : 'text-gray-800'}`}>
              {formatDiaryDate(date)}
            </span>
            {isToday && (
              <span className="text-xs font-medium text-blue-600">Today</span>
            )}
          </button>
          {/* Visually hidden native date input */}
          <input
            ref={dateInputRef}
            type="date"
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            value={date}
            onChange={handleDatePickerChange}
          />
        </div>

        {/* Right side: today pill (if not today) + next button */}
        <div className="flex items-center gap-1">
          {!isToday && (
            <button
              onClick={() => router.push('/diary')}
              className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full"
            >
              Today
            </button>
          )}
          <button
            onClick={() => router.push(`/diary?date=${nextDate}`)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-black active:text-black"
            aria-label="Next day"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Scrollable grid container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-20"
      >
        <DiaryGrid
          date={date}
          isToday={isToday}
          slotMinutes={profile.default_slot_minutes}
          workingHours={profile.working_hours}
          appointments={appointments}
          onSlotTap={(slotTime) => setSelectedSlotTime(slotTime)}
          onAppointmentTap={(appt) => setSelectedAppointment(appt)}
          scrollContainerRef={scrollContainerRef}
        />
      </div>

      {/* Floating + button — opens booking sheet at next available slot */}
      <button
        onClick={handleFabPress}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-black text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="New appointment"
      >
        <Plus size={24} />
      </button>

      {/* Booking sheet — opened when a slot is tapped or FAB pressed */}
      <BookingSheet
        open={selectedSlotTime !== null}
        onOpenChange={(open) => { if (!open) setSelectedSlotTime(null) }}
        date={date}
        slotTime={selectedSlotTime}
      />

      {/* Appointment detail sheet — opened when an appointment block is tapped */}
      <AppointmentSheet
        open={selectedAppointment !== null}
        onOpenChange={(open) => { if (!open) setSelectedAppointment(null) }}
        appointment={selectedAppointment}
        date={date}
      />
    </div>
  )
}
