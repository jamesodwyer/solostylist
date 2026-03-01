'use client'

import { useState } from 'react'

const SLOT_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

interface StepSlotSizeProps {
  initialSlotMinutes?: number
  onNext: (slotMinutes: number) => void
  onBack: () => void
  isPending: boolean
}

export function StepSlotSize({
  initialSlotMinutes = 15,
  onNext,
  onBack,
  isPending,
}: StepSlotSizeProps) {
  const [selected, setSelected] = useState(initialSlotMinutes)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight mb-2">
          Default appointment length
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          You can customise per service later
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SLOT_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelected(value)}
            className={`py-5 px-4 rounded-xl text-base font-bold transition-colors min-h-[56px] flex items-center justify-center border-2 ${
              selected === value
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isPending}
          className="flex-1 py-4 px-6 rounded-xl border border-gray-200 bg-white text-black text-base font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px] flex items-center justify-center disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => onNext(selected)}
          disabled={isPending}
          className="flex-1 py-4 px-6 rounded-xl bg-black text-white text-base font-bold hover:bg-black/90 active:bg-black/80 transition-colors min-h-[56px] flex items-center justify-center disabled:opacity-60"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Setting up...
            </span>
          ) : (
            'Complete Setup'
          )}
        </button>
      </div>
    </div>
  )
}
