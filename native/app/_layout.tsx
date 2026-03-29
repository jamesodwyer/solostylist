import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View } from 'react-native'
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'
import { getProfile } from '@/lib/actions/profile'

function RootNavigator() {
  const { session, loading } = useAuth()
  const { theme, isDark } = useTheme()
  const segments = useSegments()
  const router = useRouter()
  const [checkingProfile, setCheckingProfile] = useState(false)

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Check if onboarding is complete before redirecting to tabs
      const inOnboarding = (segments as string[])[1] === 'onboarding'
      if (inOnboarding) return // Already on onboarding, don't redirect

      setCheckingProfile(true)
      getProfile().then((profile) => {
        setCheckingProfile(false)
        if (profile?.onboarding_completed) {
          router.replace('/(tabs)')
        } else {
          router.replace('/(auth)/onboarding')
        }
      })
    }
  }, [session, loading, segments])

  if (loading || checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="client/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="client/[id]" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  )
}
