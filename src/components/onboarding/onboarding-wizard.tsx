'use client'

import { useState, useTransition } from 'react'
import { completeOnboarding } from '@/lib/actions/profile'
import type { WorkingHours } from '@/lib/types/database'
import { StepTradingName } from './step-trading-name'
import { StepWorkingHours } from './step-working-hours'
import { StepSlotSize } from './step-slot-size'

const STEPS = ['trading-name', 'working-hours', 'slot-size'] as const

const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: { enabled: false, start: '09:00', end: '17:00' },
  tue: { enabled: true,  start: '09:00', end: '17:00' },
  wed: { enabled: true,  start: '09:00', end: '17:00' },
  thu: { enabled: true,  start: '09:00', end: '17:00' },
  fri: { enabled: true,  start: '09:00', end: '17:00' },
  sat: { enabled: true,  start: '09:00', end: '17:00' },
  sun: { enabled: false, start: '09:00', end: '17:00' },
}

interface FormData {
  trading_name: string
  phone: string
  working_hours: WorkingHours
  default_slot_minutes: number
}

export function OnboardingWizard() {
  const [stepIndex, setStepIndex] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    trading_name: '',
    phone: '',
    working_hours: DEFAULT_WORKING_HOURS,
    default_slot_minutes: 15,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const progress = ((stepIndex + 1) / STEPS.length) * 100

  function handleTradingNameNext(data: { trading_name: string; phone: string }) {
    setFormData(prev => ({ ...prev, ...data }))
    setStepIndex(1)
  }

  function handleWorkingHoursNext(working_hours: WorkingHours) {
    setFormData(prev => ({ ...prev, working_hours }))
    setStepIndex(2)
  }

  function handleSlotSizeNext(default_slot_minutes: number) {
    const finalData = { ...formData, default_slot_minutes }
    setFormData(finalData)

    startTransition(async () => {
      const result = await completeOnboarding(finalData)
      if (result?.error) {
        const errors = result.error
        const messages = Object.values(errors).flat()
        setFormError(messages[0] as string ?? 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-start">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-1 bg-black transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full max-w-sm px-6 py-10">
        {stepIndex === 0 && (
          <StepTradingName
            initialTradingName={formData.trading_name}
            initialPhone={formData.phone}
            onNext={handleTradingNameNext}
          />
        )}

        {stepIndex === 1 && (
          <StepWorkingHours
            initialHours={formData.working_hours}
            onNext={handleWorkingHoursNext}
            onBack={() => setStepIndex(0)}
          />
        )}

        {stepIndex === 2 && (
          <StepSlotSize
            initialSlotMinutes={formData.default_slot_minutes}
            onNext={handleSlotSizeNext}
            onBack={() => setStepIndex(1)}
            isPending={isPending}
          />
        )}

        {formError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{formError}</p>
          </div>
        )}
      </div>
    </main>
  )
}
