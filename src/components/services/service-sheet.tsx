'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createService, updateService, createCategory } from '@/lib/actions/services'
import { formatPrice, parsePriceToPennies } from '@/lib/utils'
import type { Service, ServiceCategory } from '@/lib/types/database'

// Client-side form schema (price as string for display)
const formSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  duration_minutes: z.coerce.number().int().min(5, 'Duration must be at least 5 minutes'),
  priceDisplay: z.string().min(1, 'Price is required'),
  category_id: z.string().nullable().optional(),
  deposit_type: z.enum(['none', 'fixed', 'percentage']),
  depositValueDisplay: z.string().optional().default('0'),
  deposit_required: z.boolean().default(false),
})

type FormValues = z.infer<typeof formSchema>

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 hours' },
]

interface ServiceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service
  categories: ServiceCategory[]
}

export function ServiceSheet({ open, onOpenChange, service, categories: initialCategories }: ServiceSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [localCategories, setLocalCategories] = useState<ServiceCategory[]>(initialCategories)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // Keep local categories in sync with prop
  useEffect(() => {
    setLocalCategories(initialCategories)
  }, [initialCategories])

  const isEditing = !!service

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      name: '',
      duration_minutes: 60,
      priceDisplay: '0.00',
      category_id: null,
      deposit_type: 'none',
      depositValueDisplay: '0',
      deposit_required: false,
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (service) {
        reset({
          name: service.name,
          duration_minutes: service.duration_minutes,
          priceDisplay: (service.price / 100).toFixed(2),
          category_id: service.category_id ?? null,
          deposit_type: service.deposit_type,
          depositValueDisplay: service.deposit_type === 'percentage'
            ? String(service.deposit_value)
            : (service.deposit_value / 100).toFixed(2),
          deposit_required: service.deposit_required,
        })
      } else {
        reset({
          name: '',
          duration_minutes: 60,
          priceDisplay: '0.00',
          category_id: null,
          deposit_type: 'none',
          depositValueDisplay: '0',
          deposit_required: false,
        })
      }
      setServerError(null)
      setShowNewCategoryInput(false)
      setNewCategoryName('')
    }
  }, [open, service, reset])

  const depositType = watch('deposit_type')

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    setIsCreatingCategory(true)

    const result = await createCategory({ name: newCategoryName.trim() })

    if (result && 'data' in result && result.data) {
      const newCat = result.data as ServiceCategory
      setLocalCategories(prev => [...prev, newCat])
      setValue('category_id', newCat.id)
      setShowNewCategoryInput(false)
      setNewCategoryName('')
    }

    setIsCreatingCategory(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onSubmit(values: any) {
    setServerError(null)
    const typedValues = values as FormValues
    const price = parsePriceToPennies(typedValues.priceDisplay)
    let depositValue = 0
    if (values.deposit_type === 'percentage') {
      depositValue = parseInt(values.depositValueDisplay ?? '0', 10) || 0
    } else if (values.deposit_type === 'fixed') {
      depositValue = parsePriceToPennies(values.depositValueDisplay ?? '0')
    }

    const serviceData = {
      name: values.name,
      duration_minutes: values.duration_minutes,
      price,
      category_id: values.category_id && values.category_id !== '__none__' ? values.category_id : null,
      deposit_type: values.deposit_type,
      deposit_value: depositValue,
      deposit_required: values.deposit_required,
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateService(service!.id, serviceData)
        : await createService(serviceData)

      if (result && 'error' in result && result.error) {
        const err = result.error
        if (typeof err === 'string') {
          setServerError(err)
        } else if ('_form' in err && Array.isArray(err._form)) {
          setServerError(err._form[0] ?? 'Something went wrong')
        } else {
          setServerError('Something went wrong. Please try again.')
        }
        return
      }

      onOpenChange(false)
    })
  }

  const inputClass = 'w-full rounded-xl py-3 px-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20 text-sm bg-white'
  const selectClass = 'w-full rounded-xl py-3 px-4 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20 text-sm bg-white appearance-none'
  const errorClass = 'text-red-500 text-xs mt-1'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto pb-safe p-0">
        <SheetHeader className="px-4 pt-6 pb-4 border-b border-gray-100">
          <SheetTitle className="text-lg font-bold text-black">
            {isEditing ? 'Edit Service' : 'Add Service'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Name
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Full Head Colour"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          {/* Duration */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Duration
            </label>
            <select {...register('duration_minutes', { valueAsNumber: true })} className={selectClass}>
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.duration_minutes && (
              <p className={errorClass}>{errors.duration_minutes.message}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                £
              </span>
              <input
                {...register('priceDisplay')}
                inputMode="decimal"
                placeholder="0.00"
                className={`${inputClass} pl-8`}
              />
            </div>
            {errors.priceDisplay && (
              <p className={errorClass}>{errors.priceDisplay.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>
            <select
              {...register('category_id')}
              className={selectClass}
              onChange={e => {
                const val = e.target.value
                if (val === '__new__') {
                  setShowNewCategoryInput(true)
                  setValue('category_id', null)
                } else {
                  setValue('category_id', val || null)
                  setShowNewCategoryInput(false)
                }
              }}
            >
              <option value="__none__">No category</option>
              {localCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value="__new__">+ Create new category...</option>
            </select>

            {showNewCategoryInput && (
              <div className="flex gap-2 mt-2">
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className={`${inputClass} flex-1`}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateCategory()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="px-4 py-3 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-50 min-h-[44px]"
                >
                  {isCreatingCategory ? '...' : 'Add'}
                </button>
              </div>
            )}
          </div>

          {/* Deposit section */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Deposit
            </label>
            <select {...register('deposit_type')} className={selectClass}>
              <option value="none">No deposit</option>
              <option value="fixed">Fixed amount (£)</option>
              <option value="percentage">Percentage (%)</option>
            </select>

            {depositType !== 'none' && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  {depositType === 'fixed' && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      £
                    </span>
                  )}
                  {depositType === 'percentage' && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      %
                    </span>
                  )}
                  <input
                    {...register('depositValueDisplay')}
                    inputMode="decimal"
                    placeholder={depositType === 'fixed' ? '0.00' : '0'}
                    className={`${inputClass} ${depositType === 'fixed' ? 'pl-8' : 'pr-8'}`}
                  />
                </div>

                <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('deposit_required')}
                    className="w-5 h-5 rounded accent-black"
                  />
                  <span className="text-sm text-gray-700">Require deposit at booking</span>
                </label>
              </div>
            )}
          </div>

          {/* Server error */}
          {serverError && (
            <p className="text-red-500 text-sm text-center">{serverError}</p>
          )}

          {/* Submit */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-black text-white rounded-2xl py-4 font-semibold text-base min-h-[56px] disabled:opacity-50 transition-opacity active:opacity-80"
            >
              {isPending
                ? isEditing ? 'Saving...' : 'Adding...'
                : isEditing ? 'Save Changes' : 'Add Service'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
