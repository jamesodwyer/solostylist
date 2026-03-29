import { Stack } from 'expo-router'
import { useTheme } from '@/providers/ThemeProvider'
import { typography } from '@/theme'

export default function ServicesLayout() {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          ...typography.h3,
          color: theme.text,
        },
        headerTintColor: theme.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Services' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Service' }}
      />
    </Stack>
  )
}
