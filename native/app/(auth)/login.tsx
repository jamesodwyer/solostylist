import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Link } from 'expo-router'
import { Screen, Button, Input } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing } from '@/theme'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setLoading(true)
    const { error: authError } = await signIn(email.trim(), password)
    setLoading(false)
    if (authError) setError(authError.message)
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
              SoloStylist
            </Text>
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.xs }]}>
              Sign in to manage your business
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              containerStyle={{ marginTop: spacing.md }}
            />

            {error ? (
              <Text style={[typography.bodySm, { color: theme.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            ) : null}

            <Button
              title="Sign in"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />

            <Link href="/(auth)/forgot-password" asChild>
              <Button
                title="Forgot password?"
                onPress={() => {}}
                variant="ghost"
                size="sm"
                style={{ marginTop: spacing.sm }}
              />
            </Link>
          </View>

          <View style={styles.footer}>
            <Text style={[typography.bodySm, { color: theme.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Text style={[typography.bodySmMedium, { color: theme.primary }]}>
                Sign up
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
})
