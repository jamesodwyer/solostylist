import React from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { appointmentBlockLayout, TIME_GUTTER_DP } from '@/lib/utils/timeGrid'
import type { Appointment } from '@/lib/types/database'

interface AppointmentBlockProps {
  appointment: Appointment
  gridStartMinutes: number
  slotMinutes: number
  onPress: () => void
}

function padTime(n: number): string {
  return String(n).padStart(2, '0')
}

function formatBlockTime(isoString: string): string {
  const d = new Date(isoString)
  return `${padTime(d.getHours())}:${padTime(d.getMinutes())}`
}

export function AppointmentBlock({
  appointment,
  gridStartMinutes,
  slotMinutes,
  onPress,
}: AppointmentBlockProps) {
  const { theme } = useTheme()

  const { top, height } = appointmentBlockLayout(appointment, gridStartMinutes, slotMinutes)

  const isCancelled = appointment.status === 'cancelled'

  // Status-based colour coding per DIARY-09
  const statusStyle: ViewStyle = (() => {
    switch (appointment.status) {
      case 'booked':
        return {
          backgroundColor: theme.primaryLight,
          borderLeftColor: theme.primary,
          borderLeftWidth: 4,
        }
      case 'completed':
        return {
          backgroundColor: theme.successLight,
          borderLeftColor: theme.success,
          borderLeftWidth: 4,
        }
      case 'cancelled':
        return {
          backgroundColor: theme.surface,
          borderLeftColor: theme.border,
          borderLeftWidth: 4,
          opacity: 0.4,
        }
      case 'no_show':
        return {
          backgroundColor: theme.warningLight,
          borderLeftColor: theme.warning,
          borderLeftWidth: 4,
          opacity: 0.6,
        }
      default:
        return {
          backgroundColor: theme.primaryLight,
          borderLeftColor: theme.primary,
          borderLeftWidth: 4,
        }
    }
  })()

  const positionStyle: ViewStyle = {
    position: 'absolute',
    top,
    height,
    left: TIME_GUTTER_DP,
    right: 8,
  }

  const clientName = appointment.clients
    ? `${appointment.clients.first_name}${appointment.clients.last_name ? ` ${appointment.clients.last_name}` : ''}`
    : 'Unknown'

  const services = appointment.appointment_services ?? []

  return (
    <TouchableOpacity
      style={[styles.block, positionStyle, statusStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Client name — always shown */}
      <Text
        style={[
          styles.clientName,
          { color: theme.text },
          isCancelled && styles.strikethrough,
        ]}
        numberOfLines={1}
      >
        {clientName}
      </Text>

      {/* First service name — shown when block is tall enough */}
      {height >= 50 && services.length > 0 && (
        <Text
          style={[styles.serviceName, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {services[0].service_name}
          {services.length > 1 ? ` +${services.length - 1}` : ''}
        </Text>
      )}

      {/* Time range — shown when block is tallest */}
      {height >= 90 && (
        <Text style={[styles.timeRange, { color: theme.textSecondary }]}>
          {formatBlockTime(appointment.starts_at)} {'\u2013'} {formatBlockTime(appointment.ends_at)}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  clientName: {
    fontSize: 12,
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  serviceName: {
    fontSize: 11,
    marginTop: 1,
  },
  timeRange: {
    fontSize: 11,
    marginTop: 2,
  },
})
