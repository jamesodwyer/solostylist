'use client'

import { useState, useTransition } from 'react'
import { ClientNote, ColourFormula } from '@/lib/types/database'
import { deleteNote, deleteColourFormula } from '@/lib/actions/notes'
import { Badge } from '@/components/ui/badge'
import { NoteSheet } from './note-sheet'
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react'

interface NotesTabProps {
  clientId: string
  notes: ClientNote[]
  colourFormulas: ColourFormula[]
}

type TimelineEntry =
  | (ClientNote & { source: 'note' })
  | (ColourFormula & { source: 'formula'; note_type: 'colour_formula'; content: string })

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function TypeBadge({ type }: { type: string }) {
  if (type === 'general') {
    return (
      <Badge variant="outline" className="text-xs border border-gray-200 text-gray-600">
        General
      </Badge>
    )
  }
  if (type === 'treatment') {
    return (
      <Badge variant="outline" className="text-xs border border-blue-200 text-blue-700 bg-blue-50">
        Treatment
      </Badge>
    )
  }
  if (type === 'colour_formula') {
    return (
      <Badge variant="outline" className="text-xs border border-purple-200 text-purple-700 bg-purple-50">
        Colour Formula
      </Badge>
    )
  }
  return null
}

export function NotesTab({ clientId, notes, colourFormulas }: NotesTabProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [fabMenuOpen, setFabMenuOpen] = useState(false)
  const [sheetMode, setSheetMode] = useState<'note' | 'colour_formula'>('note')
  const [defaultNoteType, setDefaultNoteType] = useState<'general' | 'treatment'>('general')
  const [editingItem, setEditingItem] = useState<ClientNote | ColourFormula | null>(null)
  const [isPending, startTransition] = useTransition()

  const timeline: TimelineEntry[] = [
    ...notes.map((n) => ({ ...n, source: 'note' as const })),
    ...colourFormulas.map((f) => ({
      ...f,
      source: 'formula' as const,
      note_type: 'colour_formula' as const,
      content: f.formula,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  function openAdd(mode: 'note' | 'colour_formula', noteType?: 'general' | 'treatment') {
    setEditingItem(null)
    setSheetMode(mode)
    if (noteType) setDefaultNoteType(noteType)
    setFabMenuOpen(false)
    setSheetOpen(true)
  }

  function openEdit(item: TimelineEntry) {
    if (item.source === 'note') {
      setEditingItem(item as ClientNote)
      setSheetMode('note')
    } else {
      const formula = colourFormulas.find((f) => f.id === item.id)
      setEditingItem(formula ?? null)
      setSheetMode('colour_formula')
    }
    setSheetOpen(true)
  }

  function handleDelete(item: TimelineEntry) {
    if (!window.confirm('Delete this entry?')) return
    startTransition(async () => {
      if (item.source === 'note') {
        await deleteNote(item.id, clientId)
      } else {
        await deleteColourFormula(item.id, clientId)
      }
    })
  }

  return (
    <div className="relative pb-24">
      {timeline.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-gray-500 font-medium">No notes yet</p>
          <p className="text-sm text-gray-400 mt-1">Tap + to add your first note</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {timeline.map((item) => (
            <div key={item.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeBadge type={item.note_type} />
                    <span className="text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {item.content}
                  </p>
                  {item.source === 'formula' && (item as ColourFormula).notes && (
                    <p className="text-sm text-gray-500 mt-1">
                      {(item as ColourFormula).notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    aria-label="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-30"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB menu overlay */}
      {fabMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setFabMenuOpen(false)}
        />
      )}

      {/* FAB add-type menu */}
      {fabMenuOpen && (
        <div className="fixed bottom-36 right-4 z-40 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden min-w-[180px]">
          <button
            type="button"
            onClick={() => openAdd('note', 'general')}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
          >
            General Note
          </button>
          <button
            type="button"
            onClick={() => openAdd('note', 'treatment')}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
          >
            Treatment Note
          </button>
          <button
            type="button"
            onClick={() => openAdd('colour_formula')}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          >
            Colour Formula
          </button>
        </div>
      )}

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setFabMenuOpen((prev) => !prev)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 active:scale-95 transition-transform"
        aria-label="Add note or formula"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Note/formula sheet */}
      <NoteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        clientId={clientId}
        editingNote={editingItem}
        mode={sheetMode}
        defaultNoteType={defaultNoteType}
      />
    </div>
  )
}
