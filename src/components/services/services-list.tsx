'use client'

import { useState, useTransition } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ServiceRow } from '@/components/services/service-row'
import { ServiceSheet } from '@/components/services/service-sheet'
import { toggleServiceActive } from '@/lib/actions/services'
import type { Service, ServiceCategory } from '@/lib/types/database'

interface ServicesListProps {
  services: Service[]
  categories: ServiceCategory[]
}

export function ServicesList({ services, categories }: ServicesListProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | undefined>(undefined)
  const [, startTransition] = useTransition()

  function handleEdit(service: Service) {
    setEditingService(service)
    setSheetOpen(true)
  }

  function handleAdd() {
    setEditingService(undefined)
    setSheetOpen(true)
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open)
    if (!open) {
      setEditingService(undefined)
    }
  }

  function handleToggleActive(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleServiceActive(id, isActive)
    })
  }

  // Split active vs inactive
  const activeServices = services.filter(s => s.is_active)
  const inactiveServices = services.filter(s => !s.is_active)

  // Group active services by category
  const uncategorised = activeServices.filter(s => s.category_id === null)
  const categorised = categories.map(cat => ({
    category: cat,
    services: activeServices.filter(s => s.category_id === cat.id),
  })).filter(g => g.services.length > 0)

  const isEmpty = services.length === 0

  return (
    <div className="flex-1">
      {/* Add button */}
      <div className="px-4 pb-4 flex justify-end">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-semibold min-h-[44px] active:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-900">No services yet</p>
          <p className="text-sm text-gray-500 mt-1">Tap Add Service to create your first service</p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {/* Uncategorised section (top) */}
          {uncategorised.length > 0 && (
            <div className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Uncategorised
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {uncategorised.map(service => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Category sections */}
          {categorised.map(({ category, services: catServices }) => (
            <Collapsible key={category.id} defaultOpen className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 min-h-[44px]">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category.name}
                </p>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-gray-100">
                  {catServices.map(service => (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {/* Hidden section (deactivated services, collapsed by default) */}
          {inactiveServices.length > 0 && (
            <Collapsible defaultOpen={false} className="bg-white mx-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 min-h-[44px]">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Hidden ({inactiveServices.length})
                </p>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-gray-100">
                  {inactiveServices.map(service => (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}

      {/* Service Sheet */}
      <ServiceSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        service={editingService}
        categories={categories}
      />
    </div>
  )
}
