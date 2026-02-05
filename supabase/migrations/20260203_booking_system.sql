-- ============================================
-- BOOKING SYSTEM MIGRATION
-- ============================================
-- This migration creates all tables, enums, indexes,
-- RLS policies, and functions for the 1:1 mentoring booking system.

-- ============================================
-- ENUMS
-- ============================================

-- Booking status enum
CREATE TYPE public.booking_status AS ENUM (
  'confirmed',    -- Booking is active and confirmed
  'completed',    -- Session happened and was marked complete
  'cancelled',    -- Cancelled by student or mentor
  'no_show'       -- Student didn't attend
);

-- Booking history action types
CREATE TYPE public.booking_action AS ENUM (
  'created',
  'rescheduled',
  'cancelled',
  'completed',
  'no_show_marked'
);

-- Day of week enum for recurring availability
CREATE TYPE public.day_of_week AS ENUM (
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
);

-- ============================================
-- TABLES
-- ============================================

-- 1. mentor_services: Links mentors to services they can provide
CREATE TABLE public.mentor_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.hub_services(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    slot_duration_minutes INTEGER DEFAULT 60,
    buffer_minutes INTEGER DEFAULT 15,
    price_override DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (mentor_id, service_id)
);

COMMENT ON TABLE public.mentor_services IS 'Links mentors to the services they can provide for 1:1 bookings';

-- 2. mentor_availability: Recurring weekly availability
CREATE TABLE public.mentor_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    day_of_week day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

COMMENT ON TABLE public.mentor_availability IS 'Recurring weekly availability windows for mentors';

-- 3. mentor_blocked_times: Specific blocked periods
CREATE TABLE public.mentor_blocked_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_block_range CHECK (start_datetime < end_datetime)
);

COMMENT ON TABLE public.mentor_blocked_times IS 'Specific time periods when a mentor is unavailable (vacations, holidays, etc.)';

-- 4. booking_policies: System-wide and service-specific rules
CREATE TABLE public.booking_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.hub_services(id) ON DELETE CASCADE,
    max_concurrent_bookings INTEGER DEFAULT 3,
    max_reschedules_per_booking INTEGER DEFAULT 2,
    min_notice_hours INTEGER DEFAULT 48,
    max_advance_days INTEGER DEFAULT 30,
    cancellation_window_hours INTEGER DEFAULT 24,
    default_duration_minutes INTEGER DEFAULT 60,
    slot_interval_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_service_policy UNIQUE (service_id)
);

COMMENT ON TABLE public.booking_policies IS 'Booking rules - NULL service_id means global default policy';

-- 5. bookings: Core booking table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Service reference
    service_id UUID REFERENCES public.hub_services(id) ON DELETE SET NULL NOT NULL,
    mentor_service_id UUID REFERENCES public.mentor_services(id) ON DELETE SET NULL,

    -- Timing (stored in UTC)
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,

    -- Metadata
    status booking_status DEFAULT 'confirmed',
    meeting_link TEXT,
    student_notes TEXT,

    -- Rescheduling tracking
    reschedule_count INTEGER DEFAULT 0,
    original_datetime TIMESTAMPTZ,
    last_rescheduled_at TIMESTAMPTZ,

    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id),
    cancellation_reason TEXT,

    -- Completion
    completed_at TIMESTAMPTZ,
    mentor_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_booking_range CHECK (scheduled_start < scheduled_end),
    CONSTRAINT valid_reschedule_count CHECK (reschedule_count >= 0)
);

COMMENT ON TABLE public.bookings IS 'Core table for 1:1 mentoring session bookings';

-- 6. booking_history: Audit trail for all booking changes
CREATE TABLE public.booking_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    action booking_action NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    old_datetime TIMESTAMPTZ,
    new_datetime TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.booking_history IS 'Audit trail for all booking changes';

-- ============================================
-- INDEXES
-- ============================================

-- mentor_services indexes
CREATE INDEX idx_mentor_services_mentor_id ON public.mentor_services(mentor_id);
CREATE INDEX idx_mentor_services_service_id ON public.mentor_services(service_id);
CREATE INDEX idx_mentor_services_active ON public.mentor_services(is_active) WHERE is_active = TRUE;

