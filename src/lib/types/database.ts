// WorkingHours — canonical shape for profiles.working_hours JSONB
export interface DaySchedule {
  enabled: boolean
  start: string // "HH:MM" format e.g. "09:00"
  end: string   // "HH:MM" format e.g. "17:00"
}

export interface WorkingHours {
  mon: DaySchedule
  tue: DaySchedule
  wed: DaySchedule
  thu: DaySchedule
  fri: DaySchedule
  sat: DaySchedule
  sun: DaySchedule
}

export interface Profile {
  id: string
  owner_user_id: string
  trading_name: string | null
  phone: string | null
  address: string | null
  default_slot_minutes: number
  working_hours: WorkingHours
  timezone: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface ServiceCategory {
  id: string
  owner_user_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  owner_user_id: string
  category_id: string | null
  name: string
  duration_minutes: number
  price: number // INTEGER pennies
  is_active: boolean
  deposit_type: 'none' | 'fixed' | 'percentage'
  deposit_value: number // INTEGER pennies for fixed, percentage points for percentage
  deposit_required: boolean
  created_at: string
  updated_at: string
  // Joined fields (optional, from .select() with joins)
  service_categories?: ServiceCategory
}

export interface Client {
  id: string
  owner_user_id: string
  first_name: string
  last_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  marketing_consent: boolean
  created_at: string
  updated_at: string
  // Joined fields
  client_tags?: Array<{ tag_id: string; tags: Tag }>
}

export interface ClientNote {
  id: string
  owner_user_id: string
  client_id: string
  note_type: 'general' | 'colour_formula' | 'treatment'
  content: string
  created_at: string
  updated_at: string
}

export interface ColourFormula {
  id: string
  owner_user_id: string
  client_id: string
  formula: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  owner_user_id: string
  name: string
  created_at: string
}

export interface ClientTag {
  id: string
  owner_user_id: string
  client_id: string
  tag_id: string
  created_at: string
}

// Appointment status union type
export type AppointmentStatus = 'booked' | 'completed' | 'cancelled' | 'no_show'

// Appointment — maps to public.appointments table
export interface Appointment {
  id: string
  owner_user_id: string
  client_id: string
  starts_at: string  // ISO 8601 TIMESTAMPTZ
  ends_at: string    // ISO 8601 TIMESTAMPTZ
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields (optional, from .select() with joins)
  clients?: { first_name: string; last_name: string | null }
  appointment_services?: AppointmentService[]
}

// AppointmentService — maps to public.appointment_services table (snapshot at booking time)
export interface AppointmentService {
  id: string
  owner_user_id: string
  appointment_id: string
  service_id: string
  service_name: string         // snapshot
  service_price: number        // integer pennies, snapshot
  service_duration_minutes: number  // snapshot
  created_at: string
}

// Payment method union type
export type PaymentMethod = 'cash' | 'card'

// Payment type union type
export type PaymentType = 'payment' | 'refund' | 'void'

// Payment -- maps to public.payments table
export interface Payment {
  id: string
  owner_user_id: string
  appointment_id: string | null
  client_id: string
  amount: number  // INTEGER pennies
  method: PaymentMethod
  payment_type: PaymentType
  reference_payment_id: string | null
  notes: string | null
  paid_at: string  // ISO 8601 TIMESTAMPTZ
  created_at: string
  // Joined fields (optional, from .select() with joins)
  clients?: { first_name: string; last_name: string | null }
  appointments?: { starts_at: string }
}

// AuditLogEntry -- maps to public.audit_log table
export interface AuditLogEntry {
  id: string
  owner_user_id: string
  action: string
  entity_type: string
  entity_id: string
  details: Record<string, unknown> | null
  created_at: string
}
