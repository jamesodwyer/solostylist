import React, { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useTheme } from '@/providers/ThemeProvider'
import type { CalendarView } from './SegmentedControl'

interface DateHeaderProps {
  date: Date
  view: CalendarView
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDayLabel(date: Date): string {
  const day = DAY_NAMES[date.getDay()]
  const d = date.getDate()
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3)
  const year = date.getFullYear()
  return `${day} ${d} ${month} ${year}`
}

function formatWeekLabel(date: Date): string {
  // Find Monday of this week
  const day = date.getDay() // 0=Sun
  const diffToMon = (day === 0 ? -6 : 1 - day)
  const monday = new Date(date)
  monday.setDate(date.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const monD = monday.getDate()
  const sunD = sunday.getDate()
  const monMonth = MONTH_NAMES[monday.getMonth()].slice(0, 3)
  const sunMonth = MONTH_NAMES[sunday.getMonth()].slice(0, 3)

  if (monMonth === sunMonth) {
    return `${monD}–${sunD} ${monMonth} ${sunday.getFullYear()}`
  }
  return `${monD} ${monMonth} – ${sunD} ${sunMonth} ${sunday.getFullYear()}`
}

function formatMonthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function DateHeader({ date, view, onPrev, onNext, onToday }: DateHeaderProps) {
  const { theme } = useTheme()

  const label = useMemo(() => {
    if (view === 'day') return formatDayLabel(date)
    if (view === 'week') return formatWeekLabel(date)
    return formatMonthLabel(date)
  }, [date, view])

  const todayHighlight = isToday(date) && view === 'day'

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrev}
        style={styles.arrow}
        activeOpacity={0.7}
        accessibilityLabel="Previous"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronLeft size={22} color={theme.text} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToday}
        style={styles.labelContainer}
        activeOpacity={0.7}
        accessibilityLabel="Go to today"
      >
        <Text
          style={[
            styles.label,
            { color: todayHighlight ? theme.primary : theme.text },
          ]}
        >
          {label}
        </Text>
        {todayHighlight && (
          <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onNext}
        style={styles.arrow}
        activeOpacity={0.7}
        accessibilityLabel="Next"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ChevronRight size={22} color={theme.text} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 44,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
})
