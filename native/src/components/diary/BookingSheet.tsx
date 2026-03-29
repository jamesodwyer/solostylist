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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import { searchClients } from '@/lib/actions/clients'
import { getServicesByCategory } from '@/lib/actions/services'
import {
  createAppointment,
  isWithinWorkingHours,
} from '@/lib/actions/appointments'
import { formatPennies } from '@/lib/actions/payments'
import { ClientNotesPreview } from './ClientNotesPreview'
import type { Client, Service, WorkingHours } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'client' | 'services' | 'confirm'

interface CategorySection {
  category: string
  services: Service[]
}

interface BookingSheetProps {
  initialDate: Date
  initialTime?: string   // "HH:MM" — from slot tap; defaults to 09:00 if absent
  workingHours: WorkingHours
  slotMinutes: number
  onBooked: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatTime(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function buildISOString(date: Date, timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function addMinutes(date: Date, timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m + minutes, 0, 0)
  return formatTime(d)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BookingSheet = forwardRef<BottomSheetModal, BookingSheetProps>(
  function BookingSheet(
    { initialDate, initialTime = '09:00', workingHours, slotMinutes, onBooked },
    ref
  ) {
    const { theme } = useTheme()

    // Step state
    const [step, setStep] = useState<Step>('client')
    const [selectedClient, setSelectedClient] = useState<Client | null>(null)
    const [selectedServices, setSelectedServices] = useState<Service[]>([])
    const [bookingNotes, setBookingNotes] = useState('')
    const [overrideHours, setOverrideHours] = useState(false)

    // Client search state
    const [searchQuery, setSearchQuery] = useState('')
    const [clientResults, setClientResults] = useState<Client[]>([])
    const [clientLoading, setClientLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Services state
    const [categorySections, setCategorySections] = useState<CategorySection[]>([])
    const [servicesLoading, setServicesLoading] = useState(false)

    // Booking state
    const [booking, setBooking] = useState(false)

    // Working hours warning
    const totalDuration = selectedServices.reduce(
      (sum, s) => sum + s.duration_minutes,
      0
    )
    const endTime = addMinutes(initialDate, initialTime, totalDuration || slotMinutes)
    const startsAtISO = buildISOString(initialDate, initialTime)
    const endsAtISO = buildISOString(initialDate, endTime)
    const hoursCheck = isWithinWorkingHours(startsAtISO, endsAtISO, workingHours)

    // Reset on sheet open
    const handleSheetOpen = useCallback(() => {
      setStep('client')
      setSelectedClient(null)
      setSelectedServices([])
      setBookingNotes('')
      setOverrideHours(false)
      setSearchQuery('')
      setClientResults([])
    }, [])

    // ---------------------------------------------------------------------------
    // Client search (debounced)
    // ---------------------------------------------------------------------------

    const runSearch = useCallback(async (q: string) => {
      setClientLoading(true)
      try {
        const results = await searchClients(q)
        setClientResults(results)
      } catch {
        setClientResults([])
      } finally {
        setClientLoading(false)
      }
    }, [])

    useEffect(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        runSearch(searchQuery)
      }, 300)
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
      }
    }, [searchQuery, runSearch])

    // Load initial client list when on step 'client'
    useEffect(() => {
      if (step === 'client' && clientResults.length === 0 && !searchQuery) {
        runSearch('')
      }
    }, [step])

    // ---------------------------------------------------------------------------
    // Services loading
    // ---------------------------------------------------------------------------

    const loadServices = useCallback(async () => {
      if (categorySections.length > 0) return // already loaded
      setServicesLoading(true)
      try {
        const map = await getServicesByCategory()
        const sections: CategorySection[] = []
        map.forEach((services, category) => {
          sections.push({ category, services: services.filter(s => s.is_active) })
        })
        setCategorySections(sections)
      } catch {
        setCategorySections([])
      } finally {
        setServicesLoading(false)
      }
    }, [categorySections.length])

    useEffect(() => {
      if (step === 'services') loadServices()
    }, [step, loadServices])

    // ---------------------------------------------------------------------------
    // Booking submission
    // ---------------------------------------------------------------------------

    const handleConfirmBooking = useCallback(
      async (forceOverride?: boolean) => {
        if (!selectedClient || selectedServices.length === 0) return
        setBooking(true)

        const result = await createAppointment({
          client_id: selectedClient.id,
          starts_at: startsAtISO,
          ends_at: endsAtISO,
          notes: bookingNotes.trim() || undefined,
          override_working_hours: forceOverride ?? overrideHours,
          services: selectedServices.map(s => ({
            service_id: s.id,
            service_name: s.name,
            service_price: s.price,
            service_duration_minutes: s.duration_minutes,
          })),
        })

        setBooking(false)

        if (result.warning) {
          Alert.alert(
            'Outside Working Hours',
            result.warning,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Book anyway',
                onPress: () => handleConfirmBooking(true),
              },
            ]
          )
          return
        }

        if (result.error) {
          Alert.alert('Booking Failed', result.error)
          return
        }

        if (result.success) {
          ;(ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()
          onBooked()
        }
      },
      [
        selectedClient,
        selectedServices,
        startsAtISO,
        endsAtISO,
        bookingNotes,
        overrideHours,
        onBooked,
        ref,
      ]
    )

