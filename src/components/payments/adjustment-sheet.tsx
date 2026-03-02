'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, XCircle, Loader2, ChevronLeft } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createAdjustment } from '@/lib/actions/payments'
import { formatPrice, formatTime, parsePriceToPennies } from '@/lib/utils'
import { Payment } from '@/lib/types/database'

interface AdjustmentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalPayment: Payment | null
}

export function AdjustmentSheet({
  open,
  onOpenChange,
  originalPayment,
}: AdjustmentSheetProps) {
  const router = useRouter()
  const [adjustmentType, setAdjustmentType] = useState<'refund' | 'void'>('refund')
  const [amountInput, setAmountInput] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Sync amount input when original payment or type changes
  function getDefaultAmount() {
    return originalPayment ? (originalPayment.amount / 100).toFixed(2) : ''
  }

  function handleTypeChange(type: 'refund' | 'void') {
    setAdjustmentType(type)
    if (type === 'void') {
      setAmountInput(getDefaultAmount())
    }
    setError(null)
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // Reset state on close
      setAdjustmentType('refund')
      setAmountInput('')
      setNotes('')
      setError(null)
    } else {
      setAmountInput(getDefaultAmount())
    }
    onOpenChange(isOpen)
  }

  function handleSubmit() {
    if (!originalPayment) return

    const amountPennies = parsePriceToPennies(amountInput)
    if (amountPennies <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (amountPennies > originalPayment.amount) {
      setError('Adjustment amount cannot exceed the original payment.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createAdjustment({
        reference_payment_id: originalPayment.id,
        adjustment_type: adjustmentType,
        amount: amountPennies,
        method: originalPayment.method,
        notes: notes || undefined,
      })
      if ('error' in result && result.error) {
        setError(result.error)
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  const clientName = originalPayment?.clients
    ? [originalPayment.clients.first_name, originalPayment.clients.last_name].filter(Boolean).join(' ')
    : 'Unknown client'

  const isVoid = adjustmentType === 'void'
  const submitBgClass = isVoid ? 'bg-amber-600' : 'bg-red-600'
  const submitLabel = isVoid ? 'Confirm Void' : 'Confirm Refund'

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] flex flex-col p-0" showCloseButton={false}>
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenChange(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
              aria-label="Close"
            >
              <ChevronLeft size={22} />
            </button>
            <SheetTitle className="text-lg">Record Adjustment</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
          {/* Original payment summary */}
          {originalPayment && (
            <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Original Payment</p>
              <p className="text-sm font-medium text-gray-900">{clientName}</p>
              <p className="text-sm text-gray-500">
                {formatPrice(originalPayment.amount)} · {originalPayment.method === 'cash' ? 'Cash' : 'Card'} · {formatTime(originalPayment.paid_at)}
              </p>
            </div>
          )}

          {/* Adjustment type toggle */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Type</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleTypeChange('refund')}
                className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                  adjustmentType === 'refund'
                    ? 'bg-red-600 text-white'
                    : 'border border-gray-200 text-gray-700'
                }`}
              >
                <RotateCcw className="size-4" />
                Refund
              </button>
              <button
                onClick={() => handleTypeChange('void')}
                className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                  adjustmentType === 'void'
                    ? 'bg-amber-600 text-white'
                    : 'border border-gray-200 text-gray-700'
                }`}
              >
                <XCircle className="size-4" />
                Void (cancel)
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                £
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setError(null) }}
                readOnly={isVoid}
                placeholder="0.00"
                className={`w-full text-sm text-gray-900 border border-gray-200 rounded-xl pl-7 pr-3 py-3 outline-none focus:border-gray-400 ${
                  isVoid ? 'bg-gray-50 text-gray-500 cursor-default' : ''
                }`}
              />
            </div>
            {isVoid && (
              <p className="mt-1 text-xs text-gray-400">Void cancels the full amount.</p>
            )}
          </div>

          {/* Notes textarea */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment"
              rows={2}
              className="w-full text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
        </div>

        {/* Submit button */}
        <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isPending || !amountInput || parsePriceToPennies(amountInput) <= 0}
            className={`w-full ${submitBgClass} text-white text-sm font-semibold py-4 rounded-xl min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
