import type { Service } from '@/lib/types/database'

/**
 * Helper that replicates the grouping logic from getServicesByCategory.
 * Tests the pure grouping logic without Supabase calls.
 */
function groupServicesByCategory(services: Service[]): Map<string, Service[]> {
  const map = new Map<string, Service[]>()
  for (const service of services) {
    const categoryName = service.service_categories?.name ?? 'General'
    if (!map.has(categoryName)) {
      map.set(categoryName, [])
    }
    map.get(categoryName)!.push(service)
  }
  return map
}

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-id',
    owner_user_id: 'user-id',
    category_id: null,
    name: 'Test Service',
    duration_minutes: 60,
    price: 5000,
    is_active: true,
    deposit_type: 'none',
    deposit_value: 0,
    deposit_required: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getServicesByCategory grouping logic', () => {
  it('groups services with categories correctly', () => {
    const services: Service[] = [
      makeService({ id: '1', name: 'Cut', service_categories: { id: 'cat-1', owner_user_id: 'user', name: 'Hair', sort_order: 1, created_at: '', updated_at: '' } }),
      makeService({ id: '2', name: 'Colour', service_categories: { id: 'cat-1', owner_user_id: 'user', name: 'Hair', sort_order: 1, created_at: '', updated_at: '' } }),
      makeService({ id: '3', name: 'Manicure', service_categories: { id: 'cat-2', owner_user_id: 'user', name: 'Nails', sort_order: 2, created_at: '', updated_at: '' } }),
    ]

    const grouped = groupServicesByCategory(services)
    expect(grouped.get('Hair')).toHaveLength(2)
    expect(grouped.get('Nails')).toHaveLength(1)
    expect(grouped.get('General')).toBeUndefined()
  })

  it('places services without category under General', () => {
    const services: Service[] = [
      makeService({ id: '1', name: 'Waxing', category_id: null, service_categories: undefined }),
      makeService({ id: '2', name: 'Threading', category_id: null, service_categories: undefined }),
    ]

    const grouped = groupServicesByCategory(services)
    expect(grouped.get('General')).toHaveLength(2)
    expect(grouped.size).toBe(1)
  })

  it('mixes categorised and uncategorised services correctly', () => {
    const services: Service[] = [
      makeService({ id: '1', name: 'Cut', service_categories: { id: 'cat-1', owner_user_id: 'user', name: 'Hair', sort_order: 1, created_at: '', updated_at: '' } }),
      makeService({ id: '2', name: 'Waxing', category_id: null, service_categories: undefined }),
    ]

    const grouped = groupServicesByCategory(services)
    expect(grouped.get('Hair')).toHaveLength(1)
    expect(grouped.get('General')).toHaveLength(1)
    expect(grouped.size).toBe(2)
  })
})
