import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'

interface CurrentTimeLineProps {
  top: number
  gutterWidth: number
}

export function CurrentTimeLine({ top, gutterWidth }: CurrentTimeLineProps) {
  const { theme } = useTheme()

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top }]}
    >
      {/* Small circle at gutter boundary */}
      <View
        style={[
          styles.circle,
          {
            backgroundColor: theme.error,
            left: gutterWidth - 3,
          },
        ]}
      />
      {/* Red horizontal line from gutter to right edge */}
      <View
        style={[
          styles.line,
          {
            backgroundColor: theme.error,
            left: gutterWidth,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    justifyContent: 'center',
    zIndex: 10,
  },
  circle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -4, // vertically center with the line (line is 2dp, circle is 10dp)
    zIndex: 11,
  },
  line: {
    position: 'absolute',
    right: 0,
    height: 2,
  },
})
