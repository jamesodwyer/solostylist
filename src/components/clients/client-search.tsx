'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Client } from '@/lib/types/database'

interface ClientSearchProps {
  onResults: (clients: Client[]) => void
  onClear: () => void
  onPendingChange?: (pending: boolean) => void
}

export function ClientSearch({ onResults, onClear, onPendingChange }: ClientSearchProps) {
  const [query, setQuery] = useState('')
  const [isPending, setIsPending] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (!query.trim()) {
      setIsPending(false)
      onPendingChange?.(false)
      onClear()
      return
    }

    setIsPending(true)
    onPendingChange?.(true)

    timerRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select('id, owner_user_id, first_name, last_name, phone, email, address, marketing_consent, created_at, updated_at, client_tags(tag_id, tags(name))')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('first_name')
        .limit(50)

      setIsPending(false)
      onPendingChange?.(false)
      onResults((data as unknown as Client[]) ?? [])
    }, 250)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleClear() {
    setQuery('')
    setIsPending(false)
    onPendingChange?.(false)
    onClear()
  }

  return (
    <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-4 py-3">
      <div
        className={`flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 transition-opacity ${
          isPending ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <Search className="size-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}
