'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Client } from '@/lib/types/database'
import { ClientSearch } from './client-search'
import { ClientRow } from './client-row'
import { ClientSheet } from './client-sheet'

interface ClientListProps {
  initialClients: Client[]
}

export function ClientList({ initialClients }: ClientListProps) {
  const [displayClients, setDisplayClients] = useState<Client[]>(initialClients)
  const [isSearching, setIsSearching] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleSearchResults(clients: Client[]) {
    setDisplayClients(clients)
    setIsSearching(true)
  }

  function handleSearchClear() {
    setDisplayClients(initialClients)
    setIsSearching(false)
  }

  // Group clients alphabetically by first letter of first_name
  function getAlphabeticalGroups(clients: Client[]) {
    const groups: Record<string, Client[]> = {}
    for (const client of clients) {
      const letter = (client.first_name?.[0] ?? '#').toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(client)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  const alphabeticalGroups = isSearching ? [] : getAlphabeticalGroups(displayClients)

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 active:bg-gray-700"
          aria-label="Add client"
        >
          <Plus className="size-5" />
        </button>
      </div>

      {/* Pinned search bar */}
      <ClientSearch
        onResults={handleSearchResults}
        onClear={handleSearchClear}
      />

      {/* Client list */}
      <div className="flex-1">
        {/* No clients at all */}
        {initialClients.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
            <p className="text-gray-500 font-medium">No clients yet</p>
            <p className="text-sm text-gray-400 mt-1">Tap + to add your first client</p>
          </div>
        )}

        {/* Search empty state */}
        {isSearching && displayClients.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-20 px-4 text-center">
            <p className="text-gray-500 font-medium">No clients found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different name or phone number</p>
          </div>
        )}

        {/* Search results — flat list, no section headers */}
        {isSearching && displayClients.length > 0 && (
          <div>
            {displayClients.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </div>
        )}

        {/* Alphabetical groups with section headers */}
        {!isSearching && initialClients.length > 0 && (
          <div>
            {alphabeticalGroups.map(([letter, clients]) => (
              <div key={letter}>
                <div className="sticky top-[57px] bg-gray-50 px-4 py-1 z-10">
                  <span className="text-xs font-bold text-gray-400 uppercase">{letter}</span>
                </div>
                {clients.map((client) => (
                  <ClientRow key={client.id} client={client} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add client sheet */}
      <ClientSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
