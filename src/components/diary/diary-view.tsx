'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Appointment, WorkingHours } from '@/lib/types/database'
import { formatDiaryDate } from '@/lib/utils'
import { DiaryGrid } from './diary-grid'

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

      {/* BookingSheet will be added in Plan 03-03 */}
      {/* selectedSlotTime={selectedSlotTime} — passed to BookingSheet */}

      {/* AppointmentSheet will be added in Plan 03-03 */}
      {/* selectedAppointment={selectedAppointment} — passed to AppointmentSheet */}
    </div>
  )
}
