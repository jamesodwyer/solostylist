import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'

export type CalendarView = 'month' | 'week' | 'day'

const SEGMENTS: CalendarView[] = ['month', 'week', 'day']

interface SegmentedControlProps {
  value: CalendarView
  onChange: (view: CalendarView) => void
}

export function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface },
      ]}
    >
      {SEGMENTS.map((seg) => {
        const isActive = value === seg
        return (
          <TouchableOpacity
            key={seg}
            onPress={() => onChange(seg)}
            style={[
              styles.segment,
              isActive && { backgroundColor: theme.card },
            ]}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                { color: theme.text },
                isActive && styles.labelActive,
              ]}
            >
              {seg.charAt(0).toUpperCase() + seg.slice(1)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
  },
  labelActive: {
    fontWeight: '600',
  },
})
