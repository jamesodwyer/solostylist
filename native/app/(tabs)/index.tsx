import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useTheme } from '@/providers/ThemeProvider'
import { spacing } from '@/theme'
import { SegmentedControl, type CalendarView } from '@/components/diary/SegmentedControl'
import { DateHeader } from '@/components/diary/DateHeader'
import { MonthView } from '@/components/diary/MonthView'
import { WeekView } from '@/components/diary/WeekView'
import { DayView } from '@/components/diary/DayView'
import { getAppointmentsForRange, getAppointmentsForMonth } from '@/lib/actions/appointments'
import { getProfile } from '@/lib/actions/profile'
import { parseHHMM } from '@/lib/utils/timeGrid'
import type { Appointment, Profile } from '@/lib/types/database'

const GRID_START = '06:00'
const GRID_END = '22:00'

// ---- Date helpers -----------------------------------------------------------

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

/** Monday of the week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// ---- Main component ---------------------------------------------------------

export default function DiaryScreen() {
  const { theme } = useTheme()

  const [view, setView] = useState<CalendarView>('day')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  // Load profile once
  useEffect(() => {
    getProfile().then((p) => setProfile(p)).catch(console.error)
  }, [])

  // Derived profile values
  const slotMinutes = profile?.default_slot_minutes ?? 30
  const workStartMinutes = parseHHMM(
    profile?.working_hours?.mon?.start ?? '09:00'
  )

  // ---- Data loading ----------------------------------------------------------

  const loadAppointments = useCallback(async () => {
    setLoading(true)
    try {
      if (view === 'month') {
        const appts = await getAppointmentsForMonth(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1
        )
        setAppointments(appts)
      } else if (view === 'week') {
        const monday = weekStart(selectedDate)
        const sunday = addDays(monday, 7)
        const appts = await getAppointmentsForRange(
          toDateString(monday),
          toDateString(sunday)
        )
        setAppointments(appts)
      } else {
        // Day view — load the single day
        const start = toDateString(selectedDate)
        const end = toDateString(addDays(selectedDate, 1))
        const appts = await getAppointmentsForRange(start, end)
        setAppointments(appts)
      }
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }, [view, selectedDate])

  // Reload on focus (when returning to diary tab)
  useFocusEffect(
    useCallback(() => {
      loadAppointments()
    }, [loadAppointments])
  )

  // Reload when date/view changes
  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  // ---- Navigation handlers --------------------------------------------------

  const handlePrev = useCallback(() => {
    setSelectedDate((prev) => {
      if (view === 'day') return addDays(prev, -1)
      if (view === 'week') return addDays(prev, -7)
      return addMonths(prev, -1)
    })
  }, [view])

  const handleNext = useCallback(() => {
    setSelectedDate((prev) => {
      if (view === 'day') return addDays(prev, 1)
      if (view === 'week') return addDays(prev, 7)
      return addMonths(prev, 1)
    })
  }, [view])

  const handleToday = useCallback(() => {
    setSelectedDate(new Date())
  }, [])

  const handleDayPress = useCallback((dateString: string) => {
    // Parse YYYY-MM-DD safely without timezone offset
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    setSelectedDate(date)
    setView('day')
  }, [])

  const handleMonthChange = useCallback((year: number, month: number) => {
    setSelectedDate(new Date(year, month - 1, 1))
  }, [])

  // ---- Press handlers (wired by Plans 04 and 05) ----------------------------

  const handleAppointmentPress = useCallback((_appointment: Appointment) => {
    // Plan 05 (AppointmentSheet) will wire this
    console.log('appointment pressed:', _appointment.id)
  }, [])

  const handleSlotPress = useCallback((_time: string, _date?: string) => {
    // Plan 04 (BookingSheet) will wire this
    console.log('slot pressed:', _time, _date)
  }, [])

  // ---- Render ---------------------------------------------------------------

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Segmented view switcher */}
      <SegmentedControl value={view} onChange={setView} />

      {/* Date navigation header */}
      <DateHeader
        date={selectedDate}
        view={view}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      {/* Loading indicator (non-blocking — overlays during refresh) */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={theme.primary}
          style={styles.loader}
        />
      )}

      {/* Calendar views */}
      <View style={styles.viewContainer}>
        {view === 'month' && (
          <MonthView
            selectedDate={toDateString(selectedDate)}
            appointments={appointments}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
          />
        )}

        {view === 'week' && (
          <WeekView
            weekStartDate={weekStart(selectedDate)}
            appointments={appointments}
            slotMinutes={slotMinutes}
            gridStartHHMM={GRID_START}
            gridEndHHMM={GRID_END}
            onSlotPress={(date, time) => handleSlotPress(time, date)}
            onAppointmentPress={handleAppointmentPress}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}

        {view === 'day' && (
          <DayView
            date={selectedDate}
            appointments={appointments}
            slotMinutes={slotMinutes}
            gridStartHHMM={GRID_START}
            gridEndHHMM={GRID_END}
            workStartMinutes={workStartMinutes}
            onSlotPress={handleSlotPress}
            onAppointmentPress={handleAppointmentPress}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    zIndex: 20,
  },
  viewContainer: {
    flex: 1,
  },
})
