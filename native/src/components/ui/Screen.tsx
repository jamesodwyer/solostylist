import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/providers/ThemeProvider'
import { spacing } from '@/theme'

interface ScreenProps {
  children: React.ReactNode
  padding?: boolean
  style?: ViewStyle
}

export function Screen({ children, padding = true, style }: ScreenProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        padding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing.md,
  },
})
