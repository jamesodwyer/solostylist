'use client'

import { useState } from 'react'
import type { WorkingHours, DaySchedule } from '@/lib/types/database'

// Generate time options from 06:00 to 22:00 in 30-min increments
function generateTimeOptions(): string[] {
  const options: string[] = []
  for (let hour = 6; hour <= 22; hour++) {
    options.push(`${String(hour).padStart(2, '0')}:00`)
    if (hour < 22) {
      options.push(`${String(hour).padStart(2, '0')}:30`)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

const DAY_LABELS: Record<keyof WorkingHours, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const DAY_KEYS: Array<keyof WorkingHours> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

interface StepWorkingHoursProps {
  initialHours: WorkingHours
  onNext: (hours: WorkingHours) => void
  onBack: () => void
}

export function StepWorkingHours({ initialHours, onNext, onBack }: StepWorkingHoursProps) {
  const [hours, setHours] = useState<WorkingHours>(initialHours)

  function updateDay(day: keyof WorkingHours, updates: Partial<DaySchedule>) {
    setHours(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight mb-2">
          Set your working hours
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          You can change these anytime in Settings
        </p>
      </div>

      <div className="flex flex-col gap-1">
        {DAY_KEYS.map((day) => {
          const schedule = hours[day]
          return (
            <div
              key={day}
              className={`flex flex-col gap-2 py-3 border-b border-gray-100 last:border-b-0 ${
                !schedule.enabled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black">{DAY_LABELS[day]}</span>
                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={schedule.enabled}
                  onClick={() => updateDay(day, { enabled: !schedule.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors min-h-[44px] min-w-[44px] justify-center focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2`}
                >
                  <span
                    className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      schedule.enabled ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        schedule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </div>

              {schedule.enabled && (
                <div className="flex items-center gap-2">
                  <select
                    value={schedule.start}
                    onChange={(e) => updateDay(day, { start: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[44px]"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-sm font-medium">to</span>
                  <select
                    value={schedule.end}
                    onChange={(e) => updateDay(day, { end: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-black text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-h-[44px]"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {!schedule.enabled && (
                <p className="text-xs text-gray-400">Day off</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 px-6 rounded-xl border border-gray-200 bg-white text-black text-base font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px] flex items-center justify-center"
        >
          Back
        </button>
        <button
          onClick={() => onNext(hours)}
          className="flex-1 py-4 px-6 rounded-xl bg-black text-white text-base font-bold hover:bg-black/90 active:bg-black/80 transition-colors min-h-[56px] flex items-center justify-center"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
