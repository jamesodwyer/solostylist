'use client'

import { useState, useTransition } from 'react'
import { ColourFormula } from '@/lib/types/database'
import { deleteColourFormula } from '@/lib/actions/notes'
import { NoteSheet } from './note-sheet'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface ColourTabProps {
  clientId: string
  colourFormulas: ColourFormula[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ColourTab({ clientId, colourFormulas }: ColourTabProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingFormula, setEditingFormula] = useState<ColourFormula | null>(null)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditingFormula(null)
    setSheetOpen(true)
  }

  function openEdit(formula: ColourFormula) {
    setEditingFormula(formula)
    setSheetOpen(true)
  }

  function handleDelete(formula: ColourFormula) {
    if (!window.confirm('Delete this colour formula?')) return
    startTransition(async () => {
      await deleteColourFormula(formula.id, clientId)
    })
  }

  return (
    <div className="relative pb-24">
      {colourFormulas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-gray-500 font-medium">No colour formulas yet</p>
          <p className="text-sm text-gray-400 mt-1">Tap + to add a formula</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {colourFormulas.map((formula) => (
            <div key={formula.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base font-mono">
                    {formula.formula}
                  </p>
                  {formula.notes && (
                    <p className="text-sm text-gray-500 mt-1">{formula.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {formatDate(formula.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(formula)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    aria-label="Edit formula"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(formula)}
                    disabled={isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-30"
                    aria-label="Delete formula"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating add button */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 active:scale-95 transition-transform"
        aria-label="Add colour formula"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Formula sheet */}
      <NoteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        clientId={clientId}
        editingNote={editingFormula}
        mode="colour_formula"
      />
    </div>
  )
}
