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
        e.stopPropagation()
        onClick()
      }}
    >
      <p className={`text-xs font-medium truncate ${isCancelled ? 'line-through' : ''}`}>
        {appointment.clients?.first_name}{appointment.clients?.last_name ? ` ${appointment.clients.last_name}` : ''}
      </p>
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
