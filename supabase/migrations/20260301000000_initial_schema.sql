-- SoloStylist Initial Database Schema
-- All monetary values are INTEGER (pennies), never float/decimal
-- All timestamps use TIMESTAMPTZ
-- All tables use UUID primary keys with RLS enabled

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================================================
-- TABLE 1: profiles
-- Business profile (one per user). id matches auth.users(id) exactly.
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_name TEXT,
  phone TEXT,
  address TEXT,
  default_slot_minutes INTEGER NOT NULL DEFAULT 15,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 2: service_categories
-- Service groupings for organising the service catalogue
-- =============================================================================
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_categories_select_own" ON public.service_categories
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "service_categories_insert_own" ON public.service_categories
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "service_categories_update_own" ON public.service_categories
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "service_categories_delete_own" ON public.service_categories
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 3: services
-- Service catalogue with pricing and deposit configuration
-- =============================================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deposit_type TEXT NOT NULL DEFAULT 'none' CHECK (deposit_type IN ('none', 'fixed', 'percentage')),
  deposit_value INTEGER NOT NULL DEFAULT 0,
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_own" ON public.services
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "services_insert_own" ON public.services
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "services_update_own" ON public.services
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "services_delete_own" ON public.services
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 4: clients
-- Client records with contact information and marketing consent
-- =============================================================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "clients_insert_own" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "clients_delete_own" ON public.clients
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 5: client_notes
-- General notes, colour formulas, and treatment records per client
-- =============================================================================
CREATE TABLE public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'colour_formula', 'treatment')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_notes_select_own" ON public.client_notes
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "client_notes_insert_own" ON public.client_notes
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "client_notes_update_own" ON public.client_notes
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "client_notes_delete_own" ON public.client_notes
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 6: colour_formulas
-- Dedicated colour formula records with structured data separate from notes
-- =============================================================================
CREATE TABLE public.colour_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  formula TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.colour_formulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colour_formulas_select_own" ON public.colour_formulas
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "colour_formulas_insert_own" ON public.colour_formulas
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "colour_formulas_update_own" ON public.colour_formulas
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "colour_formulas_delete_own" ON public.colour_formulas
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 7: tags
-- Tag definitions with unique name constraint per user
-- =============================================================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select_own" ON public.tags
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "tags_insert_own" ON public.tags
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "tags_update_own" ON public.tags
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "tags_delete_own" ON public.tags
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 8: client_tags
-- Junction table linking clients to tags (many-to-many)
-- =============================================================================
CREATE TABLE public.client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, tag_id)
);

ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_tags_select_own" ON public.client_tags
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "client_tags_insert_own" ON public.client_tags
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "client_tags_update_own" ON public.client_tags
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "client_tags_delete_own" ON public.client_tags
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 9: appointments
-- Booking records with exclusion constraint preventing double-booking
-- =============================================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  EXCLUDE USING gist (owner_user_id WITH =, tstzrange(starts_at, ends_at) WITH &&) WHERE (status = 'booked')
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_own" ON public.appointments
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "appointments_insert_own" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "appointments_update_own" ON public.appointments
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "appointments_delete_own" ON public.appointments
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 10: appointment_services
-- Junction table linking appointments to services (multi-service bookings)
-- Snapshots service details at booking time
-- =============================================================================
CREATE TABLE public.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,
  service_price INTEGER NOT NULL,
  service_duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointment_services_select_own" ON public.appointment_services
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "appointment_services_insert_own" ON public.appointment_services
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "appointment_services_update_own" ON public.appointment_services
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "appointment_services_delete_own" ON public.appointment_services
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 11: payments
-- Payment records in pennies (INTEGER). Supports refunds/voids via self-reference.
-- =============================================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card')),
  payment_type TEXT NOT NULL DEFAULT 'payment' CHECK (payment_type IN ('payment', 'refund', 'void')),
  reference_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  notes TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "payments_update_own" ON public.payments
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = owner_user_id)
  WITH CHECK ((select auth.uid()) = owner_user_id);

CREATE POLICY "payments_delete_own" ON public.payments
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = owner_user_id);

-- =============================================================================
-- TABLE 12: audit_log
-- Immutable audit trail — SELECT and INSERT only (no UPDATE or DELETE policies)
-- =============================================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_own" ON public.audit_log
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = owner_user_id);

CREATE POLICY "audit_log_insert_own" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = owner_user_id);

-- Note: No UPDATE or DELETE policies for audit_log — it is append-only by design

-- =============================================================================
-- PROFILE AUTO-CREATION TRIGGER
-- Automatically creates a profiles row when a new auth.users row is inserted
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, owner_user_id, onboarding_completed)
  VALUES (NEW.id, NEW.id, false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Client search by name
CREATE INDEX idx_clients_owner_name ON public.clients (owner_user_id, first_name, last_name);

-- Client search by phone
CREATE INDEX idx_clients_owner_phone ON public.clients (owner_user_id, phone);

-- Diary view (appointments by date)
CREATE INDEX idx_appointments_owner_date ON public.appointments (owner_user_id, starts_at);

-- Daily payment totals
CREATE INDEX idx_payments_owner_date ON public.payments (owner_user_id, paid_at);

-- Payment lookup by appointment
CREATE INDEX idx_payments_appointment ON public.payments (appointment_id);

-- Notes per client
CREATE INDEX idx_client_notes_client ON public.client_notes (client_id);

-- Services per appointment
CREATE INDEX idx_appointment_services_appointment ON public.appointment_services (appointment_id);
