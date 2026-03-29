import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useTheme } from '@/providers/ThemeProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { typography, spacing, radius } from '@/theme'
import {
  getService,
  createService,
  updateService,
  deleteService,
  getOrCreateCategory,
} from '@/lib/actions/services'
import type { ServiceWithCategory } from '@/lib/actions/services'

function penniesToDisplay(pennies: number): string {
  return (pennies / 100).toFixed(2)
}

function displayToPennies(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ''))
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

export default function ServiceFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const router = useRouter()
  const { theme } = useTheme()

  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [priceDisplay, setPriceDisplay] = useState('0.00')
  const [durationStr, setDurationStr] = useState('30')
  const [categoryName, setCategoryName] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Validation errors
  const [nameError, setNameError] = useState<string | undefined>()
  const [priceError, setPriceError] = useState<string | undefined>()
  const [durationError, setDurationError] = useState<string | undefined>()

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isNew ? 'New Service' : 'Edit Service',
    })
  }, [navigation, isNew])

  useEffect(() => {
    if (isNew) return
    let active = true
    setLoading(true)
    getService(id)
      .then((service: ServiceWithCategory | null) => {
        if (!active || !service) return
        setName(service.name)
        setPriceDisplay(penniesToDisplay(service.price))
        setDurationStr(String(service.duration_minutes))
        setCategoryName(service.service_categories?.name ?? '')
        setIsActive(service.is_active)
      })
      .catch(() => {
        if (active) Alert.alert('Error', 'Failed to load service.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id, isNew])

  const validate = useCallback((): boolean => {
    let valid = true

    if (!name.trim()) {
      setNameError('Name is required')
      valid = false
    } else {
      setNameError(undefined)
    }

    const pennies = displayToPennies(priceDisplay)
    if (pennies <= 0) {
      setPriceError('Price must be greater than £0.00')
      valid = false
    } else {
      setPriceError(undefined)
    }

    const duration = parseInt(durationStr, 10)
    if (isNaN(duration) || duration <= 0) {
      setDurationError('Duration must be greater than 0 minutes')
      valid = false
    } else {
      setDurationError(undefined)
    }

    return valid
  }, [name, priceDisplay, durationStr])

  const handleSave = async () => {
    if (!validate()) return

    setSaving(true)
    try {
      const pennies = displayToPennies(priceDisplay)
      const duration = parseInt(durationStr, 10)
      const categoryId = categoryName.trim()
        ? await getOrCreateCategory(categoryName.trim())
        : null

      if (isNew) {
        await createService({
          name: name.trim(),
          price: pennies,
          duration_minutes: duration,
          category_id: categoryId,
          is_active: isActive,
        })
      } else {
        await updateService(id, {
          name: name.trim(),
          price: pennies,
          duration_minutes: duration,
          category_id: categoryId,
          is_active: isActive,
        })
      }

      router.back()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save service.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await deleteService(id)
              router.back()
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete service.')
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Cut & Blow Dry"
          error={nameError}
          autoCapitalize="words"
          returnKeyType="next"
          containerStyle={styles.field}
        />

        <Input
          label="Price"
          value={priceDisplay}
          onChangeText={setPriceDisplay}
          onBlur={() => {
            const pennies = displayToPennies(priceDisplay)
            setPriceDisplay(penniesToDisplay(pennies))
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
          error={priceError}
          containerStyle={styles.field}
        />

        <View style={styles.field}>
          <Input
            label="Duration"
            value={durationStr}
            onChangeText={setDurationStr}
            placeholder="30"
            keyboardType="number-pad"
            error={durationError}
          />
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: spacing.xs }]}>
            minutes
          </Text>
        </View>

        <Input
          label="Category (optional)"
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder="e.g. Hair, Colour, Nails"
          autoCapitalize="words"
          returnKeyType="done"
          containerStyle={styles.field}
        />

        <View style={[styles.switchRow, { borderColor: theme.borderLight }]}>
          <View style={styles.switchLabel}>
            <Text style={[typography.bodyMedium, { color: theme.text }]}>
              Available for booking
            </Text>
            <Text style={[typography.bodySm, { color: theme.textSecondary }]}>
              {isActive ? 'Clients can book this service' : 'Hidden from booking'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: theme.buttonSecondary, true: theme.primary }}
            thumbColor={theme.card}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title={saving ? 'Saving...' : 'Save Service'}
            onPress={handleSave}
            loading={saving}
            disabled={saving || deleting}
          />

          {!isNew && (
            <Button
              title={deleting ? 'Deleting...' : 'Delete Service'}
              onPress={handleDelete}
              variant="ghost"
              loading={deleting}
              disabled={saving || deleting}
              style={styles.deleteButton}
              textStyle={{ color: theme.error }}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  field: {
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: 'transparent',
  },
})
