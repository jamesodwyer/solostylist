import React, { useState } from 'react'
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
import { useAuth } from '@/providers/AuthProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing } from '@/theme'

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    setError('')
    setLoading(true)
    const { error: authError } = await resetPassword(email.trim())
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <Screen>
        <View style={styles.successContent}>
          <Text style={[typography.h2, { color: theme.text, textAlign: 'center' }]}>
            Email sent
          </Text>
          <Text
            style={[
              typography.body,
              { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            If an account exists for {email}, you'll receive a password reset link.
          </Text>
          <Button
            title="Back to sign in"
            onPress={() => router.replace('/(auth)/login')}
            variant="secondary"
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[typography.h2, { color: theme.text }]}>
              Reset password
            </Text>
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.xs }]}>
              Enter your email and we'll send you a reset link
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            {error ? (
              <Text style={[typography.bodySm, { color: theme.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Send reset link"
              onPress={handleReset}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />

            <Button
              title="Back to sign in"
              onPress={() => router.back()}
              variant="ghost"
              size="sm"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    width: '100%',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
})
