'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface ClientNotesPreviewProps {
  notes: Array<{ id: string; note_type: string; content: string; created_at: string }>
  latestFormula: { id: string; formula: string; notes: string | null; created_at: string } | null
  loading?: boolean
  clientId?: string  // optional, for "View all" link
}

export function ClientNotesPreview({ notes, latestFormula, loading, clientId }: ClientNotesPreviewProps) {
  const [expanded, setExpanded] = useState(false)

  if (loading) {
    return (
      <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400 animate-pulse">
        Loading notes...
      </div>
    )
  }

  const hasData = notes.length > 0 || latestFormula !== null

  if (!hasData) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center justify-between w-full"
      >
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Client Notes</span>
        <ChevronDown
          className={`size-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="space-y-2 mt-2">
          {latestFormula && (
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2">
              <p className="text-xs font-medium text-purple-700">Colour Formula</p>
              <p className="font-mono text-sm text-purple-900">{latestFormula.formula}</p>
              {latestFormula.notes && (
                <p className="text-xs text-purple-600 mt-0.5">{latestFormula.notes}</p>
              )}
            </div>
          )}

          {notes.map(note => (
            <div key={note.id} className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5 capitalize">
                {note.note_type.replace(/_/g, ' ')}
              </p>
              <p className="text-sm text-gray-700 line-clamp-3">{note.content}</p>
            </div>
          ))}

          {clientId && (
            <a
              href={`/clients/${clientId}`}
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              View all notes
            </a>
          )}
        </div>
      )}
    </div>
  )
}
