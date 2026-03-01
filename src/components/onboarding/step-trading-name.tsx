'use client'

import { useState } from 'react'

interface StepTradingNameProps {
  initialTradingName?: string
  initialPhone?: string
  onNext: (data: { trading_name: string; phone: string }) => void
}

export function StepTradingName({
  initialTradingName = '',
  initialPhone = '',
  onNext,
}: StepTradingNameProps) {
  const [tradingName, setTradingName] = useState(initialTradingName)
  const [phone, setPhone] = useState(initialPhone)
  const [error, setError] = useState('')

  function handleContinue() {
    if (!tradingName.trim()) {
      setError('Trading name is required')
      return
    }
    setError('')
    onNext({ trading_name: tradingName.trim(), phone: phone.trim() })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-black tracking-tight mb-2">
          What&apos;s your business name?
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          This is how clients will see you
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="trading-name" className="text-sm font-semibold text-black">
            Business name <span className="text-red-500">*</span>
          </label>
          <input
            id="trading-name"
            type="text"
            value={tradingName}
            onChange={(e) => {
              setTradingName(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. Sarah's Salon"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-black placeholder:text-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all min-h-[56px]"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm font-semibold text-black">
            Phone number <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 07700 900000"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-black placeholder:text-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all min-h-[56px]"
          />
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 px-6 rounded-xl bg-black text-white text-base font-bold hover:bg-black/90 active:bg-black/80 transition-colors min-h-[56px] flex items-center justify-center"
      >
        Continue
      </button>
    </div>
  )
}
