import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { Search, Plus, User } from 'lucide-react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import { searchClients } from '@/lib/actions/clients'
import type { Client } from '@/lib/types/database'

function clientName(c: Client): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ')
}

function ClientRow({ client, onPress }: { client: Client; onPress: () => void }) {
  const { theme } = useTheme()
  const tags = client.client_tags?.map((ct) => ct.tags?.name).filter(Boolean) ?? []

  return (
    <Pressable
      onPress={onPress}
      style={[styles.clientRow, { borderBottomColor: theme.borderLight }]}
      accessibilityRole="button"
    >
      <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
        <Text style={[typography.bodyMedium, { color: theme.primary }]}>
          {client.first_name[0]?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={[typography.bodyMedium, { color: theme.text }]} numberOfLines={1}>
          {clientName(client)}
        </Text>
        {client.phone && (
          <Text style={[typography.bodySm, { color: theme.textSecondary }]} numberOfLines={1}>
            {client.phone}
          </Text>
        )}
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: theme.surface }]}>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  )
}

export default function ClientsScreen() {
  const { theme } = useTheme()
  const [clients, setClients] = useState<Client[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const loadClients = useCallback(async () => {
    try {
      const data = await searchClients(query)
      setClients(data)
    } catch {
      // silently fail — will show empty
    } finally {
      setLoading(false)
    }
  }, [query])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      loadClients()
    }, [loadClients])
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, typography.body, { color: theme.inputText }]}
            placeholder="Search clients..."
            placeholderTextColor={theme.inputPlaceholder}
            value={query}
            onChangeText={(text) => {
              setQuery(text)
              setLoading(true)
            }}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <Pressable
          onPress={() => router.push('/client/new')}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          accessibilityLabel="Add client"
        >
          <Plus size={22} color={theme.buttonPrimaryText} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.center}>
          <User size={48} color={theme.textTertiary} />
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.md }]}>
            {query ? 'No clients found' : 'No clients yet'}
          </Text>
          {!query && (
            <Text style={[typography.bodySm, { color: theme.textTertiary, marginTop: spacing.xs }]}>
              Tap + to add your first client
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              onPress={() => router.push(`/client/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 42,
    padding: 0,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
