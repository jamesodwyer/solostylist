import React, { useRef, useEffect } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'
import {
  parseHHMM,
  autoScrollTarget,
  SLOT_HEIGHT_DP,
} from '@/lib/utils/timeGrid'
import { TimeGrid } from '@/components/diary/TimeGrid'
import type { Appointment } from '@/lib/types/database'

interface DayViewProps {
  date: Date
  appointments: Appointment[]
  slotMinutes: number
  gridStartHHMM: string
  gridEndHHMM: string
  workStartMinutes: number
  onSlotPress: (time: string) => void
  onAppointmentPress: (appointment: Appointment) => void
  onNext: () => void
  onPrev: () => void
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function DayView({
  date,
  appointments,
  slotMinutes,
  gridStartHHMM,
  gridEndHHMM,
  workStartMinutes,
  onSlotPress,
  onAppointmentPress,
  onNext,
  onPrev,
}: DayViewProps) {
  const scrollRef = useRef<ScrollView>(null)
  const today = isToday(date)

  // Auto-scroll to current time (today) or working hours start (other days)
  useEffect(() => {
    const gridStartMinutes = parseHHMM(gridStartHHMM)
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const targetMinutes = autoScrollTarget(today, nowMinutes, workStartMinutes)

    // Compute pixel target using slot height
    const minutesFromGridStart = targetMinutes - gridStartMinutes
    const targetPx = (minutesFromGridStart / slotMinutes) * SLOT_HEIGHT_DP

    // Delay to ensure layout is complete (RESEARCH.md Pitfall 4)
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, targetPx - 100), animated: false })
    }, 100)

    return () => clearTimeout(timer)
  }, [date, today, gridStartHHMM, slotMinutes, workStartMinutes])

  // Swipe gesture for day navigation
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
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={false}
        >
          <TimeGrid
            appointments={appointments}
            gridStartHHMM={gridStartHHMM}
            gridEndHHMM={gridEndHHMM}
            slotMinutes={slotMinutes}
            showTimeLabels={true}
            showCurrentTime={true}
            isToday={today}
            onSlotPress={onSlotPress}
            onAppointmentPress={onAppointmentPress}
          />
        </ScrollView>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
