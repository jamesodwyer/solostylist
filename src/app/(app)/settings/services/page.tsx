import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Service, ServiceCategory } from '@/lib/types/database'
import { ServicesList } from '@/components/services/services-list'

export default async function ServicesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const [servicesResult, categoriesResult] = await Promise.all([
    supabase
      .from('services')
      .select('*, service_categories(*)')
      .eq('owner_user_id', user.id)
      .order('name'),
    supabase
      .from('service_categories')
      .select('*')
      .eq('owner_user_id', user.id)
      .order('sort_order'),
  ])

  const services = (servicesResult.data ?? []) as Service[]
  const categories = (categoriesResult.data ?? []) as ServiceCategory[]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="px-4 pt-10 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Services</h1>
      </div>

      <ServicesList services={services} categories={categories} />
    </div>
  )
}
