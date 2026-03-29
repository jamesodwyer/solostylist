import React, { useMemo } from 'react'
import { Calendar } from 'react-native-calendars'
import { useTheme } from '@/providers/ThemeProvider'
import type { Appointment } from '@/lib/types/database'

interface MonthViewProps {
  selectedDate: string   // YYYY-MM-DD
  appointments: Appointment[]
  onDayPress: (dateString: string) => void
  onMonthChange: (year: number, month: number) => void
}

export function MonthView({
  selectedDate,
  appointments,
  onDayPress,
  onMonthChange,
}: MonthViewProps) {
  const { theme } = useTheme()

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {}

    for (const appt of appointments) {
      const dateKey = appt.starts_at.split('T')[0]
      if (!marks[dateKey]) {
        marks[dateKey] = { marked: true, dotColor: theme.primary }
      }
    }

    // Selected date gets the selection treatment (may also have a dot if there are appointments)
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: theme.primary,
      }
    }

    return marks
  }, [appointments, selectedDate, theme.primary])

  return (
    <Calendar
      current={selectedDate}
      markedDates={markedDates}
      onDayPress={(day) => onDayPress(day.dateString)}
      onMonthChange={(month) => onMonthChange(month.year, month.month)}
      theme={{
        backgroundColor: theme.background,
        calendarBackground: theme.background,
        textSectionTitleColor: theme.textSecondary,
        selectedDayBackgroundColor: theme.primary,
        selectedDayTextColor: '#FFFFFF',
        todayTextColor: theme.primary,
        dayTextColor: theme.text,
        textDisabledColor: theme.textTertiary,
        dotColor: theme.primary,
        selectedDotColor: '#FFFFFF',
        arrowColor: theme.primary,
        monthTextColor: theme.text,
        indicatorColor: theme.primary,
        textDayFontWeight: '400',
        textMonthFontWeight: '600',
        textDayHeaderFontWeight: '500',
        textDayFontSize: 14,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 12,
      }}
    />
  )
}
