import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing } from '@/theme'

export default function DiaryScreen() {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[typography.h2, { color: theme.text }]}>Diary</Text>
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>
          Your appointments will appear here
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
})
