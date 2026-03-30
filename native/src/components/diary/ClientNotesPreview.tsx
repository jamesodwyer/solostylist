import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useTheme } from '@/providers/ThemeProvider'
import { typography, spacing, radius } from '@/theme'
import { getNotes, getColourFormulas } from '@/lib/actions/notes'
import type { ClientNote, ColourFormula } from '@/lib/types/database'

interface ClientNotesPreviewProps {
  clientId: string
}

export function ClientNotesPreview({ clientId }: ClientNotesPreviewProps) {
  const { theme } = useTheme()
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [formulas, setFormulas] = useState<ColourFormula[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    Promise.all([
      getNotes(clientId).catch(() => [] as ClientNote[]),
      getColourFormulas(clientId).catch(() => [] as ColourFormula[]),
    ]).then(([fetchedNotes, fetchedFormulas]) => {
      setNotes(fetchedNotes)
      setFormulas(fetchedFormulas)
      setLoading(false)
    })
  }, [clientId])

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    )
  }

  const hasNotes = notes.length > 0
  const latestFormula = formulas[0] ?? null
  const latestNotes = notes.slice(0, 2)

  if (!hasNotes && !latestFormula) {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[typography.bodySm, { color: theme.textSecondary }]}>No client notes</Text>
      </View>
    )
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Colour Formula Section */}
      <View style={styles.section}>
        <Text style={[typography.caption, styles.sectionLabel, { color: theme.textTertiary }]}>
          COLOUR FORMULA
        </Text>
        {latestFormula ? (
          <>
            <Text
              style={[typography.bodySm, { color: theme.text }]}
              numberOfLines={2}
            >
              {latestFormula.formula}
            </Text>
            {latestFormula.notes ? (
              <Text
                style={[typography.caption, { color: theme.textSecondary, marginTop: spacing.xxs }]}
                numberOfLines={1}
              >
                {latestFormula.notes}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={[typography.bodySm, { color: theme.textSecondary }]}>
            No colour formula on file
          </Text>
        )}
      </View>

      {/* Notes Section */}
      {hasNotes && (
        <View style={[styles.section, styles.sectionBorder, { borderTopColor: theme.borderLight }]}>
          <Text style={[typography.caption, styles.sectionLabel, { color: theme.textTertiary }]}>
            NOTES ({notes.length})
          </Text>
          {latestNotes.map((note) => (
            <Text
              key={note.id}
              style={[typography.bodySm, { color: theme.text }, styles.noteItem]}
              numberOfLines={2}
            >
              {note.content}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  section: {
    gap: spacing.xxs,
  },
  sectionBorder: {
    borderTopWidth: 1,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  sectionLabel: {
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  noteItem: {
    marginTop: spacing.xxs,
  },
})
