import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import { useTheme } from '@/providers/ThemeProvider'
import {
  generateSlots,
  parseHHMM,
  appointmentBlockLayout,
  SLOT_HEIGHT_DP,
  TIME_GUTTER_DP,
} from '@/lib/utils/timeGrid'
import { AppointmentBlock } from '@/components/diary/AppointmentBlock'
import type { Appointment } from '@/lib/types/database'

const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_GUTTER_DP = 40 // narrower gutter for week view to give more room to 7 columns

interface WeekViewProps {
  weekStartDate: Date   // Monday of the week
  appointments: Appointment[]
  slotMinutes: number
  gridStartHHMM: string
  gridEndHHMM: string
  onSlotPress: (date: string, time: string) => void
  onAppointmentPress: (appointment: Appointment) => void
  onNext: () => void
  onPrev: () => void
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function isTodayDate(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function WeekView({
  weekStartDate,
  appointments,
  slotMinutes,
  gridStartHHMM,
  gridEndHHMM,
  onSlotPress,
  onAppointmentPress,
  onNext,
  onPrev,
}: WeekViewProps) {
  const { theme } = useTheme()
  const { width: screenWidth } = useWindowDimensions()

  // Build the 7 days starting from weekStartDate (Monday)
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStartDate)
      d.setDate(weekStartDate.getDate() + i)
      return d
    })
  }, [weekStartDate])

  const slots = useMemo(
    () => generateSlots(gridStartHHMM, gridEndHHMM, slotMinutes),
    [gridStartHHMM, gridEndHHMM, slotMinutes]
  )

  const gridStartMinutes = useMemo(() => parseHHMM(gridStartHHMM), [gridStartHHMM])
  const totalHeight = slots.length * SLOT_HEIGHT_DP

  // Column width: remaining space after time gutter divided by 7
  const columnWidth = (screenWidth - WEEK_GUTTER_DP) / 7

  // Group appointments by date string
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const appt of appointments) {
      const key = appt.starts_at.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(appt)
    }
    return map
  }, [appointments])

  // Swipe gesture for week navigation
  const swipeGesture = Gesture.Pan()
    .minDistance(50)
    .onEnd((event) => {
      if (event.translationX < -50) {
        runOnJS(onNext)()
      } else if (event.translationX > 50) {
        runOnJS(onPrev)()
      }
    })

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ flex: 1 }}>
        {/* Day header row */}
        <View
          style={[
            styles.headerRow,
            { borderBottomColor: theme.border, backgroundColor: theme.background },
          ]}
        >
          {/* Gutter placeholder */}
          <View style={{ width: WEEK_GUTTER_DP }} />
          {weekDays.map((day) => {
            const today = isTodayDate(day)
            return (
              <View
                key={day.toISOString()}
                style={[
                  styles.dayHeader,
                  { width: columnWidth },
                  today && { backgroundColor: theme.primaryLight },
                ]}
              >
                <Text style={[styles.dayAbbrev, { color: theme.textSecondary }]}>
                  {DAY_ABBREVS[day.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    { color: today ? theme.primary : theme.text },
                    today && { fontWeight: '700' },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Scrollable grid */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
        >
          <View style={[styles.gridContainer, { height: totalHeight }]}>
            {/* Time gutter labels */}
            <View style={[styles.timeGutter, { width: WEEK_GUTTER_DP }]}>
              {slots.map((slotTime, i) => (
                <View
                  key={slotTime}
                  style={[
                    styles.gutterSlot,
                    {
                      top: i * SLOT_HEIGHT_DP,
                      height: SLOT_HEIGHT_DP,
                    },
                  ]}
                >
                  <Text style={[styles.gutterText, { color: theme.textTertiary }]}>
                    {slotTime}
                  </Text>
                </View>
              ))}
            </View>

            {/* 7 day columns */}
            {weekDays.map((day, colIdx) => {
              const dateStr = toDateString(day)
              const dayAppts = appointmentsByDate[dateStr] ?? []
              const today = isTodayDate(day)

              return (
                <View
                  key={dateStr}
                  style={[
                    styles.dayColumn,
                    {
                      width: columnWidth,
                      left: WEEK_GUTTER_DP + colIdx * columnWidth,
                      height: totalHeight,
                      borderLeftColor: theme.border,
                    },
                    today && { backgroundColor: theme.surface },
                  ]}
                >
                  {/* Slot row lines */}
                  {slots.map((slotTime, i) => (
                    <View
                      key={slotTime}
                      style={[
                        styles.slotLine,
                        {
                          top: i * SLOT_HEIGHT_DP,
                          borderTopColor: theme.border,
                        },
                      ]}
                    />
                  ))}

                  {/* Appointment blocks — positioned within column */}
                  {dayAppts.map((appt) => {
                    const { top, height } = appointmentBlockLayout(
                      appt,
                      gridStartMinutes,
                      slotMinutes
                    )
                    return (
                      <WeekAppointmentBlock
                        key={appt.id}
                        appointment={appt}
                        top={top}
                        height={height}
                        columnWidth={columnWidth}
                        onPress={() => onAppointmentPress(appt)}
                        theme={theme}
                      />
                    )
                  })}
                </View>
              )
            })}
          </View>
        </ScrollView>
      </View>
    </GestureDetector>
  )
}

// Inline appointment block for week view columns (no gutter offset)
interface WeekAppointmentBlockProps {
  appointment: Appointment
  top: number
  height: number
  columnWidth: number
  onPress: () => void
  theme: import('@/theme').Theme
}

function WeekAppointmentBlock({
  appointment,
  top,
  height,
  columnWidth,
  onPress,
  theme,
}: WeekAppointmentBlockProps) {
  const isCancelled = appointment.status === 'cancelled'

  let bg = theme.primaryLight
  let borderColor = theme.primary
  let opacity = 1

  switch (appointment.status) {
    case 'completed':
      bg = theme.successLight
      borderColor = theme.success
      break
    case 'cancelled':
      bg = theme.surface
      borderColor = theme.border
      opacity = 0.4
      break
    case 'no_show':
      bg = theme.warningLight
      borderColor = theme.warning
      opacity = 0.6
      break
  }

  const clientName = appointment.clients
    ? appointment.clients.first_name
    : '?'

  // If column is very narrow (< 48dp), show only a coloured bar
  const showText = columnWidth >= 48

  return (
    <View
      pointerEvents="box-none"
      style={[
        weekBlockStyles.block,
        {
          top,
          height: Math.max(height, 8),
          width: columnWidth - 2,
          backgroundColor: bg,
          borderLeftColor: borderColor,
          opacity,
        },
      ]}
    >
      {showText && (
        <Text
          style={[
            weekBlockStyles.name,
            { color: theme.text },
            isCancelled && weekBlockStyles.strikethrough,
          ]}
          numberOfLines={1}
        >
          {clientName}
        </Text>
      )}
    </View>
  )
}

const weekBlockStyles = StyleSheet.create({
  block: {
    position: 'absolute',
    left: 1,
    borderLeftWidth: 3,
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  name: {
    fontSize: 10,
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
})

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayAbbrev: {
    fontSize: 11,
    fontWeight: '500',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  gridContainer: {
    position: 'relative',
    flexDirection: 'row',
  },
  timeGutter: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  gutterSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingRight: 4,
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  gutterText: {
    fontSize: 9,
    fontWeight: '400',
  },
  dayColumn: {
    position: 'absolute',
    top: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  slotLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SLOT_HEIGHT_DP,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
