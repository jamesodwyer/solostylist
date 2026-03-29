import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { ChevronRight, LogOut, User, Clock, Ruler } from 'lucide-react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui'
import { getProfile } from '@/lib/actions/profile'
import { typography, spacing, radius } from '@/theme'
import type { Profile } from '@/lib/types/database'

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  onPress?: () => void
}) {
  const { theme } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderBottomColor: theme.borderLight }]}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={[typography.body, { color: theme.text }]}>{label}</Text>
        {value && (
          <Text style={[typography.bodySm, { color: theme.textSecondary }]}>{value}</Text>
        )}
      </View>
      {onPress && <ChevronRight size={20} color={theme.textTertiary} />}
    </Pressable>
  )
}

const SLOT_LABELS: Record<number, string> = {
  15: '15 minutes',
  30: '30 minutes',
  45: '45 minutes',
  60: '1 hour',
}

export default function SettingsScreen() {
  const { theme } = useTheme()
  const { signOut, user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)

  useFocusEffect(
    useCallback(() => {
      getProfile().then(setProfile)
    }, [])
  )

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ])
  }

  const iconColor = theme.textSecondary

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Business section */}
      <Text style={[typography.captionMedium, { color: theme.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs }]}>
        BUSINESS
      </Text>
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.borderLight }]}>
        <SettingsRow
          icon={<User size={20} color={iconColor} />}
          label={profile?.trading_name || 'Business name'}
          value={profile?.phone || undefined}
        />
        <SettingsRow
          icon={<Clock size={20} color={iconColor} />}
          label="Working hours"
          value={profile ? formatWorkingDays(profile) : undefined}
        />
        <SettingsRow
          icon={<Ruler size={20} color={iconColor} />}
          label="Default slot"
          value={profile ? SLOT_LABELS[profile.default_slot_minutes] || `${profile.default_slot_minutes} min` : undefined}
        />
      </View>

      {/* Account section */}
      <Text style={[typography.captionMedium, { color: theme.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs, marginTop: spacing.lg }]}>
        ACCOUNT
      </Text>
      <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.borderLight }]}>
        <SettingsRow
          icon={<LogOut size={20} color={theme.error} />}
          label="Sign out"
          onPress={handleSignOut}
        />
      </View>

      {user && (
        <Text style={[typography.caption, { color: theme.textTertiary, textAlign: 'center', marginTop: spacing.lg }]}>
          {user.email}
        </Text>
      )}
    </ScrollView>
  )
}

function formatWorkingDays(profile: Profile): string {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const active = days
    .map((d, i) => (profile.working_hours[d]?.enabled ? labels[i] : null))
    .filter(Boolean)
  return active.join(', ') || 'Not set'
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  section: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 32,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
})
