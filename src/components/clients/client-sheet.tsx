'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createClient } from '@/lib/actions/clients'

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().email('Invalid email address').or(z.literal('')).default(''),
  address: z.string().default(''),
  marketing_consent: z.boolean().default(false),
})

type ClientFormValues = z.infer<typeof clientSchema>

interface ClientSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientSheet({ open, onOpenChange }: ClientSheetProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      marketing_consent: false,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    const result = await createClient(values as ClientFormValues)
    if (result.error) {
      // Server-level error — show generic message (field errors handled by react-hook-form)
      console.error('Create client error:', result.error)
      return
    }
    reset()
    router.refresh()
    onOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-bold text-gray-900">Add Client</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-6 flex flex-col gap-4">
          {/* First name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              First name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('first_name')}
              type="text"
              autoComplete="given-name"
              placeholder="e.g. Sarah"
              className="rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name.message}</p>
            )}
          </div>

          {/* Last name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Last name</label>
            <input
              {...register('last_name')}
              type="text"
              autoComplete="family-name"
              placeholder="e.g. Johnson"
              className="rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              {...register('phone')}
              type="text"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 07700 900000"
              className="rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="text"
              inputMode="email"
              autoComplete="email"
              placeholder="e.g. sarah@example.com"
              className="rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <textarea
              {...register('address')}
              rows={2}
              placeholder="e.g. 12 Main Street, London"
              className="rounded-xl border border-gray-200 py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
            />
          </div>

          {/* Marketing consent */}
          <div className="flex items-center gap-3">
            <input
              {...register('marketing_consent')}
              type="checkbox"
              id="marketing_consent"
              className="w-5 h-5 rounded border-gray-300 accent-black"
            />
            <label htmlFor="marketing_consent" className="text-sm font-medium text-gray-700">
              Consent to marketing messages
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white font-medium rounded-xl py-3 text-sm hover:bg-gray-900 active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Saving...' : 'Add Client'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