-- mentor_availability indexes
CREATE INDEX idx_mentor_availability_mentor_id ON public.mentor_availability(mentor_id);
CREATE INDEX idx_mentor_availability_day ON public.mentor_availability(day_of_week);
CREATE INDEX idx_mentor_availability_active ON public.mentor_availability(is_active) WHERE is_active = TRUE;

-- mentor_blocked_times indexes
CREATE INDEX idx_mentor_blocked_times_mentor_id ON public.mentor_blocked_times(mentor_id);
CREATE INDEX idx_mentor_blocked_times_range ON public.mentor_blocked_times(start_datetime, end_datetime);

-- bookings indexes
CREATE INDEX idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX idx_bookings_mentor_id ON public.bookings(mentor_id);
CREATE INDEX idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_scheduled_start ON public.bookings(scheduled_start);
CREATE INDEX idx_bookings_student_upcoming ON public.bookings(student_id, scheduled_start)
    WHERE status = 'confirmed';

-- CRITICAL: Race condition prevention - prevents overlapping bookings for same mentor
CREATE UNIQUE INDEX idx_bookings_mentor_no_overlap
    ON public.bookings(mentor_id, scheduled_start)
    WHERE status = 'confirmed';

-- booking_history indexes
CREATE INDEX idx_booking_history_booking_id ON public.booking_history(booking_id);
CREATE INDEX idx_booking_history_action ON public.booking_history(action);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.mentor_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;

-- mentor_services policies
CREATE POLICY "Anyone can read active mentor services"
ON public.mentor_services FOR SELECT TO authenticated
USING (is_active = TRUE);

CREATE POLICY "Mentors manage own services"
ON public.mentor_services FOR ALL TO authenticated
USING (mentor_id = auth.uid());

CREATE POLICY "Admins manage all mentor services"
ON public.mentor_services FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- mentor_availability policies
CREATE POLICY "Anyone can read active availability"
ON public.mentor_availability FOR SELECT TO authenticated
USING (is_active = TRUE);

CREATE POLICY "Mentors manage own availability"
ON public.mentor_availability FOR ALL TO authenticated
USING (mentor_id = auth.uid());

CREATE POLICY "Admins manage all availability"
ON public.mentor_availability FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- mentor_blocked_times policies
CREATE POLICY "Anyone can read blocked times for scheduling"
ON public.mentor_blocked_times FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "Mentors manage own blocked times"
ON public.mentor_blocked_times FOR ALL TO authenticated
USING (mentor_id = auth.uid());

CREATE POLICY "Admins manage all blocked times"
ON public.mentor_blocked_times FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- booking_policies policies
CREATE POLICY "Anyone can read policies"
ON public.booking_policies FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "Admins manage policies"
ON public.booking_policies FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- bookings policies
CREATE POLICY "Students can view own bookings"
ON public.bookings FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Mentors can view assigned bookings"
ON public.bookings FOR SELECT TO authenticated
USING (mentor_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Students can create bookings"
ON public.bookings FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Mentors can update assigned bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (mentor_id = auth.uid());

CREATE POLICY "Admins can update all bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- booking_history policies
CREATE POLICY "Users can view history of own bookings"
ON public.booking_history FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = booking_id
        AND (b.student_id = auth.uid() OR b.mentor_id = auth.uid())
    )
);

CREATE POLICY "Admins can view all history"
ON public.booking_history FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "System can insert history"
ON public.booking_history FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert global default booking policy
INSERT INTO public.booking_policies (
    service_id,
    max_concurrent_bookings,
    max_reschedules_per_booking,
    min_notice_hours,
    max_advance_days,
    cancellation_window_hours,
    default_duration_minutes,
    slot_interval_minutes
) VALUES (
    NULL,  -- Global policy (no specific service)
    3,     -- Max 3 concurrent bookings
    2,     -- Max 2 reschedules per booking
    48,    -- Min 48 hours notice (2 days)
    30,    -- Max 30 days in advance
    24,    -- Must cancel 24 hours before
    60,    -- Default 60 minute sessions
    30     -- Slots every 30 minutes
);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_mentor_services_updated_at
    BEFORE UPDATE ON public.mentor_services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentor_availability_updated_at
    BEFORE UPDATE ON public.mentor_availability
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_policies_updated_at
    BEFORE UPDATE ON public.booking_policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
