'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, ChevronLeft, Loader2, AlertTriangle, Banknote } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { updateAppointmentStatus, rescheduleAppointment } from '@/lib/actions/appointments'
import { formatTime, formatDuration, formatPrice } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/lib/types/database'

interface AppointmentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  date: string  // current diary date, for reschedule default
  onTakePayment?: (appointment: Appointment) => void  // called when Take Payment tapped
}

type Mode = 'view' | 'reschedule' | 'edit-notes'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
}

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  booked: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  no_show: 'bg-amber-100 text-amber-700',
}

export function AppointmentSheet({ open, onOpenChange, appointment, date, onTakePayment }: AppointmentSheetProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('view')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [overrideHours, setOverrideHours] = useState(false)
  const [hasPayment, setHasPayment] = useState(false)

  // Reschedule state
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')

  // Notes editing state
  const [editedNotes, setEditedNotes] = useState('')
  const [notesPending, setNotesPending] = useState(false)

  // Reset mode when appointment changes or sheet closes
  useEffect(() => {
    if (!open) {
      setMode('view')
      setError(null)
      setWarning(null)
      setOverrideHours(false)
    }
  }, [open])

  useEffect(() => {
    if (appointment) {
      setMode('view')
      setError(null)
      setWarning(null)
      setOverrideHours(false)
      setHasPayment(false)
      // Pre-fill reschedule fields with current appointment values
      const startDate = new Date(appointment.starts_at)
      setNewDate(startDate.toISOString().split('T')[0])
      setNewTime(
        `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
      )
      setEditedNotes(appointment.notes ?? '')
      // Check if payment exists for this appointment
      const supabase = createClient()
      supabase
        .from('payments')
        .select('id')
        .eq('appointment_id', appointment.id)
        .eq('payment_type', 'payment')
        .limit(1)
        .then(({ data }) => setHasPayment((data ?? []).length > 0))
    }
  }, [appointment])

  if (!appointment) return null

  const totalMinutes = (appointment.appointment_services ?? []).reduce(
    (sum, s) => sum + s.service_duration_minutes,
    0
  )
  const totalPrice = (appointment.appointment_services ?? []).reduce(
    (sum, s) => sum + s.service_price,
    0
  )
  const clientName = appointment.clients
    ? `${appointment.clients.first_name} ${appointment.clients.last_name ?? ''}`.trim()
    : 'Unknown client'

  function handleStatusChange(newStatus: AppointmentStatus) {
    if (newStatus === 'cancelled') {
      if (!window.confirm('Cancel this appointment?')) return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment!.id, newStatus)
      if (result.error) {
        setError(result.error)
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  async function handleReschedule() {
    if (!newDate || !newTime) return
    setError(null)

    const newStartsAt = `${newDate}T${newTime}:00.000Z`
    const startMs = new Date(newStartsAt).getTime()
    const newEndsAt = new Date(startMs + totalMinutes * 60000).toISOString()

    startTransition(async () => {
      const result = await rescheduleAppointment({
        appointment_id: appointment!.id,
        new_starts_at: newStartsAt,
        new_ends_at: newEndsAt,
        override_working_hours: overrideHours,
      })

      if (result.warning && !overrideHours) {
        setWarning(result.warning)
        return
      }
      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to reschedule')
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  async function handleSaveNotes() {
    setNotesPending(true)
    const supabase = createClient()
    await supabase
      .from('appointments')
      .update({ notes: editedNotes || null, updated_at: new Date().toISOString() })
      .eq('id', appointment!.id)
    setNotesPending(false)
    setMode('view')
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0" showCloseButton={false}>

        {/* --- View Mode --- */}
        {mode === 'view' && (
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-xl font-semibold text-gray-900">{clientName}</SheetTitle>
                  <div className="mt-1">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE_CLASSES[appointment.status]}`}>
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 -mr-2 -mt-1"
                  aria-label="Close"
                >
                  <ChevronLeft size={22} />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Time block */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-900">
                  {formatTime(appointment.starts_at)} &ndash; {formatTime(appointment.ends_at)}
                </span>
                <span className="text-sm text-gray-500">{formatDuration(totalMinutes)}</span>
              </div>

              {/* Services list */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Services</p>
                <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {(appointment.appointment_services ?? []).map(svc => (
                    <div key={svc.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{svc.service_name}</p>
                        <p className="text-xs text-gray-500">{formatDuration(svc.service_duration_minutes)}</p>
                      </div>
                      <span className="text-sm text-gray-700">{formatPrice(svc.service_price)}</span>
                    </div>
                  ))}
                  {(appointment.appointment_services ?? []).length === 0 && (
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-400 italic">No services recorded</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Notes section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</p>
                  {mode === 'view' && (
                    <button
                      onClick={() => setMode('edit-notes')}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 min-h-[32px] px-2"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                  )}
                </div>
                {appointment.notes ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap rounded-xl bg-gray-50 px-4 py-3">{appointment.notes}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic px-1">No notes</p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
            </div>

            {/* Status action buttons + reschedule */}
            <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white space-y-2">
              {appointment.status === 'completed' && !hasPayment && (
                <button
                  onClick={() => {
                    onTakePayment?.(appointment)
                    onOpenChange(false)
                  }}
                  className="w-full bg-black text-white text-sm font-semibold py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Banknote className="size-4" />
                  Take Payment
                </button>
              )}
              {appointment.status === 'completed' && hasPayment && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium py-2">
                  <span>Payment recorded</span>
                </div>
              )}
              {appointment.status === 'booked' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={isPending}
                    className="flex-1 bg-green-600 text-white text-sm font-semibold py-3 rounded-xl min-h-[44px] disabled:opacity-40"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStatusChange('no_show')}
                    disabled={isPending}
                    className="flex-1 border border-amber-400 text-amber-700 text-sm font-semibold py-3 rounded-xl min-h-[44px] disabled:opacity-40"
                  >
                    No Show
                  </button>
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={isPending}
                    className="flex-1 border border-red-300 text-red-600 text-sm font-semibold py-3 rounded-xl min-h-[44px] disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {(appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') && (
                <button
                  onClick={() => handleStatusChange('booked')}
                  disabled={isPending}
                  className="w-full border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl min-h-[44px] disabled:opacity-40 hover:bg-gray-50"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Re-open'
                  )}
                </button>
              )}

              <button
                onClick={() => setMode('reschedule')}
                className="w-full border border-gray-200 text-gray-700 text-sm font-medium py-3 rounded-xl min-h-[44px] hover:bg-gray-50"
              >
                Reschedule
              </button>
            </div>
          </>
        )}

        {/* --- Edit Notes Mode --- */}
        {mode === 'edit-notes' && (
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('view')}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
                  aria-label="Back"
                >
                  <ChevronLeft size={22} />
                </button>
                <SheetTitle className="text-lg">Edit Notes</SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex-1 px-4 pt-4">
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add appointment notes..."
                rows={8}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 resize-none"
                autoFocus
              />
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white">
              <button
                onClick={handleSaveNotes}
                disabled={notesPending}
                className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl min-h-[56px] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {notesPending && <Loader2 className="size-4 animate-spin" />}
                Save Notes
              </button>
            </div>
          </>
        )}

        {/* --- Reschedule Mode --- */}
        {mode === 'reschedule' && (
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setMode('view'); setWarning(null); setError(null); setOverrideHours(false) }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
                  aria-label="Back"
                >
                  <ChevronLeft size={22} />
                </button>
                <div>
                  <SheetTitle className="text-lg">Reschedule</SheetTitle>
                  <p className="text-sm text-gray-500">{clientName}</p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
              {/* Duration reminder */}
              <div className="rounded-xl bg-gray-50 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="text-sm font-medium text-gray-900">{formatDuration(totalMinutes)}</span>
              </div>

              {/* Date input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => { setNewDate(e.target.value); setWarning(null) }}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-gray-400"
                />
              </div>

              {/* Time input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Time</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => { setNewTime(e.target.value); setWarning(null) }}
                  className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-3 outline-none focus:border-gray-400"
                />
              </div>

              {/* Working hours warning */}
              {warning && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 font-medium">{warning}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideHours}
                      onChange={(e) => setOverrideHours(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-600"
                    />
                    <span className="text-sm text-amber-700">Reschedule outside working hours anyway</span>
                  </label>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}
            </div>

            <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white">
              <button
                onClick={handleReschedule}
                disabled={isPending || !newDate || !newTime || (!!warning && !overrideHours)}
                className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Confirm Reschedule
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
