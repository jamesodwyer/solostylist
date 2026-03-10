import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Store, Clock, CalendarClock, Phone, Download } from 'lucide-react'
import type { WorkingHours } from '@/lib/types/database'

function formatWorkingHoursSummary(hours: WorkingHours | null): string {
  if (!hours) return 'Not configured'

  const days = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
  ] as const

  const enabledDays = days.filter(d => hours[d.key]?.enabled)
  if (enabledDays.length === 0) return 'No days configured'

  // Get time range from first enabled day
  const firstDay = hours[enabledDays[0].key]
  const timeRange = `${firstDay.start}–${firstDay.end}`

  if (enabledDays.length === 1) {
    return `${enabledDays[0].label}, ${timeRange}`
  }

  // Check if days are consecutive
  const firstLabel = enabledDays[0].label
  const lastLabel = enabledDays[enabledDays.length - 1].label

  return `${firstLabel}–${lastLabel}, ${timeRange}`
}

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('trading_name, phone, working_hours, default_slot_minutes')
    .eq('id', user.id)
    .single()

  const workingHoursSummary = formatWorkingHoursSummary(
    profile?.working_hours as WorkingHours | null
  )

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      <div className="px-4 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
      </div>

      {/* Business Profile Card */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Business Profile
            </p>
          </div>

          {/* Trading Name */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Trading name</p>
              <p className="text-sm font-medium text-black truncate">
                {profile?.trading_name ?? 'Not set'}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Phone */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-medium text-black truncate">
                {profile?.phone ?? 'Not set'}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Working Hours */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Working hours</p>
              <p className="text-sm font-medium text-black truncate">
                {workingHoursSummary}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Slot Size */}
          <div className="flex items-center gap-3 px-4 py-3 min-h-[44px]">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <CalendarClock className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Slot size</p>
              <p className="text-sm font-medium text-black">
                {profile?.default_slot_minutes ?? 30} minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Manage
            </p>
          </div>

          {/* Services Link */}
          <Link
            href="/settings/services"
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] active:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">Services</p>
              <p className="text-xs text-gray-500">Manage your service catalogue</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Export Data */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Export Data
            </p>
          </div>

          {/* Clients */}
          <a
            href="/api/export/clients"
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] active:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">Export Clients (CSV)</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 shrink-0" />
          </a>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Appointments */}
          <a
            href="/api/export/appointments"
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] active:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">Export Appointments (CSV)</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 shrink-0" />
          </a>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Payments */}
          <a
            href="/api/export/payments"
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] active:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">Export Payments (CSV)</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 shrink-0" />
          </a>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Notes */}
          <a
            href="/api/export/notes"
            className="flex items-center gap-3 px-4 py-3 min-h-[44px] active:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">Export Notes (CSV)</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 shrink-0" />
          </a>
        </div>
      </div>
    </div>
  )
}
