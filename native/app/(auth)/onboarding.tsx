import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import { Screen, Button, Input } from '@/components/ui'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import { completeOnboarding } from '@/lib/actions/profile'
import type { WorkingHours, DaySchedule } from '@/lib/types/database'

const DAY_LABELS: Record<keyof WorkingHours, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const DAY_KEYS: (keyof WorkingHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const DEFAULT_HOURS: WorkingHours = {
  mon: { enabled: false, start: '09:00', end: '17:00' },
  tue: { enabled: true, start: '09:00', end: '17:00' },
  wed: { enabled: true, start: '09:00', end: '17:00' },
  thu: { enabled: true, start: '09:00', end: '17:00' },
  fri: { enabled: true, start: '09:00', end: '17:00' },
  sat: { enabled: true, start: '09:00', end: '17:00' },
  sun: { enabled: false, start: '09:00', end: '17:00' },
}

const SLOT_OPTIONS = [15, 30, 45, 60] as const

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export default function OnboardingScreen() {
  const { theme } = useTheme()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [tradingName, setTradingName] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT_HOURS)
  const [editingTime, setEditingTime] = useState<{
    day: keyof WorkingHours
    field: 'start' | 'end'
  } | null>(null)

  // Step 3
  const [slotMinutes, setSlotMinutes] = useState(15)

  const progress = (step / 3) * 100

  const updateDay = (day: keyof WorkingHours, updates: Partial<DaySchedule>) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...updates },
    }))
  }

  const handleComplete = async () => {
    setError('')
    setLoading(true)
    try {
      await completeOnboarding({
        tradingName: tradingName.trim(),
        phone: phone.trim(),
        workingHours,
        defaultSlotMinutes: slotMinutes,
      })
      router.replace('/(tabs)')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.borderLight }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Business Info */}
          {step === 1 && (
            <View>
              <Text style={[typography.h2, { color: theme.text }]}>
                Your business
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: theme.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
                ]}
              >
                What's your business called?
              </Text>

              <Input
                label="Trading name"
                placeholder="e.g. Jane's Hair Studio"
                value={tradingName}
                onChangeText={setTradingName}
                autoCapitalize="words"
                textContentType="organizationName"
              />

              <Input
                label="Phone number (optional)"
                placeholder="e.g. 07700 900000"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                containerStyle={{ marginTop: spacing.md }}
              />

              <Button
                title="Next"
                onPress={() => {
                  if (!tradingName.trim()) {
                    setError('Please enter your business name')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                style={{ marginTop: spacing.xl }}
              />
            </View>
          )}

          {/* Step 2: Working Hours */}
          {step === 2 && (
            <View>
              <Text style={[typography.h2, { color: theme.text }]}>
                Working hours
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: theme.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
                ]}
              >
                Set your typical working days and hours
              </Text>

              {DAY_KEYS.map((day) => {
                const schedule = workingHours[day]
                return (
                  <View
                    key={day}
                    style={[
                      styles.dayRow,
                      { borderBottomColor: theme.borderLight },
                    ]}
                  >
                    <View style={styles.dayHeader}>
                      <Text style={[typography.bodyMedium, { color: theme.text, flex: 1 }]}>
                        {DAY_LABELS[day]}
                      </Text>
                      <Switch
                        value={schedule.enabled}
                        onValueChange={(val) => updateDay(day, { enabled: val })}
                        trackColor={{ false: theme.border, true: theme.primary }}
                      />
                    </View>

                    {schedule.enabled && (
                      <View style={styles.timeRow}>
                        <Pressable
                          onPress={() =>
                            setEditingTime(
                              editingTime?.day === day && editingTime.field === 'start'
                                ? null
                                : { day, field: 'start' }
                            )
                          }
                          style={[
                            styles.timeButton,
                            {
                              backgroundColor: theme.inputBackground,
                              borderColor:
                                editingTime?.day === day && editingTime.field === 'start'
                                  ? theme.primary
                                  : theme.inputBorder,
                            },
                          ]}
                        >
                          <Text style={[typography.body, { color: theme.text }]}>
                            {schedule.start}
                          </Text>
                        </Pressable>

                        <Text style={[typography.body, { color: theme.textSecondary, marginHorizontal: spacing.sm }]}>
                          to
                        </Text>

                        <Pressable
                          onPress={() =>
                            setEditingTime(
                              editingTime?.day === day && editingTime.field === 'end'
                                ? null
                                : { day, field: 'end' }
                            )
                          }
                          style={[
                            styles.timeButton,
                            {
                              backgroundColor: theme.inputBackground,
                              borderColor:
                                editingTime?.day === day && editingTime.field === 'end'
                                  ? theme.primary
                                  : theme.inputBorder,
                            },
                          ]}
                        >
                          <Text style={[typography.body, { color: theme.text }]}>
                            {schedule.end}
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {editingTime?.day === day && schedule.enabled && (
                      <DateTimePicker
                        value={timeStringToDate(schedule[editingTime.field])}
                        mode="time"
                        is24Hour
                        minuteInterval={30}
                        onChange={(_event, date) => {
                          if (date) {
                            updateDay(day, { [editingTime.field]: dateToTimeString(date) })
                          }
                        }}
                        display="spinner"
                      />
                    )}
                  </View>
                )
              })}

              <View style={styles.stepButtons}>
                <Button
                  title="Back"
                  onPress={() => setStep(1)}
                  variant="secondary"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title="Next"
                  onPress={() => setStep(3)}
                  style={{ flex: 1, marginLeft: spacing.sm }}
                />
              </View>
            </View>
          )}

          {/* Step 3: Slot Duration */}
          {step === 3 && (
            <View>
              <Text style={[typography.h2, { color: theme.text }]}>
                Appointment length
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: theme.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
                ]}
              >
                Choose your default time slot
              </Text>

              {SLOT_OPTIONS.map((mins) => (
                <Pressable
                  key={mins}
                  onPress={() => setSlotMinutes(mins)}
                  style={[
                    styles.slotOption,
                    {
                      backgroundColor:
                        slotMinutes === mins ? theme.primaryLight : theme.inputBackground,
                      borderColor:
                        slotMinutes === mins ? theme.primary : theme.inputBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: slotMinutes === mins }}
                >
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        color: slotMinutes === mins ? theme.primary : theme.text,
                      },
                    ]}
                  >
                    {mins} minutes
                  </Text>
                </Pressable>
              ))}

              {error ? (
                <Text style={[typography.bodySm, { color: theme.error, marginTop: spacing.sm }]}>
                  {error}
                </Text>
              ) : null}

              <View style={styles.stepButtons}>
                <Button
                  title="Back"
                  onPress={() => setStep(2)}
                  variant="secondary"
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title="Complete setup"
                  onPress={handleComplete}
                  loading={loading}
                  style={{ flex: 1, marginLeft: spacing.sm }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressTrack: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  dayRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  slotOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
  },
  stepButtons: {
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
})
