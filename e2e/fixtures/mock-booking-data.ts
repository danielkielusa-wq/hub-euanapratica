/**
 * Mock data for booking E2E tests.
 * All time-sensitive dates are generated dynamically by helper functions in helpers.ts.
 */

export const MOCK_SERVICE_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
export const MOCK_BOOKING_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
export const MOCK_MENTOR_ID = 'cccccccc-0000-0000-0000-000000000003';
export const MOCK_STUDENT_ID = 'dddddddd-0000-0000-0000-000000000004';
export const MOCK_MENTOR_SERVICE_ID = 'eeeeeeee-0000-0000-0000-000000000005';

/** hub_services row */
export const mockHubService = {
  id: MOCK_SERVICE_ID,
  name: 'Sessão de Mentoria',
  description: 'Sessão individual de mentoria de carreira',
  service_type: 'consulting',
  icon_name: 'calendar',
  is_active: true,
  is_visible_in_hub: true,
};

/** mentor profile */
export const mockMentorProfile = {
  id: MOCK_MENTOR_ID,
  full_name: 'Ana Mentora',
  email: 'ana@teste.com',
  profile_photo_url: null,
};

/** student profile */
export const mockStudentProfile = {
  id: MOCK_STUDENT_ID,
  full_name: 'Carlos Aluno',
  email: 'carlos@teste.com',
  profile_photo_url: null,
};

/** mentor_services row — returned by useMentorForService as single object */
export const mockMentorService = {
  id: MOCK_MENTOR_SERVICE_ID,
  mentor_id: MOCK_MENTOR_ID,
  service_id: MOCK_SERVICE_ID,
  is_active: true,
  slot_duration_minutes: 60,
  buffer_minutes: 15,
  default_meeting_link: 'https://meet.google.com/test-meeting',
  service: mockHubService,
  mentor: mockMentorProfile,
};

/** booking_policies row — global policy */
export const mockBookingPolicy = {
  id: 'pppppppp-0000-0000-0000-000000000006',
  service_id: null,
  max_concurrent_bookings: 3,
  max_reschedules_per_booking: 2,
  min_notice_hours: 48,
  max_advance_days: 30,
  cancellation_window_hours: 24,
  default_duration_minutes: 60,
  slot_interval_minutes: 30,
  is_active: true,
};

/** Booking stats — returned by get_student_booking_stats RPC */
export const mockBookingStats = {
  total_bookings: 3,
  upcoming_bookings: 1,
  completed_bookings: 1,
  cancelled_bookings: 1,
  no_show_bookings: 0,
  remaining_slots: 2,
};

/** Booking stats with zero remaining — for limit-reached tests */
export const mockBookingStatsLimitReached = {
  ...mockBookingStats,
  upcoming_bookings: 3,
  remaining_slots: 0,
};

/** Session credits — returned by get_service_session_info RPC */
export const mockSessionCredits = {
  sessions_total: null,
  sessions_used: 0,
  upcoming_confirmed: 1,
  available: null, // null = unlimited
};

/**
 * Booking template — no scheduled_start/scheduled_end.
 * Use buildFutureBooking() from helpers.ts to add dynamic dates.
 */
export const mockUpcomingBookingTemplate = {
  id: MOCK_BOOKING_ID,
  student_id: MOCK_STUDENT_ID,
  mentor_id: MOCK_MENTOR_ID,
  service_id: MOCK_SERVICE_ID,
  mentor_service_id: MOCK_MENTOR_SERVICE_ID,
  duration_minutes: 60,
  status: 'confirmed',
  meeting_link: 'https://meet.google.com/test-meeting',
  student_notes: null,
  mentor_notes: null,
  reschedule_count: 0,
  original_datetime: null,
  last_rescheduled_at: null,
  cancelled_at: null,
  cancelled_by: null,
  cancellation_reason: null,
  completed_at: null,
  created_at: '2026-02-20T10:00:00Z',
  updated_at: '2026-02-20T10:00:00Z',
  // Embedded joins (PostgREST format)
  service: {
    id: MOCK_SERVICE_ID,
    name: 'Sessão de Mentoria',
    description: 'Sessão individual de mentoria',
    icon_name: 'calendar',
  },
  mentor: mockMentorProfile,
};

/** Past completed booking */
export const mockPastBooking = {
  ...mockUpcomingBookingTemplate,
  id: 'ffffffff-0000-0000-0000-000000000007',
  status: 'completed',
  scheduled_start: '2026-02-10T14:00:00Z',
  scheduled_end: '2026-02-10T15:00:00Z',
  completed_at: '2026-02-10T15:05:00Z',
  mentor_notes: 'Sessão produtiva, definimos próximos passos.',
};

/** user_hub_services row — student has access to the mock service */
export const mockUserHubServiceAccess = {
  id: 'hhhhhhhh-0000-0000-0000-000000000008',
  user_id: MOCK_STUDENT_ID,
  service_id: MOCK_SERVICE_ID,
  status: 'active',
  access_source: 'purchase',
  sessions_total: null,
  sessions_used: 0,
  metadata: {},
  started_at: '2026-02-01T00:00:00Z',
  expires_at: null,
};
