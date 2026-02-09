// ============================================
// BOOKING SYSTEM TYPES
// ============================================

// Enum types matching database enums
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type BookingAction = 'created' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show_marked';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// ============================================
// Database Table Types
// ============================================

export interface MentorService {
  id: string;
  mentor_id: string;
  service_id: string;
  is_active: boolean;
  slot_duration_minutes: number;
  buffer_minutes: number;
  price_override: number | null;
  created_at: string;
  updated_at: string;
}

export interface MentorAvailability {
  id: string;
  mentor_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // TIME format: "HH:MM:SS"
  end_time: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MentorBlockedTime {
  id: string;
  mentor_id: string;
  start_datetime: string; // ISO timestamp
  end_datetime: string;
  reason: string | null;
  created_at: string;
}

export interface BookingPolicy {
  id: string;
  service_id: string | null; // null = global policy
  max_concurrent_bookings: number;
  max_reschedules_per_booking: number;
  min_notice_hours: number;
  max_advance_days: number;
  cancellation_window_hours: number;
  default_duration_minutes: number;
  slot_interval_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  student_id: string;
  mentor_id: string | null;
  service_id: string;
  mentor_service_id: string | null;
  scheduled_start: string; // ISO timestamp (UTC)
  scheduled_end: string;
  duration_minutes: number;
  status: BookingStatus;
  meeting_link: string | null;
  student_notes: string | null;
  reschedule_count: number;
  original_datetime: string | null;
  last_rescheduled_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  completed_at: string | null;
  mentor_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingHistory {
  id: string;
  booking_id: string;
  action: BookingAction;
  performed_by: string | null;
  old_datetime: string | null;
  new_datetime: string | null;
  notes: string | null;
  created_at: string;
}

// ============================================
// Extended Types with Relations
// ============================================

export interface BookingWithDetails extends Booking {
  // Joined relations
  service?: {
    id: string;
    name: string;
    description: string | null;
    icon_name: string | null;
  };
  mentor?: {
    id: string;
    full_name: string;
    email: string;
    profile_photo_url: string | null;
  };
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface MentorServiceWithDetails extends MentorService {
  service?: {
    id: string;
    name: string;
    description: string | null;
    icon_name: string | null;
    price: number;
  };
  mentor?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

// ============================================
// Time Slot Types
// ============================================

export interface TimeSlot {
  slot_start: string; // ISO timestamp (UTC)
  slot_end: string;
  mentor_id: string;
  duration_minutes: number;
}

export interface DaySlots {
  date: Date;
  dayOfWeek: DayOfWeek;
  slots: TimeSlot[];
}

export interface WeekSlots {
  startDate: Date;
  endDate: Date;
  days: DaySlots[];
}

// ============================================
// Input Types for Mutations
// ============================================

export interface CreateBookingInput {
  service_id: string;
  scheduled_start: string; // ISO timestamp
  duration_minutes?: number;
  student_notes?: string;
}

export interface RescheduleBookingInput {
  booking_id: string;
  new_start: string; // ISO timestamp
}

export interface CancelBookingInput {
  booking_id: string;
  reason?: string;
}

export interface CompleteBookingInput {
  booking_id: string;
  mentor_notes?: string;
}

// ============================================
// Response Types from RPCs
// ============================================

export interface BookingStats {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  no_show_bookings: number;
  remaining_slots: number;
}

// ============================================
// UI State Types
// ============================================

export interface BookingFlowState {
  step: 'select-time' | 'confirm';
  serviceId: string | null;
  selectedSlot: TimeSlot | null;
  studentNotes: string;
}

export interface BookingFilters {
  status: 'upcoming' | 'past' | 'all';
  serviceId?: string;
}

// ============================================
// Helper Types
// ============================================

export interface BookingPolicyLimits {
  canBook: boolean;
  canReschedule: boolean;
  canCancel: boolean;
  remainingBookings: number;
  remainingReschedules: number;
  hoursUntilSession: number;
  cancellationWindowHours: number;
  message?: string;
}

// Status badge config
export const BOOKING_STATUS_CONFIG: Record<BookingStatus, {
  label: string;
  labelPt: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  confirmed: {
    label: 'Confirmed',
    labelPt: 'Confirmado',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100',
  },
  completed: {
    label: 'Completed',
    labelPt: 'Concluído',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-100',
  },
  cancelled: {
    label: 'Cancelled',
    labelPt: 'Cancelado',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  no_show: {
    label: 'No Show',
    labelPt: 'Não compareceu',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
  },
};

// Day of week labels in Portuguese
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, { short: string; full: string }> = {
  sunday: { short: 'Dom', full: 'Domingo' },
  monday: { short: 'Seg', full: 'Segunda-feira' },
  tuesday: { short: 'Ter', full: 'Terça-feira' },
  wednesday: { short: 'Qua', full: 'Quarta-feira' },
  thursday: { short: 'Qui', full: 'Quinta-feira' },
  friday: { short: 'Sex', full: 'Sexta-feira' },
  saturday: { short: 'Sáb', full: 'Sábado' },
};
