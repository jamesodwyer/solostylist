'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Client } from '@/lib/types/database'

interface ClientRowProps {
  client: Client
}

const TAG_PALETTE = [
  'bg-red-50 text-red-700 border-red-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-green-50 text-green-700 border-green-200',
  'bg-yellow-50 text-yellow-700 border-yellow-200',
  'bg-purple-50 text-purple-700 border-purple-200',
]

function getTagColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i)
  }
  return TAG_PALETTE[hash % TAG_PALETTE.length]
}

export function ClientRow({ client }: ClientRowProps) {
  const initials =
    (client.first_name?.[0] ?? '').toUpperCase() +
    (client.last_name?.[0] ?? '').toUpperCase()

  const tags = client.client_tags ?? []
  const visibleTags = tags.slice(0, 2)
  const extraCount = tags.length - visibleTags.length

  return (
    <Link
      href={`/clients/${client.id}`}
      className="flex items-center gap-3 px-4 py-3 min-h-[44px] border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100"
    >
      {/* Initials circle */}
      <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 text-sm font-medium">
        {initials || '?'}
      </div>

      {/* Name + phone */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">
          {client.first_name} {client.last_name}
        </p>
        {client.phone ? (
          <p className="text-sm text-gray-500 truncate">{client.phone}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No phone</p>
        )}
      </div>

      {/* Tag chips */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          {visibleTags.map((ct) => (
            <Badge
              key={ct.tag_id}
              variant="outline"
              className={`text-xs border ${getTagColor(ct.tags.name)}`}
            >
              {ct.tags.name}
            </Badge>
          ))}
          {extraCount > 0 && (
            <span className="text-xs text-gray-400">+{extraCount}</span>
          )}
        </div>
      )}
    </Link>
  )
}
