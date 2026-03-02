'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, CreditCard, Loader2, ChevronLeft } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createPayment } from '@/lib/actions/payments'
import { parsePriceToPennies } from '@/lib/utils'

interface PaymentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId?: string
  clientId: string
  clientName: string
  suggestedAmount: number  // integer pennies (total from appointment services)
}

export function PaymentSheet({
  open,
  onOpenChange,
  appointmentId,
  clientId,
  clientName,
  suggestedAmount,
}: PaymentSheetProps) {
  const router = useRouter()
  const [method, setMethod] = useState<'cash' | 'card'>('cash')
  const [amountInput, setAmountInput] = useState(
    suggestedAmount > 0 ? (suggestedAmount / 100).toFixed(2) : ''
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    const amountPennies = parsePriceToPennies(amountInput)
    if (amountPennies <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createPayment({
        appointment_id: appointmentId,
        client_id: clientId,
        amount: amountPennies,
        method,
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] flex flex-col p-0" showCloseButton={false}>
        {/* Header */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
              aria-label="Close"
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <SheetTitle className="text-lg">Take Payment</SheetTitle>
              <p className="text-sm text-gray-500">{clientName}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
          {/* Method toggle */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Method</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMethod('cash')}
                className={`flex-1 min-h-[56px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                  method === 'cash'
                    ? 'bg-black text-white'
                    : 'border border-gray-200 text-gray-700'
                }`}
              >
                <Banknote className="size-5" />
                Cash
              </button>
              <button
                onClick={() => setMethod('card')}
                className={`flex-1 min-h-[56px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                  method === 'card'
                    ? 'bg-black text-white'
                    : 'border border-gray-200 text-gray-700'
                }`}
              >
                <CreditCard className="size-5" />
                Card
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
                placeholder="0.00"
                className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl pl-7 pr-3 py-3 outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment notes (optional)"
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
            className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Record Payment
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
