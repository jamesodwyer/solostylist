import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import {
  generateSlots,
  SLOT_HEIGHT_DP,
  TIME_GUTTER_DP,
  parseHHMM,
  currentTimeTop,
} from '@/lib/utils/timeGrid'
import { AppointmentBlock } from '@/components/diary/AppointmentBlock'
import { CurrentTimeLine } from '@/components/diary/CurrentTimeLine'
import type { Appointment } from '@/lib/types/database'

interface TimeGridProps {
  appointments: Appointment[]
  gridStartHHMM: string   // e.g. "06:00"
  gridEndHHMM: string     // e.g. "22:00"
  slotMinutes: number
  showTimeLabels: boolean // true for DayView, false for WeekView columns
  onSlotPress?: (slotTime: string) => void
  onAppointmentPress: (appointment: Appointment) => void
  showCurrentTime?: boolean
  isToday?: boolean
  /** Width to assign for appointment blocks (overrides default right: 8 from AppointmentBlock) */
  columnWidth?: number
}

export function TimeGrid({
  appointments,
  gridStartHHMM,
  gridEndHHMM,
  slotMinutes,
  showTimeLabels,
  onSlotPress,
  onAppointmentPress,
  showCurrentTime = false,
  isToday = false,
  columnWidth,
}: TimeGridProps) {
  const { theme } = useTheme()

  const slots = useMemo(
    () => generateSlots(gridStartHHMM, gridEndHHMM, slotMinutes),
    [gridStartHHMM, gridEndHHMM, slotMinutes]
  )

  const totalHeight = slots.length * SLOT_HEIGHT_DP

  const gridStartMinutes = useMemo(
    () => parseHHMM(gridStartHHMM),
    [gridStartHHMM]
  )

  const nowLineTop = useMemo(() => {
    if (!showCurrentTime || !isToday) return null
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    return currentTimeTop(nowMinutes, gridStartMinutes, slotMinutes)
  }, [showCurrentTime, isToday, gridStartMinutes, slotMinutes])

  return (
    <View style={[styles.grid, { height: totalHeight }]}>
      {/* Slot rows with optional time labels */}
      {slots.map((slotTime, i) => (
        <TouchableOpacity
          key={slotTime}
          style={[
            styles.slotRow,
            {
              top: i * SLOT_HEIGHT_DP,
              height: SLOT_HEIGHT_DP,
              borderTopColor: theme.border,
            },
          ]}
          onPress={() => onSlotPress?.(slotTime)}
          activeOpacity={onSlotPress ? 0.5 : 1}
          disabled={!onSlotPress}
        >
          {showTimeLabels && (
            <View style={[styles.gutterLabel, { width: TIME_GUTTER_DP }]}>
              <Text style={[styles.timeText, { color: theme.textTertiary }]}>
                {slotTime}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.slotLine,
              {
                borderTopColor: theme.border,
                left: showTimeLabels ? TIME_GUTTER_DP : 0,
              },
            ]}
          />
        </TouchableOpacity>
      ))}

      {/* Appointment blocks */}
      {appointments.map((appt) => (
        <AppointmentBlock
          key={appt.id}
          appointment={appt}
          gridStartMinutes={gridStartMinutes}
          slotMinutes={slotMinutes}
          onPress={() => onAppointmentPress(appt)}
        />
      ))}

      {/* Current time line */}
      {nowLineTop !== null && (
        <CurrentTimeLine
          top={nowLineTop}
          gutterWidth={showTimeLabels ? TIME_GUTTER_DP : 0}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
  },
  slotRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gutterLabel: {
    paddingTop: 2,
    paddingRight: 6,
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '400',
  },
  slotLine: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
