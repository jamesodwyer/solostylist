import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  containerStyle?: ViewStyle
}

export function Input({
  label,
  error,
  containerStyle,
  ...props
}: InputProps) {
  const { theme } = useTheme()
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? theme.error
    : focused
      ? theme.inputBorderFocus
      : theme.inputBorder

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[typography.bodySmMedium, { color: theme.text, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          typography.body,
          {
            backgroundColor: theme.inputBackground,
            borderColor,
            color: theme.inputText,
          },
        ]}
        placeholderTextColor={theme.inputPlaceholder}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
        accessibilityLabel={label}
        {...props}
      />
      {error && (
        <Text style={[typography.caption, { color: theme.error, marginTop: spacing.xs }]}>
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
})
