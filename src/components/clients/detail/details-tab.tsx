'use client'

import { useState, useTransition } from 'react'
import { Client, Tag } from '@/lib/types/database'
import { updateClient } from '@/lib/actions/clients'
import { removeTagFromClient } from '@/lib/actions/tags'
import { TagPicker, getTagColor } from './tag-picker'
import { Badge } from '@/components/ui/badge'
import { Check, X } from 'lucide-react'

interface DetailsTabProps {
  client: Client
  allTags: Tag[]
}

type EditableField = 'first_name' | 'last_name' | 'phone' | 'email' | 'address'

const FIELD_LABELS: Record<EditableField, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  phone: 'Phone',
  email: 'Email',
  address: 'Address',
}

export function DetailsTab({ client, allTags }: DetailsTabProps) {
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savedField, setSavedField] = useState<EditableField | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isRemovingTag, startRemoveTagTransition] = useTransition()

  const currentTagIds = (client.client_tags ?? []).map((ct) => ct.tag_id)

  function startEdit(field: EditableField) {
    setEditingField(field)
    setEditValue((client[field] as string) ?? '')
  }

  function saveField(field: EditableField) {
    startTransition(async () => {
      await updateClient(client.id, { [field]: editValue })
      setEditingField(null)
      setSavedField(field)
      setTimeout(() => setSavedField(null), 1500)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent, field: EditableField) {
    if (e.key === 'Enter') saveField(field)
    if (e.key === 'Escape') setEditingField(null)
  }

  function handleRemoveTag(tagId: string) {
    startRemoveTagTransition(async () => {
      await removeTagFromClient(client.id, tagId)
    })
  }

  const fields: EditableField[] = ['first_name', 'last_name', 'phone', 'email', 'address']

  return (
    <div className="p-4 space-y-6">
      {/* Contact info */}
      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Contact info
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {fields.map((field) => (
            <div key={field} className="px-4 py-3 min-h-[52px]">
              <p className="text-xs text-gray-400 mb-0.5">{FIELD_LABELS[field]}</p>
              {editingField === field ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type={field === 'email' ? 'email' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => saveField(field)}
                    onKeyDown={(e) => handleKeyDown(e, field)}
                    disabled={isPending}
                    className="flex-1 text-sm border-b border-gray-300 focus:outline-none focus:border-black py-0.5 bg-transparent"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      saveField(field)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(field)}
                  className="w-full text-left"
                >
                  <span className="text-sm text-gray-900">
                    {(client[field] as string) || (
                      <span className="text-gray-400 italic">Tap to add</span>
                    )}
                  </span>
                  {savedField === field && (
                    <span className="ml-2 text-xs text-green-600">Saved</span>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Marketing consent */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Preferences
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-900">Marketing consent</span>
          <button
            type="button"
            role="switch"
            aria-checked={client.marketing_consent}
            onClick={() => {
              startTransition(async () => {
                await updateClient(client.id, {
                  marketing_consent: !client.marketing_consent,
                })
              })
            }}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              client.marketing_consent ? 'bg-black' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                client.marketing_consent ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Tags
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {(client.client_tags ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(client.client_tags ?? []).map((ct) => (
                <div key={ct.tag_id} className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className={`text-xs border pr-1 ${getTagColor(ct.tags.name)}`}
                  >
                    {ct.tags.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(ct.tag_id)}
                      disabled={isRemovingTag}
                      className="ml-1 opacity-60 hover:opacity-100 disabled:opacity-30"
                      aria-label={`Remove tag ${ct.tags.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No tags yet</p>
          )}
          <TagPicker
            clientId={client.id}
            currentTagIds={currentTagIds}
            allTags={allTags}
          />
        </div>
      </div>
    </div>
  )
}
