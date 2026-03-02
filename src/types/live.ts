export type LiveAccessType = 'free' | 'paid' | 'subscribers' | 'pro' | 'vip';
export type LiveStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled' | 'expired';

export interface Live {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  thumbnail_url: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  access_type: LiveAccessType;
  price: number;
  ticto_product_id: string | null;
  ticto_checkout_url: string | null;
  max_attendees: number | null;
  mentor_id: string;
  status: LiveStatus;
  recording_url: string | null;
  og_image_url: string | null;
  mentor_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveWithMentor extends Live {
  mentor: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  } | null;
  registration_count: number;
}

export interface LiveRegistration {
  id: string;
  live_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  payment_status: 'none' | 'pending' | 'paid' | 'refunded';
}

export interface LiveRegistrationWithProfile extends LiveRegistration {
  profile: {
    full_name: string;
    email: string;
    profile_photo_url: string | null;
  } | null;
}

export interface LiveAccessCheck {
  allowed: boolean;
  reason: string;
  registered?: boolean;
  checkout_url?: string;
  price?: number;
  required?: string;
}

export interface CreateLiveInput {
  title: string;
  slug: string;
  description?: string;
  long_description?: string;
  thumbnail_url?: string;
  scheduled_at: string;
  duration_minutes?: number;
  meeting_link?: string;
  access_type: LiveAccessType;
  price?: number;
  ticto_product_id?: string;
  ticto_checkout_url?: string;
  max_attendees?: number | null;
  status?: LiveStatus;
  og_image_url?: string;
  recording_url?: string;
  mentor_notes?: string;
}

export type UpdateLiveInput = Partial<CreateLiveInput> & { id: string };

export const ACCESS_TYPE_LABELS: Record<LiveAccessType, string> = {
  free: 'Gratuita',
  paid: 'Paga',
  subscribers: 'Assinantes',
  pro: 'Pro / VIP',
  vip: 'Apenas VIP',
};

export const ACCESS_TYPE_COLORS: Record<LiveAccessType, string> = {
  free: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  paid: 'bg-amber-100 text-amber-700 border-amber-200',
  subscribers: 'bg-blue-100 text-blue-700 border-blue-200',
  pro: 'bg-violet-100 text-violet-700 border-violet-200',
  vip: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

export const STATUS_LABELS: Record<LiveStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  live: 'Ao Vivo',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  expired: 'Expirada',
};

export const STATUS_COLORS: Record<LiveStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-100 text-blue-700',
  live: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-400',
  expired: 'bg-orange-100 text-orange-700',
};
