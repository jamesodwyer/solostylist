'use client'

import { useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/lib/types/database'

interface ServiceRowProps {
  service: Service
  onEdit: (service: Service) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

export function ServiceRow({ service, onEdit, onToggleActive }: ServiceRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)
  const currentDelta = useRef(0)

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current = false
    currentDelta.current = 0
    if (rowRef.current) {
      rowRef.current.style.transition = 'none'
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = e.touches[0].clientY - touchStartY.current

    // Determine scroll vs swipe intent
    if (!isDragging.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        isDragging.current = true
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        // Vertical scroll intent — abort
        return
      }
    }

    if (isDragging.current) {
      e.preventDefault()
      // Clamp to left swipe only (negative deltaX), max 120px
      const clamped = Math.max(-120, Math.min(0, deltaX))
      currentDelta.current = clamped
      if (rowRef.current) {
        rowRef.current.style.transform = `translateX(${clamped}px)`
      }
    }
  }

  function handleTouchEnd() {
    if (!rowRef.current) return

    const threshold = 80
    const delta = currentDelta.current

    rowRef.current.style.transition = 'transform 200ms ease-out'

    if (Math.abs(delta) >= threshold) {
      // Threshold met — trigger toggle and animate back
      onToggleActive(service.id, service.is_active)
    }

    // Always animate back to 0
    rowRef.current.style.transform = 'translateX(0)'
    currentDelta.current = 0
    isDragging.current = false
  }

  const hasDeposit = service.deposit_required || service.deposit_type !== 'none'
  const durationLabel = service.duration_minutes >= 60
    ? `${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}min` : ''}`
    : `${service.duration_minutes} min`

  return (
    <div className="relative overflow-hidden">
      {/* Background action label revealed on swipe */}
      <div
        className={`absolute inset-y-0 right-0 flex items-center justify-end px-5 ${
          service.is_active ? 'bg-red-500' : 'bg-green-500'
        }`}
        style={{ width: 120 }}
      >
        <span className="text-white font-semibold text-sm">
          {service.is_active ? 'Hide' : 'Show'}
        </span>
      </div>

      {/* Row content */}
      <div
        ref={rowRef}
        className={`relative bg-white flex items-center gap-3 px-4 py-3 min-h-[56px] cursor-pointer active:bg-gray-50 ${
          service.is_active ? '' : 'opacity-50'
        }`}
        onClick={() => onEdit(service)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-black truncate">
              {service.name}
            </span>
            {hasDeposit && (
              <Badge variant="outline" className="text-xs shrink-0">
                Deposit
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{durationLabel}</span>
            {service.service_categories?.name && (
              <>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-500">
                  {service.service_categories.name}
                </span>
              </>
            )}
          </div>
        </div>
        <span className="font-semibold text-sm text-black shrink-0">
          {formatPrice(service.price)}
        </span>
      </div>
    </div>
  )
}
