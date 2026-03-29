import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Link, router } from 'expo-router'
import { Screen, Button, Input } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing } from '@/theme'

export default function SignUpScreen() {
  const { signUp } = useAuth()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)
    const { error: authError } = await signUp(email.trim(), password)
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Screen>
        <View style={styles.successContent}>
          <Text style={[typography.h2, { color: theme.text, textAlign: 'center' }]}>
            Check your email
          </Text>
          <Text
            style={[
              typography.body,
              { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            We've sent a confirmation link to {email}. Tap the link to activate your account.
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
            <Text style={[typography.h1, { color: theme.text }]}>
              Create account
            </Text>
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.xs }]}>
              Start managing your business
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

            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="newPassword"
              autoComplete="new-password"
              containerStyle={{ marginTop: spacing.md }}
            />

            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
              containerStyle={{ marginTop: spacing.md }}
            />

            {error ? (
              <Text style={[typography.bodySm, { color: theme.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Create account"
              onPress={handleSignUp}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[typography.bodySm, { color: theme.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={[typography.bodySmMedium, { color: theme.primary }]}>
                Sign in
              </Text>
            </Link>
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
})
