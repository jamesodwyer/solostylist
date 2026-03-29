import { useCallback, useState } from 'react'
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Plus, Trash2 } from 'lucide-react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import { getServices, deleteService } from '@/lib/actions/services'
import { formatPennies } from '@/lib/actions/payments'
import type { ServiceWithCategory } from '@/lib/actions/services'

interface ServiceSection {
  title: string
  data: ServiceWithCategory[]
}

function groupByCategory(services: ServiceWithCategory[]): ServiceSection[] {
  const map = new Map<string, ServiceWithCategory[]>()

  for (const service of services) {
    const categoryName = service.service_categories?.name ?? 'General'
    if (!map.has(categoryName)) {
      map.set(categoryName, [])
    }
    map.get(categoryName)!.push(service)
  }

  // Sort sections: named categories alphabetically, "General" last
  const sections: ServiceSection[] = []
  const sortedKeys = Array.from(map.keys()).sort((a, b) => {
    if (a === 'General') return 1
    if (b === 'General') return -1
    return a.localeCompare(b)
  })

  for (const key of sortedKeys) {
    sections.push({ title: key, data: map.get(key)! })
  }

  return sections
}

export default function ServicesScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const [sections, setSections] = useState<ServiceSection[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let active = true
      setLoading(true)
      getServices()
        .then((services) => {
          if (active) {
            setSections(groupByCategory(services))
          }
        })
        .catch(() => {
          if (active) setSections([])
        })
        .finally(() => {
          if (active) setLoading(false)
        })
      return () => { active = false }
    }, [])
  )

  const handleDelete = (service: ServiceWithCategory) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(service.id)
              setSections((prev) =>
                prev
                  .map((s) => ({ ...s, data: s.data.filter((d) => d.id !== service.id) }))
                  .filter((s) => s.data.length > 0)
              )
            } catch {
              Alert.alert('Error', 'Failed to delete service. Please try again.')
            }
          },
        },
      ]
    )
  }

  const iconColor = theme.textSecondary

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[typography.h3, { color: theme.textSecondary, marginBottom: spacing.sm }]}>
            No services yet
          </Text>
          <Text style={[typography.body, { color: theme.textTertiary, textAlign: 'center' }]}>
            Add your first service to start booking.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <Text
              style={[
                typography.captionMedium,
                {
                  color: theme.textSecondary,
                  marginTop: spacing.lg,
                  marginBottom: spacing.xs,
                  marginLeft: spacing.xs,
                },
              ]}
            >
              {title.toUpperCase()}
            </Text>
          )}
          renderItem={({ item, index, section }) => {
            const isLast = index === section.data.length - 1
            return (
              <Pressable
                onPress={() => router.push(`/services/${item.id}`)}
                style={({ pressed }) => [
                  styles.serviceRow,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.borderLight,
                    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceNameRow}>
                    <Text style={[typography.bodyMedium, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: item.is_active
                            ? theme.successLight
                            : theme.buttonSecondary,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: item.is_active ? theme.success : theme.textSecondary,
                          },
                        ]}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.bodySm, { color: theme.textSecondary, marginTop: spacing.xxs }]}>
                    {formatPennies(item.price)} · {item.duration_minutes} min
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(item)}
                  style={styles.deleteButton}
                  accessibilityLabel={`Delete ${item.name}`}
                  hitSlop={8}
                >
                  <Trash2 size={18} color={theme.textTertiary} />
                </Pressable>
              </Pressable>
            )
          }}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/services/new')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityLabel="Add service"
        accessibilityRole="button"
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + spacing.lg, // space for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  deleteButton: {
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})
