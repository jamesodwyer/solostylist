'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Banknote, CreditCard } from 'lucide-react'
import { Payment } from '@/lib/types/database'
import { formatPrice, formatDiaryDate } from '@/lib/utils'
import { PaymentList } from './payment-list'
import { AdjustmentSheet } from './adjustment-sheet'

interface MoneyViewProps {
  payments: Payment[]
  totalCash: number
  totalCard: number
  totalRefunds: number
  grossTotal: number
  netTotal: number
  dateStr: string  // YYYY-MM-DD
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

export function MoneyView({
  payments,
  totalCash,
  totalCard,
  totalRefunds,
  grossTotal,
  netTotal,
  dateStr,
}: MoneyViewProps) {
  const router = useRouter()
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [adjustmentOpen, setAdjustmentOpen] = useState(false)

  const prevDate = addDays(dateStr, -1)
  const nextDate = addDays(dateStr, 1)

  function handleDatePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      router.push(`/money?date=${e.target.value}`)
    }
  }

  function handleDateLabelClick() {
    dateInputRef.current?.showPicker()
  }

  function handleRefund(payment: Payment) {
    setSelectedPayment(payment)
    setAdjustmentOpen(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Date navigation header */}
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        {/* Previous day */}
        <button
          onClick={() => router.push(`/money?date=${prevDate}`)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-black active:text-black"
          aria-label="Previous day"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Date display — tap to open date picker */}
        <button
          onClick={handleDateLabelClick}
          className="flex-1 flex items-center justify-center min-h-[44px]"
        >
          <span className="text-base font-semibold text-gray-900">
            {formatDiaryDate(dateStr)}
          </span>
          {/* Visually hidden date input */}
          <input
            ref={dateInputRef}
            type="date"
            value={dateStr}
            onChange={handleDatePickerChange}
            className="sr-only"
            tabIndex={-1}
          />
        </button>

        {/* Next day */}
        <button
          onClick={() => router.push(`/money?date=${nextDate}`)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-black active:text-black"
          aria-label="Next day"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Summary cards */}
        <div className="space-y-2">
          {/* Cash + Card row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-gray-50 px-4 py-3 flex items-center gap-2">
              <Banknote className="size-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Cash</p>
                <p className="text-sm font-semibold text-gray-900">{formatPrice(totalCash)}</p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 px-4 py-3 flex items-center gap-2">
              <CreditCard className="size-4 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Card</p>
                <p className="text-sm font-semibold text-gray-900">{formatPrice(totalCard)}</p>
              </div>
            </div>
          </div>

          {/* Net total card */}
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(netTotal)}</p>
            {totalRefunds > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Gross: {formatPrice(grossTotal)} &middot; Refunds: -{formatPrice(totalRefunds)}
              </p>
            )}
          </div>
        </div>

        {/* Transactions section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Transactions
              <span className="ml-1.5 text-xs font-normal text-gray-400">({payments.length})</span>
            </h2>
          </div>
          <PaymentList payments={payments} onRefund={handleRefund} />
        </div>
      </div>

      {/* Adjustment sheet */}
      <AdjustmentSheet
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        originalPayment={selectedPayment}
      />
    </div>
  )
}