    // ---------------------------------------------------------------------------
    // Render helpers
    // ---------------------------------------------------------------------------

    const styles = makeStyles(theme)

    const renderStepIndicator = () => (
      <View style={styles.stepIndicator}>
        {(['client', 'services', 'confirm'] as Step[]).map((s, i) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              step === s && styles.stepDotActive,
              { backgroundColor: step === s ? theme.primary : theme.border },
            ]}
          />
        ))}
      </View>
    )

    const renderHeader = (title: string) => (
      <View style={styles.header}>
        {step !== 'client' && (
          <TouchableOpacity
            onPress={() => setStep(step === 'confirm' ? 'services' : 'client')}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Text style={[typography.bodySm, { color: theme.primary }]}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={[typography.h3, { color: theme.text, flex: 1, textAlign: 'center' }]}>
          {title}
        </Text>
        {renderStepIndicator()}
      </View>
    )

    // ---------------------------------------------------------------------------
    // Step 1: Select Client
    // ---------------------------------------------------------------------------

    const renderClientStep = () => (
      <>
        {renderHeader('Select Client')}
        <View style={styles.searchContainer}>
          <TextInput
            style={[
              styles.searchInput,
              typography.body,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.inputText,
              },
            ]}
            placeholder="Search clients..."
            placeholderTextColor={theme.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        {clientLoading ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: spacing.md }}
          />
        ) : (
          <BottomSheetFlatList
            data={clientResults}
            keyExtractor={(item: Client) => item.id}
            renderItem={({ item }: { item: Client }) => (
              <TouchableOpacity
                style={[styles.clientRow, { borderBottomColor: theme.borderLight }]}
                onPress={() => {
                  setSelectedClient(item)
                  setStep('services')
                }}
                accessibilityRole="button"
              >
                <Text style={[typography.bodyMedium, { color: theme.text }]}>
                  {item.first_name} {item.last_name ?? ''}
                </Text>
                {item.phone ? (
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>
                    {item.phone}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[typography.bodySm, { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
                No clients found
              </Text>
            }
          />
        )}
      </>
    )

    // ---------------------------------------------------------------------------
    // Step 2: Select Services
    // ---------------------------------------------------------------------------

    const toggleService = (service: Service) => {
      setSelectedServices(prev =>
        prev.some(s => s.id === service.id)
          ? prev.filter(s => s.id !== service.id)
          : [...prev, service]
      )
    }

    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

    const serviceSectionsFlat: Array<{ type: 'header'; title: string } | { type: 'service'; service: Service }> =
      categorySections.flatMap(section => [
        { type: 'header' as const, title: section.category },
        ...section.services.map(s => ({ type: 'service' as const, service: s })),
      ])

    const renderServicesStep = () => (
      <>
        {renderHeader('Select Services')}
        {/* Client notes compact card */}
        {selectedClient && (
          <View style={styles.notesCardContainer}>
            <ClientNotesPreview clientId={selectedClient.id} />
          </View>
        )}
        {servicesLoading ? (
          <ActivityIndicator
            size="small"
            color={theme.primary}
            style={{ marginTop: spacing.md }}
          />
        ) : (
          <BottomSheetFlatList
            data={serviceSectionsFlat}
            keyExtractor={(item: typeof serviceSectionsFlat[number], index: number) =>
              item.type === 'header' ? `header-${item.title}` : `service-${item.service.id}`
            }
            renderItem={({ item }: { item: typeof serviceSectionsFlat[number] }) => {
              if (item.type === 'header') {
                return (
                  <Text
                    style={[
                      typography.captionMedium,
                      styles.categoryHeader,
                      { color: theme.textTertiary, backgroundColor: theme.surface },
                    ]}
                  >
                    {item.title.toUpperCase()}
                  </Text>
                )
              }
              const { service } = item
              const isSelected = selectedServices.some(s => s.id === service.id)
              return (
                <TouchableOpacity
                  style={[
                    styles.serviceRow,
                    { borderBottomColor: theme.borderLight },
                    isSelected && { backgroundColor: theme.primaryLight },
                  ]}
                  onPress={() => toggleService(service)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={[typography.bodyMedium, { color: theme.text }]}>
                      {service.name}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textSecondary }]}>
                      {formatDuration(service.duration_minutes)}
                    </Text>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text style={[typography.bodyMedium, { color: theme.text }]}>
                      {formatPennies(service.price)}
                    </Text>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: isSelected ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Text style={[typography.caption, { color: theme.textInverse }]}>
                          ✓
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[typography.bodySm, { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
                No services available
              </Text>
            }
          />
        )}
        {/* Running totals bar */}
        <View style={[styles.totalsBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={styles.totalsRow}>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'}
            </Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>
              {formatDuration(totalDuration)}
            </Text>
            <Text style={[typography.bodySmMedium, { color: theme.text }]}>
              {formatPennies(totalPrice)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.nextButton,
              {
                backgroundColor:
                  selectedServices.length === 0 ? theme.buttonDisabled : theme.buttonPrimary,
              },
            ]}
            onPress={() => setStep('confirm')}
            disabled={selectedServices.length === 0}
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedServices.length === 0 }}
          >
            <Text
              style={[
                typography.button,
                {
                  color:
                    selectedServices.length === 0
                      ? theme.buttonDisabledText
                      : theme.buttonPrimaryText,
                },
              ]}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </>
    )

    // ---------------------------------------------------------------------------
    // Step 3: Confirm & Book
    // ---------------------------------------------------------------------------

    const renderConfirmStep = () => {
      const dateStr = initialDate.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

      return (
        <>
          {renderHeader('Confirm & Book')}
          <BottomSheetScrollView contentContainerStyle={styles.listContent}>
            {/* Booking summary card */}
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>Client</Text>
                <Text style={[typography.bodyMedium, { color: theme.text }]}>
                  {selectedClient?.first_name} {selectedClient?.last_name ?? ''}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowBorder, { borderTopColor: theme.borderLight }]}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>Date</Text>
                <Text style={[typography.bodyMedium, { color: theme.text }]}>{dateStr}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowBorder, { borderTopColor: theme.borderLight }]}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>Time</Text>
                <Text style={[typography.bodyMedium, { color: theme.text }]}>
                  {initialTime} — {endTime}
                </Text>
              </View>
            </View>

            {/* Services list */}
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {selectedServices.map((service, index) => (
                <View
                  key={service.id}
                  style={[
                    styles.summaryRow,
                    index > 0 && styles.summaryRowBorder,
                    index > 0 && { borderTopColor: theme.borderLight },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodySm, { color: theme.text }]}>{service.name}</Text>
                    <Text style={[typography.caption, { color: theme.textSecondary }]}>
                      {formatDuration(service.duration_minutes)}
                    </Text>
                  </View>
                  <Text style={[typography.bodySmMedium, { color: theme.text }]}>
                    {formatPennies(service.price)}
                  </Text>
                </View>
              ))}
              <View style={[styles.summaryRow, styles.summaryRowBorder, { borderTopColor: theme.border }]}>
                <Text style={[typography.bodyMedium, { color: theme.text }]}>Total</Text>
                <Text style={[typography.h3, { color: theme.text }]}>
                  {formatPennies(totalPrice)}
                </Text>
              </View>
            </View>

            {/* Working hours warning */}
            {!hoursCheck.valid && (
              <View style={[styles.warningBanner, { backgroundColor: theme.warningLight, borderColor: theme.warning }]}>
                <Text style={[typography.bodySm, { color: theme.warning }]}>
                  {hoursCheck.reason}
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
                    Book anyway
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Notes input */}
            <View style={styles.notesContainer}>
              <Text style={[typography.bodySmMedium, { color: theme.text, marginBottom: spacing.xs }]}>
                Notes (optional)
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  typography.bodySm,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  },
                ]}
                placeholder="Add booking notes..."
                placeholderTextColor={theme.inputPlaceholder}
                value={bookingNotes}
                onChangeText={setBookingNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                {
                  backgroundColor:
                    booking || (!hoursCheck.valid && !overrideHours)
                      ? theme.buttonDisabled
                      : theme.buttonPrimary,
                },
              ]}
              onPress={() => handleConfirmBooking()}
              disabled={booking || (!hoursCheck.valid && !overrideHours)}
              accessibilityRole="button"
            >
              {booking ? (
                <ActivityIndicator color={theme.buttonPrimaryText} size="small" />
              ) : (
                <Text style={[typography.button, { color: theme.buttonPrimaryText }]}>
                  Confirm Booking
                </Text>
              )}
            </TouchableOpacity>
          </BottomSheetScrollView>
        </>
      )
    }

    // ---------------------------------------------------------------------------
    // Main render
    // ---------------------------------------------------------------------------

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['85%']}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.border }}
        onDismiss={handleSheetOpen}
      >
        {step === 'client' && renderClientStep()}
        {step === 'services' && renderServicesStep()}
        {step === 'confirm' && renderConfirmStep()}
      </BottomSheetModal>
    )
  }
)

// ---------------------------------------------------------------------------
// Styles factory
// ---------------------------------------------------------------------------

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      position: 'relative',
    },
    backButton: {
      position: 'absolute',
      left: spacing.md,
      zIndex: 1,
      paddingVertical: spacing.xs,
    },
    stepIndicator: {
      flexDirection: 'row',
      gap: spacing.xs,
      justifyContent: 'center',
      width: '100%',
    },
    stepDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    stepDotActive: {
      width: 18,
    },
    searchContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    searchInput: {
      height: 44,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
    },
    listContent: {
      paddingBottom: spacing.xxl,
    },
    clientRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    notesCardContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    categoryHeader: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      letterSpacing: 0.5,
    },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    serviceInfo: {
      flex: 1,
      gap: spacing.xxs,
    },
    serviceRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totalsBar: {
      borderTopWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nextButton: {
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      overflow: 'hidden',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    summaryRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    warningBanner: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
    },
    overrideRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    notesContainer: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    notesInput: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      minHeight: 80,
    },
    confirmButton: {
      marginHorizontal: spacing.md,
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
  })
}
