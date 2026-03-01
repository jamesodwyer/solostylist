'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Tag } from '@/lib/types/database'
import { addTagToClient, createTag } from '@/lib/actions/tags'

const TAG_PALETTE = [
  'bg-red-50 text-red-700 border-red-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-yellow-50 text-yellow-700 border-yellow-200',
  'bg-purple-50 text-purple-700 border-purple-200',
]

export function getTagColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i)
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length]
}

interface TagPickerProps {
  clientId: string
  currentTagIds: string[]
  allTags: Tag[]
}

export function TagPicker({ clientId, currentTagIds, allTags }: TagPickerProps) {
  const [input, setInput] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = allTags.filter(
    (tag) =>
      !currentTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(input.toLowerCase())
  )

  const exactMatch = allTags.some(
    (tag) => tag.name.toLowerCase() === input.toLowerCase()
  )

  const showCreateOption =
    input.trim().length > 0 && !exactMatch

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelectExisting(tag: Tag) {
    startTransition(async () => {
      await addTagToClient(clientId, tag.id)
      setInput('')
      setShowDropdown(false)
    })
  }

  function handleCreate() {
    const name = input.trim()
    if (!name) return
    startTransition(async () => {
      const result = await createTag(name)
      if (result.success && result.data) {
        await addTagToClient(clientId, result.data.id)
      }
      setInput('')
      setShowDropdown(false)
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          setShowDropdown(true)
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Add a tag..."
        disabled={isPending}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-50 bg-white"
      />

      {showDropdown && (filtered.length > 0 || showCreateOption) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelectExisting(tag)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${getTagColor(tag.name)}`}
              >
                {tag.name}
              </span>
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-700"
            >
              Create &quot;{input.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
