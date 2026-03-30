import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import {
  ArrowLeft,
  Phone,
  Mail,
  Trash2,
} from 'lucide-react-native'
import { Screen, Button } from '@/components/ui'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import { getClient, deleteClient } from '@/lib/actions/clients'
import { getNotes, createNote, deleteNote, getColourFormulas, createColourFormula, deleteColourFormula } from '@/lib/actions/notes'
import { getTags, getClientTagIds, setClientTags } from '@/lib/actions/tags'
import type { Client, ClientNote, ColourFormula, Tag } from '@/lib/types/database'

type TabKey = 'details' | 'notes' | 'colours'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'notes', label: 'Notes' },
  { key: 'colours', label: 'Colours' },
]

function clientName(c: Client): string {
  return [c.first_name, c.last_name].filter(Boolean).join(' ')
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('details')

  // Notes state
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [colourFormulas, setColourFormulas] = useState<ColourFormula[]>([])
  const [newNote, setNewNote] = useState('')
  const [newFormula, setNewFormula] = useState('')
  const [newFormulaNotes, setNewFormulaNotes] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Tags state
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [clientTagIds, setClientTagIds] = useState<string[]>([])

  const loadAll = useCallback(async () => {
    if (!id) return
    try {
      const [c, allNotes, colours, tags, tagIds] = await Promise.all([
        getClient(id),
        getNotes(id),
        getColourFormulas(id),
        getTags(),
        getClientTagIds(id),
      ])
      setClient(c)
      setNotes(allNotes)
      setColourFormulas(colours)
      setAllTags(tags)
      setClientTagIds(tagIds)
    } finally {
      setLoading(false)
    }
  }, [id])

  useFocusEffect(
    useCallback(() => {
      loadAll()
    }, [loadAll])
  )

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return
    setSavingNote(true)
    try {
      await createNote({ clientId: id, noteType: 'general', content: newNote })
      setNewNote('')
      setNotes(await getNotes(id))
    } catch {}
    setSavingNote(false)
  }

  const handleAddFormula = async () => {
    if (!newFormula.trim() || !id) return
    setSavingNote(true)
    try {
      await createColourFormula({
        clientId: id,
        formula: newFormula,
        notes: newFormulaNotes || undefined,
      })
      setNewFormula('')
      setNewFormulaNotes('')
      setColourFormulas(await getColourFormulas(id))
    } catch {}
    setSavingNote(false)
  }

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(noteId)
          setNotes((prev) => prev.filter((n) => n.id !== noteId))
        },
      },
    ])
  }

  const handleDeleteFormula = (formulaId: string) => {
    Alert.alert('Delete formula', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteColourFormula(formulaId)
          setColourFormulas((prev) => prev.filter((f) => f.id !== formulaId))
        },
      },
    ])
  }

  const toggleTag = async (tagId: string) => {
    if (!id) return
    const prev = clientTagIds
    const next = prev.includes(tagId)
      ? prev.filter((t) => t !== tagId)
      : [...prev, tagId]
    setClientTagIds(next)
    try {
      await setClientTags(id, next)
    } catch {
      setClientTagIds(prev)
    }
  }

  const handleDeleteClient = () => {
    Alert.alert('Delete client', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return
          await deleteClient(id)
          router.back()
        },
      },
    ])
  }


  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      </Screen>
    )
  }

  if (!client) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[typography.body, { color: theme.textSecondary }]}>Client not found</Text>
          <Button title="Go back" onPress={() => router.back()} variant="secondary" style={{ marginTop: spacing.md }} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen padding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={24} color={theme.text} />
          </Pressable>
          <Text style={[typography.h3, { color: theme.text, flex: 1, marginLeft: spacing.md }]} numberOfLines={1}>
            {clientName(client)}
          </Text>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { borderBottomColor: theme.border }]}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                activeTab === tab.key && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  typography.bodySmMedium,
                  { color: activeTab === tab.key ? theme.primary : theme.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Details tab */}
          {activeTab === 'details' && (
            <View>
              {client.phone && (
                <View style={styles.infoRow}>
                  <Phone size={18} color={theme.textSecondary} />
                  <Text style={[typography.body, { color: theme.text, marginLeft: spacing.sm }]}>
                    {client.phone}
                  </Text>
                </View>
              )}
              {client.email && (
                <View style={styles.infoRow}>
                  <Mail size={18} color={theme.textSecondary} />
                  <Text style={[typography.body, { color: theme.text, marginLeft: spacing.sm }]}>
                    {client.email}
                  </Text>
                </View>
              )}

              {/* Tags */}
              <Text style={[typography.bodySmMedium, { color: theme.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                Tags
              </Text>
              <View style={styles.tagGrid}>
                {allTags.map((tag) => {
                  const isActive = clientTagIds.includes(tag.id)
                  return (
                    <Pressable
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: isActive ? theme.primaryLight : theme.surface,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.bodySm,
                          { color: isActive ? theme.primary : theme.textSecondary },
                        ]}
                      >
                        {tag.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Button
                title="Delete client"
                onPress={handleDeleteClient}
                variant="ghost"
                size="sm"
                textStyle={{ color: theme.error }}
                style={{ marginTop: spacing.xxl, alignSelf: 'center' }}
              />
            </View>
          )}

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <View>
              <View style={styles.addNoteRow}>
                <TextInput
                  style={[
                    styles.noteInput,
                    typography.body,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                  placeholder="Add a note..."
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newNote}
                  onChangeText={setNewNote}
                  multiline
                />
                <Button
                  title="Add"
                  onPress={handleAddNote}
                  size="sm"
                  loading={savingNote}
                  disabled={!newNote.trim()}
                  style={{ marginLeft: spacing.sm }}
                />
              </View>

              {notes.length === 0 ? (
                <Text style={[typography.bodySm, { color: theme.textTertiary, textAlign: 'center', marginTop: spacing.xl }]}>
                  No notes yet
                </Text>
              ) : (
                notes.map((note) => (
                  <View key={note.id} style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
                    <View style={styles.noteHeader}>
                      <View style={[styles.noteBadge, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[typography.caption, { color: theme.primary }]}>
                          {note.note_type === 'general' ? 'General' : 'Treatment'}
                        </Text>
                      </View>
                      <Pressable onPress={() => handleDeleteNote(note.id)} hitSlop={8}>
                        <Trash2 size={16} color={theme.textTertiary} />
                      </Pressable>
                    </View>
                    <Text style={[typography.body, { color: theme.text, marginTop: spacing.xs }]}>
                      {note.content}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textTertiary, marginTop: spacing.xs }]}>
                      {new Date(note.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Colours tab */}
          {activeTab === 'colours' && (
            <View>
              <TextInput
                style={[
                  styles.noteInput,
                  typography.body,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                    marginBottom: spacing.sm,
                  },
                ]}
                placeholder="e.g. 6.1 + 7.3 30vol 1:1.5"
                placeholderTextColor={theme.inputPlaceholder}
                value={newFormula}
                onChangeText={setNewFormula}
              />
              <View style={styles.addNoteRow}>
                <TextInput
                  style={[
                    styles.noteInput,
                    typography.body,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.inputText,
                    },
                  ]}
                  placeholder="Additional notes (optional)"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={newFormulaNotes}
                  onChangeText={setNewFormulaNotes}
                  multiline
                />
                <Button
                  title="Add"
                  onPress={handleAddFormula}
                  size="sm"
                  loading={savingNote}
                  disabled={!newFormula.trim()}
                  style={{ marginLeft: spacing.sm }}
                />
              </View>

              {colourFormulas.length === 0 ? (
                <Text style={[typography.bodySm, { color: theme.textTertiary, textAlign: 'center', marginTop: spacing.xl }]}>
                  No colour formulas yet
                </Text>
              ) : (
                colourFormulas.map((f) => (
                  <View key={f.id} style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
                    <View style={styles.noteHeader}>
                      <Text style={[typography.bodyMedium, { color: theme.text, flex: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]}>
                        {f.formula}
                      </Text>
                      <Pressable onPress={() => handleDeleteFormula(f.id)} hitSlop={8}>
                        <Trash2 size={16} color={theme.textTertiary} />
                      </Pressable>
                    </View>
                    {f.notes && (
                      <Text style={[typography.bodySm, { color: theme.textSecondary, marginTop: spacing.xs }]}>
                        {f.notes}
                      </Text>
                    )}
                    <Text style={[typography.caption, { color: theme.textTertiary, marginTop: spacing.xs }]}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  addNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  noteInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  noteCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
})
