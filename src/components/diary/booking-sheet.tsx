'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Check, ChevronLeft, Loader2 } from 'lucide-react'
import { ClientNotesPreview } from '@/components/diary/client-notes-preview'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { createAppointment } from '@/lib/actions/appointments'
import { formatPrice, formatDuration, formatDiaryDate } from '@/lib/utils'
import type { Client, Service } from '@/lib/types/database'

interface BookingSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string         // 'YYYY-MM-DD' — the day being booked on
  slotTime: string | null  // 'HH:MM' — the slot that was tapped
}

type BookingStep = 'client' | 'services' | 'confirm'

export function BookingSheet({ open, onOpenChange, date, slotTime }: BookingSheetProps) {
  const router = useRouter()
  const [step, setStep] = useState<BookingStep>('client')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [overrideHours, setOverrideHours] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Client search state
  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<Client[]>([])
  const [clientSearchPending, setClientSearchPending] = useState(false)
  const clientTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Services state
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoaded, setServicesLoaded] = useState(false)

  // Client notes state
  const [clientNotes, setClientNotes] = useState<Array<{ id: string; note_type: string; content: string; created_at: string }>>([])
  const [latestFormula, setLatestFormula] = useState<{ id: string; formula: string; notes: string | null; created_at: string } | null>(null)
  const [notesLoaded, setNotesLoaded] = useState(false)

  // Reset all state when sheet opens
  useEffect(() => {
    if (open) {
      setStep('client')
      setSelectedClient(null)
      setSelectedServices([])
      setNotes('')
      setError(null)
      setWarning(null)
      setOverrideHours(false)
      setClientQuery('')
      setClientResults([])
      setClientSearchPending(false)
      setClientNotes([])
      setLatestFormula(null)
      setNotesLoaded(false)
    }
  }, [open])

  // Debounced client search
  useEffect(() => {
    if (clientTimerRef.current) {
      clearTimeout(clientTimerRef.current)
    }

    if (!clientQuery.trim()) {
      setClientSearchPending(false)
      setClientResults([])
      return
    }

    setClientSearchPending(true)

    clientTimerRef.current = setTimeout(async () => {
      const supabase = createClient()
      const q = clientQuery.trim()
      const { data } = await supabase
        .from('clients')
        .select('id, owner_user_id, first_name, last_name, phone, email, address, marketing_consent, created_at, updated_at')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .order('first_name')
        .limit(20)

      setClientSearchPending(false)
      setClientResults((data as Client[]) ?? [])
    }, 250)

    return () => {
      if (clientTimerRef.current) clearTimeout(clientTimerRef.current)
    }
  }, [clientQuery])

  // Fetch client notes and colour formulas when a client is selected
  useEffect(() => {
    if (!selectedClient) {
      setClientNotes([])
      setLatestFormula(null)
      setNotesLoaded(false)
      return
    }
    let cancelled = false
    const supabase = createClient()
    Promise.all([
      supabase
        .from('client_notes')
        .select('id, note_type, content, created_at')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('colour_formulas')
        .select('id, formula, notes, created_at')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ]).then(([notesRes, formulasRes]) => {
      if (cancelled) return
      setClientNotes(notesRes.data ?? [])
      setLatestFormula(formulasRes.data?.[0] ?? null)
      setNotesLoaded(true)
    })
    return () => { cancelled = true }
  }, [selectedClient])

  // Load services when advancing to services step
  useEffect(() => {
    if (step === 'services' && !servicesLoaded) {
      const supabase = createClient()
      supabase
        .from('services')
        .select('*, service_categories(*)')
        .eq('is_active', true)
        .order('name')
        .then(({ data }) => {
          setServices((data as unknown as Service[]) ?? [])
          setServicesLoaded(true)
        })
    }
  }, [step, servicesLoaded])

  // Computed values for confirm step
  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  function computeEndTime(): string {
    if (!slotTime) return ''
    const [h, m] = slotTime.split(':').map(Number)
    const startMinutes = h * 60 + m
    const endMinutes = startMinutes + totalMinutes
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
  }

  function toggleService(service: Service) {
    setSelectedServices(prev =>
      prev.some(s => s.id === service.id)
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service]
    )
  }

  async function handleSubmit() {
    if (!selectedClient || !slotTime) return
    setError(null)

    const startsAt = `${date}T${slotTime}:00.000Z`
    const startDate = new Date(startsAt)
    const endDate = new Date(startDate.getTime() + totalMinutes * 60000)
    const endsAt = endDate.toISOString()

    startTransition(async () => {
      const result = await createAppointment({
        client_id: selectedClient.id,
        starts_at: startsAt,
        ends_at: endsAt,
        notes: notes || '',
        override_working_hours: overrideHours,
        services: selectedServices.map(s => ({
          service_id: s.id,
          service_name: s.name,
          service_price: s.price,
          service_duration_minutes: s.duration_minutes,
        })),
      })

      if (result.warning && !overrideHours) {
        setWarning(result.warning)
        return
      }
      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to create appointment')
        return
      }
      // Success
      onOpenChange(false)
      router.refresh()
    })
  }

  // Step indicator dots
  const steps: BookingStep[] = ['client', 'services', 'confirm']
  const stepIndex = steps.indexOf(step)

  // Group services by category
  const servicesByCategory = services.reduce<Record<string, Service[]>>((acc, svc) => {
    const cat = svc.service_categories?.name ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(svc)
    return acc
  }, {})
  const categoryNames = Object.keys(servicesByCategory).sort()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0" showCloseButton={false}>
        {/* Step progress indicator */}
        <div className="flex items-center justify-center gap-2 pt-3 pb-1">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex
                  ? 'w-6 bg-black'
                  : i < stepIndex
                  ? 'w-4 bg-gray-400'
                  : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* --- Step 1: Select Client --- */}
        {step === 'client' && (
          <>
            <SheetHeader className="px-4 pt-2 pb-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
                  aria-label="Close"
                >
                  <ChevronLeft size={22} />
                </button>
                <SheetTitle className="text-lg">Select Client</SheetTitle>
              </div>
            </SheetHeader>

            {/* Search input */}
            <div className="px-4 pt-2 pb-2 border-b border-gray-100">
              <div className={`flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 transition-opacity ${clientSearchPending ? 'opacity-60' : 'opacity-100'}`}>
                <Search className="size-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
                  autoFocus
                />
                {clientQuery && (
                  <button
                    type="button"
                    onClick={() => { setClientQuery(''); setClientResults([]) }}
                    className="shrink-0 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {clientResults.length === 0 && clientQuery.trim() && !clientSearchPending && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No clients found.</p>
                  <p className="text-xs text-gray-400 mt-1">Add a client from the Clients tab.</p>
                </div>
              )}
              {clientResults.length === 0 && !clientQuery.trim() && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-400">Start typing to search clients</p>
                </div>
              )}
              {clientResults.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client)
                    setStep('services')
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-gray-600">
                      {client.first_name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {client.first_name} {client.last_name ?? ''}
                    </p>
                    {client.phone && (
                      <p className="text-xs text-gray-500">{client.phone}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* --- Step 2: Select Services --- */}
        {step === 'services' && (
          <>
            <SheetHeader className="px-4 pt-2 pb-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('client')}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
                  aria-label="Back"
                >
                  <ChevronLeft size={22} />
                </button>
                <div>
                  <SheetTitle className="text-lg">Select Services</SheetTitle>
                  {selectedClient && (
                    <p className="text-sm text-gray-500">
                      {selectedClient.first_name} {selectedClient.last_name ?? ''}
                    </p>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Client notes preview */}
              {selectedClient && (
                <div className="mt-3 mb-1">
                  <ClientNotesPreview
                    notes={clientNotes}
                    latestFormula={latestFormula}
                    loading={!notesLoaded}
                    clientId={selectedClient.id}
                  />
                </div>
              )}
              {!servicesLoaded && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-5 animate-spin text-gray-400" />
                </div>
              )}
              {servicesLoaded && services.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">No active services found.</p>
                  <p className="text-xs text-gray-400 mt-1">Add services in the Settings tab.</p>
                </div>
              )}
              {servicesLoaded && categoryNames.map(cat => (
                <div key={cat} className="mt-4">
                  {categoryNames.length > 1 || cat !== 'Other' ? (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
                  ) : null}
                  <div className="space-y-2">
                    {servicesByCategory[cat].map(svc => {
                      const isSelected = selectedServices.some(s => s.id === svc.id)
                      return (
                        <button
                          key={svc.id}
                          onClick={() => toggleService(svc)}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-gray-900">{formatPrice(svc.price)}</p>
                            <p className="text-xs text-gray-500">{formatDuration(svc.duration_minutes)}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Running totals + continue */}
            <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white">
              {selectedServices.length > 0 && (
                <p className="text-sm text-gray-500 text-center mb-3">
                  {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} &middot; {formatDuration(totalMinutes)} &middot; {formatPrice(totalPrice)}
                </p>
              )}
              <button
                onClick={() => setStep('confirm')}
                disabled={selectedServices.length === 0}
                className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {/* --- Step 3: Confirm & Book --- */}
        {step === 'confirm' && (
          <>
            <SheetHeader className="px-4 pt-2 pb-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('services')}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-gray-500"
                  aria-label="Back"
                >
                  <ChevronLeft size={22} />
                </button>
                <SheetTitle className="text-lg">Confirm Booking</SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Summary card */}
              <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedClient?.first_name} {selectedClient?.last_name ?? ''}
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-gray-500">Date</span>
                    <span className="text-sm font-medium text-gray-900">{formatDiaryDate(date)}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-sm text-gray-500">Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {slotTime} &ndash; {computeEndTime()}
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-500 mb-2">Services</p>
                    <div className="space-y-1.5">
                      {selectedServices.map(svc => (
                        <div key={svc.id} className="flex justify-between">
                          <span className="text-sm text-gray-900">{svc.name}</span>
                          <span className="text-sm text-gray-500">{formatPrice(svc.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 py-3 flex justify-between bg-gray-50">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(totalPrice)} &middot; {formatDuration(totalMinutes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add booking notes..."
                  rows={3}
                  className="w-full text-sm text-gray-900 placeholder:text-gray-400 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 resize-none"
                />
              </div>

              {/* Working hours warning */}
              {warning && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-800 font-medium mb-2">{warning}</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overrideHours}
                      onChange={(e) => setOverrideHours(e.target.checked)}
                      className="w-4 h-4 rounded accent-amber-600"
                    />
                    <span className="text-sm text-amber-700">Book outside working hours anyway</span>
                  </label>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="px-4 pb-6 pt-3 border-t border-gray-100 bg-white">
              {error && (
                <p className="text-sm text-red-600 text-center mb-3">{error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={isPending || (!!warning && !overrideHours)}
                className="w-full bg-black text-white text-sm font-semibold py-4 rounded-xl min-h-[56px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Book Appointment
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
