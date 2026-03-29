import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import {
  updateAppointmentStatus,
  updateAppointmentNotes,
  rescheduleAppointment,
  isWithinWorkingHours,
} from '@/lib/actions/appointments'
import { recordPayment, formatPennies } from '@/lib/actions/payments'
import type { Appointment, AppointmentService, AppointmentStatus, PaymentMethod, WorkingHours } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentSheetProps {
  appointment: Appointment | null
  workingHours: WorkingHours | null | undefined
  onUpdated: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatAppointmentDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatAppointmentTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return `${formatTime(start)} — ${formatTime(end)}`
}

function calcTotalPrice(services: AppointmentService[]): number {
  return services.reduce((sum, s) => sum + s.service_price, 0)
}

function calcTotalDuration(services: AppointmentService[]): number {
  return services.reduce((sum, s) => sum + s.service_duration_minutes, 0)
}

function statusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'booked': return 'Booked'
    case 'completed': return 'Completed'
    case 'cancelled': return 'Cancelled'
    case 'no_show': return 'No Show'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AppointmentSheet = forwardRef<BottomSheetModal, AppointmentSheetProps>(
  function AppointmentSheet({ appointment, workingHours, onUpdated }, ref) {
    const { theme } = useTheme()

    // UI state
    const [actionLoading, setActionLoading] = useState<string | null>(null) // which button is loading
    const [notes, setNotes] = useState('')
    const [notesChanged, setNotesChanged] = useState(false)
    const [savingNotes, setSavingNotes] = useState(false)

    // Reschedule state
    const [showReschedule, setShowReschedule] = useState(false)
    const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date())
    const [rescheduleTime, setRescheduleTime] = useState<Date>(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)
    const [datePickerStep, setDatePickerStep] = useState<'date' | 'time'>('date')
    const [rescheduleLoading, setRescheduleLoading] = useState(false)
    const [overrideHours, setOverrideHours] = useState(false)
    const [rescheduleWarning, setRescheduleWarning] = useState<string | null>(null)

    // Payment state
    const [showPayment, setShowPayment] = useState(false)
    const [paymentLoading, setPaymentLoading] = useState<PaymentMethod | null>(null)
    const [paymentDone, setPaymentDone] = useState(false)

    // Sync notes when appointment changes
    useEffect(() => {
      if (appointment) {
        setNotes(appointment.notes ?? '')
        setNotesChanged(false)
        setShowReschedule(false)
        setShowPayment(false)
        setPaymentDone(false)
        setRescheduleWarning(null)
        setOverrideHours(false)
        // Initialise reschedule date/time from appointment
        const startDate = new Date(appointment.starts_at)
        setRescheduleDate(startDate)
        setRescheduleTime(startDate)
      }
    }, [appointment?.id])

    // ---------------------------------------------------------------------------
    // Status actions
    // ---------------------------------------------------------------------------

    const handleStatusChange = useCallback(
      async (newStatus: AppointmentStatus) => {
        if (!appointment) return
        setActionLoading(newStatus)
        const result = await updateAppointmentStatus(appointment.id, newStatus)
        setActionLoading(null)
        if (result.error) {
          Alert.alert('Error', result.error)
          return
        }
        ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
        onUpdated()
      },
      [appointment, onUpdated, ref]
    )

    const handleCancel = useCallback(() => {
      Alert.alert(
        'Cancel Appointment',
        'Are you sure you want to cancel this appointment?',
        [
          { text: 'Keep', style: 'cancel' },
          {
            text: 'Cancel Appointment',
            style: 'destructive',
            onPress: () => handleStatusChange('cancelled'),
          },
        ]
      )
    }, [handleStatusChange])

    // ---------------------------------------------------------------------------
    // Notes save
    // ---------------------------------------------------------------------------

    const handleSaveNotes = useCallback(async () => {
      if (!appointment) return
      setSavingNotes(true)
      const result = await updateAppointmentNotes(appointment.id, notes)
      setSavingNotes(false)
      if (result.error) {
        Alert.alert('Error', result.error)
        return
      }
      setNotesChanged(false)
      onUpdated()
    }, [appointment, notes, onUpdated])

    // ---------------------------------------------------------------------------
    // Reschedule
    // ---------------------------------------------------------------------------

    const computeRescheduleISO = useCallback(
      (services: AppointmentService[]) => {
        const d = new Date(rescheduleDate)
        d.setHours(rescheduleTime.getHours(), rescheduleTime.getMinutes(), 0, 0)
        const newStartsAt = d.toISOString()

        const totalDuration = calcTotalDuration(services)
        const endD = new Date(d)
        endD.setMinutes(endD.getMinutes() + totalDuration)
        const newEndsAt = endD.toISOString()

        return { newStartsAt, newEndsAt }
      },
      [rescheduleDate, rescheduleTime]
    )

    const handleConfirmReschedule = useCallback(
      async (force?: boolean) => {
        if (!appointment) return
        const services = appointment.appointment_services ?? []
        const { newStartsAt, newEndsAt } = computeRescheduleISO(services)

        // Working hours pre-validation
        if (!force && workingHours) {
          const check = isWithinWorkingHours(newStartsAt, newEndsAt, workingHours)
          if (!check.valid) {
            setRescheduleWarning(check.reason ?? 'Outside working hours')
            return
          }
        }

        setRescheduleLoading(true)
        const result = await rescheduleAppointment({
          appointment_id: appointment.id,
          new_starts_at: newStartsAt,
          new_ends_at: newEndsAt,
          override_working_hours: force ?? overrideHours,
        })
        setRescheduleLoading(false)

        if (result.warning) {
          setRescheduleWarning(result.warning)
          return
        }

        if (result.error) {
          if (result.error.includes('overlap') || result.error.includes('23P01')) {
            Alert.alert('Time Unavailable', 'The new time overlaps an existing appointment. Please choose a different time.')
          } else {
            Alert.alert('Error', result.error)
          }
          return
        }

        setShowReschedule(false)
        ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
        onUpdated()
      },
      [appointment, computeRescheduleISO, overrideHours, ref, workingHours, onUpdated]
    )

    // ---------------------------------------------------------------------------
    // Payment
    // ---------------------------------------------------------------------------

    const handleTakePayment = useCallback(
      async (method: PaymentMethod) => {
        if (!appointment) return
        const services = appointment.appointment_services ?? []
        const total = calcTotalPrice(services)

        setPaymentLoading(method)
        try {
          await recordPayment({
            appointmentId: appointment.id,
            clientId: appointment.client_id,
            amount: total,
            method,
          })
          setPaymentLoading(null)
          setPaymentDone(true)
          onUpdated()
        } catch (err: unknown) {
          setPaymentLoading(null)
          const message = err instanceof Error ? err.message : 'Payment failed'
          Alert.alert('Payment Error', message)
        }
      },
      [appointment, onUpdated]
    )

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    const styles = makeStyles(theme)

    if (!appointment) {
      return (
        <BottomSheetModal
          ref={ref}
          snapPoints={['70%']}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: theme.background }}
          handleIndicatorStyle={{ backgroundColor: theme.border }}
        >
          <View style={styles.emptyState}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>
              No appointment selected
            </Text>
          </View>
        </BottomSheetModal>
      )
    }

    const services = appointment.appointment_services ?? []
    const totalPrice = calcTotalPrice(services)
    const totalDuration = calcTotalDuration(services)
    const clientName = appointment.clients
      ? `${appointment.clients.first_name} ${appointment.clients.last_name ?? ''}`.trim()
      : 'Unknown Client'

    const statusColors: Record<AppointmentStatus, { bg: string; text: string }> = {
      booked: { bg: theme.primaryLight, text: theme.primary },
      completed: { bg: theme.successLight, text: theme.success },
      cancelled: { bg: theme.errorLight, text: theme.error },
      no_show: { bg: theme.warningLight, text: theme.warning },
    }
    const statusColor = statusColors[appointment.status]

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['70%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.h2, { color: theme.text }]} numberOfLines={1}>
              {clientName}
            </Text>
            <Text style={[typography.bodySm, { color: theme.textSecondary, marginTop: spacing.xxs }]}>
              {formatAppointmentDate(appointment.starts_at)}
            </Text>
            <Text style={[typography.bodySm, { color: theme.textSecondary }]}>
              {formatAppointmentTime(appointment.starts_at, appointment.ends_at)}
            </Text>

            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor.bg },
              ]}
            >
              <Text style={[typography.captionMedium, { color: statusColor.text }]}>
                {statusLabel(appointment.status)}
              </Text>
            </View>
          </View>

          {/* Services list */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[typography.bodySmMedium, styles.cardTitle, { color: theme.textSecondary }]}>
              SERVICES
            </Text>
            {services.length === 0 ? (
              <Text style={[typography.bodySm, { color: theme.textTertiary, paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
                No services recorded
              </Text>
            ) : (
              <>
                {services.map((svc, idx) => (
                  <View
                    key={svc.id}
                    style={[
                      styles.serviceRow,
                      idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.borderLight },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodySm, { color: theme.text }]}>{svc.service_name}</Text>
                      <Text style={[typography.caption, { color: theme.textSecondary }]}>
                        {formatDuration(svc.service_duration_minutes)}
                      </Text>
                    </View>
                    <Text style={[typography.bodySmMedium, { color: theme.text }]}>
                      {formatPennies(svc.service_price)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.serviceRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                  <Text style={[typography.bodyMedium, { color: theme.text, flex: 1 }]}>
                    Total — {formatDuration(totalDuration)}
                  </Text>
                  <Text style={[typography.h3, { color: theme.text }]}>
                    {formatPennies(totalPrice)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Notes */}
          <View style={styles.notesContainer}>
            <Text style={[typography.bodySmMedium, { color: theme.text, marginBottom: spacing.xs }]}>
              Notes
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                typography.bodySm,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: notesChanged ? theme.inputBorderFocus : theme.inputBorder,
                  color: theme.inputText,
                },
              ]}
              placeholder="Add appointment notes..."
              placeholderTextColor={theme.inputPlaceholder}
              value={notes}
              onChangeText={(t) => {
                setNotes(t)
                setNotesChanged(t !== (appointment.notes ?? ''))
              }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {notesChanged && (
              <TouchableOpacity
                style={[
                  styles.saveNotesButton,
                  { backgroundColor: savingNotes ? theme.buttonDisabled : theme.buttonPrimary },
                ]}
                onPress={handleSaveNotes}
                disabled={savingNotes}
                accessibilityRole="button"
              >
                {savingNotes ? (
                  <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                ) : (
                  <Text style={[typography.button, { color: theme.buttonPrimaryText }]}>
                    Save Notes
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Status actions */}
          <View style={styles.actionsSection}>
            <Text style={[typography.bodySmMedium, { color: theme.text, marginBottom: spacing.sm }]}>
              Actions
            </Text>

            {appointment.status === 'booked' && (
              <>
                {/* Complete */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: actionLoading === 'completed' ? theme.buttonDisabled : theme.success },
                  ]}
                  onPress={() => handleStatusChange('completed')}
                  disabled={actionLoading !== null}
                  accessibilityRole="button"
                >
                  {actionLoading === 'completed' ? (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  ) : (
                    <Text style={[typography.button, { color: '#FFFFFF' }]}>Mark Complete</Text>
                  )}
                </TouchableOpacity>

                {/* No Show */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: actionLoading === 'no_show' ? theme.buttonDisabled : theme.warning },
                  ]}
                  onPress={() => handleStatusChange('no_show')}
                  disabled={actionLoading !== null}
                  accessibilityRole="button"
                >
                  {actionLoading === 'no_show' ? (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  ) : (
                    <Text style={[typography.button, { color: '#FFFFFF' }]}>No Show</Text>
                  )}
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: actionLoading === 'cancelled' ? theme.buttonDisabled : theme.buttonSecondary },
                  ]}
                  onPress={handleCancel}
                  disabled={actionLoading !== null}
                  accessibilityRole="button"
                >
                  {actionLoading === 'cancelled' ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <Text style={[typography.button, { color: theme.buttonSecondaryText }]}>Cancel Appointment</Text>
                  )}
                </TouchableOpacity>

                {/* Reschedule toggle */}
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.buttonSecondary }]}
                  onPress={() => setShowReschedule(!showReschedule)}
                  accessibilityRole="button"
                >
                  <Text style={[typography.button, { color: theme.buttonSecondaryText }]}>
                    {showReschedule ? 'Hide Reschedule' : 'Reschedule'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {appointment.status === 'completed' && (
              <>
                {/* Re-open */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: actionLoading === 'booked' ? theme.buttonDisabled : theme.buttonSecondary },
                  ]}
                  onPress={() => handleStatusChange('booked')}
                  disabled={actionLoading !== null}
                  accessibilityRole="button"
                >
                  {actionLoading === 'booked' ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : (
                    <Text style={[typography.button, { color: theme.buttonSecondaryText }]}>Re-open</Text>
                  )}
                </TouchableOpacity>

                {/* Take Payment */}
                {!paymentDone && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.buttonPrimary },
                    ]}
                    onPress={() => setShowPayment(!showPayment)}
                    accessibilityRole="button"
                  >
                    <Text style={[typography.button, { color: theme.buttonPrimaryText }]}>
                      {showPayment ? 'Hide Payment' : `Take Payment — ${formatPennies(totalPrice)}`}
                    </Text>
                  </TouchableOpacity>
                )}

                {paymentDone && (
                  <View style={[styles.successBanner, { backgroundColor: theme.successLight, borderColor: theme.success }]}>
                    <Text style={[typography.bodySm, { color: theme.success }]}>
                      Payment recorded successfully
                    </Text>
                  </View>
                )}
              </>
            )}

            {(appointment.status === 'cancelled' || appointment.status === 'no_show') && (
              /* Re-open */
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: actionLoading === 'booked' ? theme.buttonDisabled : theme.buttonSecondary },
                ]}
                onPress={() => handleStatusChange('booked')}
                disabled={actionLoading !== null}
                accessibilityRole="button"
              >
                {actionLoading === 'booked' ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Text style={[typography.button, { color: theme.buttonSecondaryText }]}>Re-open</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Payment sub-view */}
          {showPayment && appointment.status === 'completed' && !paymentDone && (
            <View style={[styles.subPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[typography.bodyMedium, { color: theme.text, marginBottom: spacing.xs }]}>
                Select payment method
              </Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginBottom: spacing.md }]}>
                Total: {formatPennies(totalPrice)}
              </Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    {
                      backgroundColor: paymentLoading === 'cash' ? theme.buttonDisabled : theme.buttonPrimary,
                      flex: 1,
                    },
                  ]}
                  onPress={() => handleTakePayment('cash')}
                  disabled={paymentLoading !== null}
                  accessibilityRole="button"
                >
                  {paymentLoading === 'cash' ? (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  ) : (
                    <Text style={[typography.button, { color: theme.buttonPrimaryText }]}>Cash</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentButton,
                    {
                      backgroundColor: paymentLoading === 'card' ? theme.buttonDisabled : theme.buttonPrimary,
                      flex: 1,
                    },
                  ]}
                  onPress={() => handleTakePayment('card')}
                  disabled={paymentLoading !== null}
                  accessibilityRole="button"
                >
                  {paymentLoading === 'card' ? (
                    <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                  ) : (
                    <Text style={[typography.button, { color: theme.buttonPrimaryText }]}>Card</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reschedule sub-view */}
          {showReschedule && appointment.status === 'booked' && (
            <View style={[styles.subPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[typography.bodyMedium, { color: theme.text, marginBottom: spacing.sm }]}>
                Reschedule
              </Text>

              {/* Date picker */}
              {Platform.OS === 'ios' ? (
                <>
                  <Text style={[typography.bodySm, { color: theme.textSecondary, marginBottom: spacing.xs }]}>
                    New Date
                  </Text>
                  <DateTimePicker
                    value={rescheduleDate}
                    mode="date"
                    display="inline"
                    onChange={(_event, date) => {
                      if (date) setRescheduleDate(date)
                    }}
                    minimumDate={new Date()}
                    style={{ alignSelf: 'stretch' }}
                  />
                  <Text style={[typography.bodySm, { color: theme.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs }]}>
                    New Time
                  </Text>
                  <DateTimePicker
                    value={rescheduleTime}
                    mode="time"
                    display="inline"
                    onChange={(_event, time) => {
                      if (time) setRescheduleTime(time)
                    }}
                    minuteInterval={15}
                    style={{ alignSelf: 'stretch' }}
                  />
                </>
              ) : (
                // Android: native dialog, sequential date then time
                <>
                  <TouchableOpacity
                    style={[styles.androidPickerButton, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground }]}
                    onPress={() => {
                      setDatePickerStep('date')
                      setShowDatePicker(true)
                    }}
                  >
                    <Text style={[typography.body, { color: theme.inputText }]}>
                      {rescheduleDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.androidPickerButton, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, marginTop: spacing.sm }]}
                    onPress={() => {
                      setDatePickerStep('time')
                      setShowTimePicker(true)
                    }}
                  >
                    <Text style={[typography.body, { color: theme.inputText }]}>
                      {formatTime(rescheduleTime)}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={rescheduleDate}
                      mode="date"
                      display="default"
                      onChange={(_event, date) => {
                        setShowDatePicker(false)
                        if (date) setRescheduleDate(date)
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={rescheduleTime}
                      mode="time"
                      display="default"
                      onChange={(_event, time) => {
                        setShowTimePicker(false)
                        if (time) setRescheduleTime(time)
                      }}
                      minuteInterval={15}
                    />
                  )}
                </>
              )}

              {/* Working hours warning */}
              {rescheduleWarning && (
                <View style={[styles.warningBanner, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}>
                  <Text style={[typography.bodySm, { color: theme.warning }]}>
                    {rescheduleWarning}
                  </Text>
                  <TouchableOpacity
                    style={styles.overrideRow}
                    onPress={() => setOverrideHours(!overrideHours)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: overrideHours }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: overrideHours ? theme.warning : theme.border,
                          backgroundColor: overrideHours ? theme.warning : 'transparent',
                        },
                      ]}
                    >
                      {overrideHours && (
                        <Text style={[typography.caption, { color: theme.textInverse }]}>✓</Text>
                      )}
                    </View>
                    <Text style={[typography.bodySm, { color: theme.text, marginLeft: spacing.sm }]}>
                      Reschedule anyway
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Confirm reschedule button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: rescheduleLoading ? theme.buttonDisabled : theme.buttonPrimary,
                    marginTop: spacing.md,
                  },
                ]}
                onPress={() => handleConfirmReschedule(overrideHours && rescheduleWarning ? true : undefined)}
                disabled={rescheduleLoading}
                accessibilityRole="button"
              >
                {rescheduleLoading ? (
                  <ActivityIndicator size="small" color={theme.buttonPrimaryText} />
                ) : (
                  <Text style={[typography.button, { color: theme.buttonPrimaryText }]}>
                    Confirm Reschedule
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom padding */}
          <View style={{ height: spacing.xxl }} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  }
)

// ---------------------------------------------------------------------------
// Styles factory
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      gap: spacing.xxs,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xxs,
      borderRadius: radius.full,
      marginTop: spacing.xs,
    },
    card: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardTitle: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      letterSpacing: 0.5,
    },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    notesContainer: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
    },
    notesInput: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      minHeight: 80,
    },
    saveNotesButton: {
      marginTop: spacing.sm,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionsSection: {
      marginHorizontal: spacing.md,
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    actionButton: {
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subPanel: {
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
    },
    paymentRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    paymentButton: {
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    androidPickerButton: {
      height: 44,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
    },
    warningBanner: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    overrideRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    successBanner: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
    },
  })
}
