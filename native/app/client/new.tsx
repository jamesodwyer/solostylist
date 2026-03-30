import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Screen, Button, Input } from '@/components/ui'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing } from '@/theme'
import { createClient } from '@/lib/actions/clients'

export default function NewClientScreen() {
  const { theme } = useTheme()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError('First name is required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const client = await createClient({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      router.replace(`/client/${client.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to create client')
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
          <Text style={[typography.h3, { color: theme.text }]}>New client</Text>
          <Button
            title="Save"
            onPress={handleSave}
            size="sm"
            loading={loading}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="First name"
            placeholder="Required"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            textContentType="givenName"
            autoFocus
          />
          <Input
            label="Last name"
            placeholder="Optional"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            textContentType="familyName"
            containerStyle={{ marginTop: spacing.md }}
          />
          <Input
            label="Phone"
            placeholder="Optional"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            containerStyle={{ marginTop: spacing.md }}
          />
          <Input
            label="Email"
            placeholder="Optional"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            containerStyle={{ marginTop: spacing.md }}
          />

          {error ? (
            <Text style={[typography.bodySm, { color: theme.error, marginTop: spacing.sm }]}>
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  form: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
})
