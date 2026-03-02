'use client'

import { Appointment } from '@/lib/types/database'
import { formatTime } from '@/lib/utils'

interface AppointmentBlockProps {
  appointment: Appointment
  dayStartMinutes: number
  slotMinutes: number
  slotHeightPx: number
  gutterWidth: number
  onClick: () => void
}

function getStatusClasses(status: Appointment['status']): string {
  switch (status) {
    case 'booked':
      return 'bg-blue-50 border-l-4 border-blue-500'
    case 'completed':
      return 'bg-green-50 border-l-4 border-green-500'
    case 'cancelled':
      return 'bg-gray-50 border-l-4 border-gray-300 opacity-40'
    case 'no_show':
      return 'bg-amber-50 border-l-4 border-amber-500 opacity-60'
    default:
      return 'bg-blue-50 border-l-4 border-blue-500'
  }
}

export function AppointmentBlock({
  appointment,
  dayStartMinutes,
  slotMinutes,
  slotHeightPx,
  gutterWidth,
  onClick,
}: AppointmentBlockProps) {
  const start = new Date(appointment.starts_at)
  const end = new Date(appointment.ends_at)
  const startMinutes = start.getHours() * 60 + start.getMinutes()
  const durationMinutes = (end.getTime() - start.getTime()) / 60000
  const topPx = ((startMinutes - dayStartMinutes) / slotMinutes) * slotHeightPx
  const heightPx = (durationMinutes / slotMinutes) * slotHeightPx

  const statusClasses = getStatusClasses(appointment.status)
  const isCancelled = appointment.status === 'cancelled'
  const isFreedSlot = appointment.status === 'cancelled' || appointment.status === 'no_show'

  return (
    <div
      className={`absolute rounded-lg px-2 py-1 cursor-pointer overflow-hidden ${statusClasses}`}
      style={{
        top: `${topPx}px`,
        height: `${Math.max(heightPx, 24)}px`,
        left: `${gutterWidth}px`,
        right: '8px',
      }}
      onClick={(e) => {
        if (isFreedSlot) {
          // Let the tap pass through to the slot for a new booking
          return
        }
        e.stopPropagation()
        onClick()
      }}
    >
      <div className="flex items-start justify-between">
        <p className={`text-xs font-medium truncate flex-1 ${isCancelled ? 'line-through' : ''}`}>
          {appointment.clients?.first_name}{appointment.clients?.last_name ? ` ${appointment.clients.last_name}` : ''}
        </p>
        {isFreedSlot && (
          <button
            className="ml-1 shrink-0 text-gray-400 hover:text-gray-600 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md hover:bg-white/60"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            aria-label="View appointment details"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
          </button>
        )}
      </div>
      {heightPx >= 50 && appointment.appointment_services?.[0] && (
        <p className="text-xs text-gray-600 truncate">
          {appointment.appointment_services[0].service_name}
          {appointment.appointment_services.length > 1 && ` +${appointment.appointment_services.length - 1}`}
        </p>
      )}
      {heightPx >= 90 && (
        <p className="text-xs text-gray-400">
          {formatTime(appointment.starts_at)} &ndash; {formatTime(appointment.ends_at)}
        </p>
      )}
    </div>
  )
}
