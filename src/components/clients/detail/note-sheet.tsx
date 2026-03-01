'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ClientNote, ColourFormula } from '@/lib/types/database'
import {
  addNote,
  updateNote,
  addColourFormula,
  updateColourFormula,
} from '@/lib/actions/notes'

interface NoteSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  editingNote?: ClientNote | ColourFormula | null
  mode: 'note' | 'colour_formula'
  defaultNoteType?: 'general' | 'treatment'
}

function isClientNote(obj: ClientNote | ColourFormula): obj is ClientNote {
  return 'note_type' in obj
}

export function NoteSheet({
  open,
  onOpenChange,
  clientId,
  editingNote,
  mode,
  defaultNoteType = 'general',
}: NoteSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [noteType, setNoteType] = useState<'general' | 'treatment'>(
    defaultNoteType
  )
  const [content, setContent] = useState('')
  const [formula, setFormula] = useState('')
  const [formulaNotes, setFormulaNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!editingNote

  // Populate fields when editing
  useEffect(() => {
    if (editingNote) {
      if (mode === 'note' && isClientNote(editingNote)) {
        setNoteType(editingNote.note_type === 'treatment' ? 'treatment' : 'general')
        setContent(editingNote.content)
      } else if (mode === 'colour_formula' && !isClientNote(editingNote)) {
        setFormula(editingNote.formula)
        setFormulaNotes(editingNote.notes ?? '')
      }
    } else {
      setContent('')
      setFormula('')
      setFormulaNotes('')
      setNoteType(defaultNoteType)
    }
    setError(null)
  }, [editingNote, open, mode, defaultNoteType])

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      let result

      if (mode === 'note') {
        if (isEditing && editingNote) {
          result = await updateNote(editingNote.id, { content })
        } else {
          result = await addNote({ client_id: clientId, note_type: noteType, content })
        }
      } else {
        if (isEditing && editingNote) {
          result = await updateColourFormula(editingNote.id, {
            formula,
            notes: formulaNotes,
          })
        } else {
          result = await addColourFormula({
            client_id: clientId,
            formula,
            notes: formulaNotes,
          })
        }
      }

      if (result && 'error' in result && result.error) {
        const errorMsg =
          typeof result.error === 'string'
            ? result.error
            : 'Something went wrong'
        setError(errorMsg)
        return
      }

      onOpenChange(false)
      router.refresh()
    })
  }

  const title =
    mode === 'note'
      ? isEditing
        ? 'Edit Note'
        : 'Add Note'
      : isEditing
        ? 'Edit Colour Formula'
        : 'Add Colour Formula'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="pb-2">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-4">
          {mode === 'note' && (
            <>
              {/* Note type selector */}
              {!isEditing && (
                <div className="flex gap-2">
                  {(['general', 'treatment'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNoteType(type)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        noteType === type
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-200'
                      }`}
                    >
                      {type === 'general' ? 'General' : 'Treatment'}
                    </button>
                  ))}
                </div>
              )}

              {/* Content textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                rows={4}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 resize-none disabled:opacity-50"
              />
            </>
          )}

          {mode === 'colour_formula' && (
            <>
              {/* Formula input */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Formula
                </label>
                <input
                  type="text"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  placeholder="e.g. 6.1 + 7.3 30vol 1:1.5"
                  disabled={isPending}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50"
                />
              </div>

              {/* Notes textarea */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={formulaNotes}
                  onChange={(e) => setFormulaNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  disabled={isPending}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 resize-none disabled:opacity-50"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-3 bg-black text-white rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Add'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
