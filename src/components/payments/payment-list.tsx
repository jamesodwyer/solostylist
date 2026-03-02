'use client'

import { Banknote, CreditCard } from 'lucide-react'
import { Payment } from '@/lib/types/database'
import { formatPrice, formatTime } from '@/lib/utils'

interface PaymentListProps {
  payments: Payment[]
  onRefund?: (payment: Payment) => void
}

function paymentTypeBadge(type: Payment['payment_type']) {
  switch (type) {
    case 'payment':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Payment
        </span>
      )
    case 'refund':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          Refund
        </span>
      )
    case 'void':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          Void
        </span>
      )
  }
}

export function PaymentList({ payments, onRefund }: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-400">No payments yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
      {payments.map((payment) => {
        const clientName = payment.clients
          ? [payment.clients.first_name, payment.clients.last_name].filter(Boolean).join(' ')
          : 'Unknown client'

        return (
          <div key={payment.id} className="px-4 py-3 bg-white flex items-start gap-3">
            {/* Left: client name + badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {clientName}
                </span>
                {paymentTypeBadge(payment.payment_type)}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-gray-400">{formatTime(payment.paid_at)}</span>
                {payment.notes && (
                  <>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400 truncate max-w-[160px]">{payment.notes}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: amount + method + optional refund button */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${payment.payment_type !== 'payment' ? 'text-red-600' : 'text-gray-900'}`}>
                  {payment.payment_type !== 'payment' ? '-' : ''}{formatPrice(payment.amount)}
                </span>
                {payment.method === 'cash' ? (
                  <Banknote className="size-3.5 text-gray-400" />
                ) : (
                  <CreditCard className="size-3.5 text-gray-400" />
                )}
              </div>
              {payment.payment_type === 'payment' && onRefund && (
                <button
                  onClick={() => onRefund(payment)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium active:opacity-70"
                >
                  Refund
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
