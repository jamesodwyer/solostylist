import React from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography } from '@/theme'
import { spacing, radius } from '@/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'sm'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme()
  const isDisabled = disabled || loading

  const bgColor = isDisabled
    ? theme.buttonDisabled
    : variant === 'primary'
      ? theme.buttonPrimary
      : variant === 'secondary'
        ? theme.buttonSecondary
        : 'transparent'

  const textColor = isDisabled
    ? theme.buttonDisabledText
    : variant === 'primary'
      ? theme.buttonPrimaryText
      : variant === 'secondary'
        ? theme.buttonSecondaryText
        : theme.primary

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.default,
        {
          backgroundColor: bgColor,
          opacity: pressed ? 0.85 : 1,
          borderColor: variant === 'ghost' ? 'transparent' : bgColor,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            size === 'sm' ? typography.buttonSm : typography.button,
            { color: textColor },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  default: {
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  sm: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
})
