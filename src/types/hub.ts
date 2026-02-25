export type ServiceType = 'ai_tool' | 'live_mentoring' | 'recorded_course' | 'consulting' | 'live_event';
export type ServiceStatus = 'available' | 'premium' | 'coming_soon';
export type ProductType = 'one_time' | 'lifetime' | 'subscription_monthly' | 'subscription_annual';

export interface ServiceLandingPageData {
  hero?: {
    subtitle?: string;
    tagline?: string;
  };
  mentor?: {
    name: string;
    initials: string;
    title: string;
    quote?: string;
  };
  benefits_section?: {
    title?: string;
    description?: string;
  };
  benefits?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  target_audience?: Array<{
    title: string;
    description: string;
  }>;
  faq_section?: {
    title: string;
    description: string;
  };
}

export interface ThankYouPageData {
  hero?: {
    title_line1?: string;
    title_gradient?: string;
    description?: string;
  };
  product_summary?: {
    icon?: string;
    product_name?: string;
    product_detail?: string;
  };
  primary_action?: {
    label?: string;
    url?: string;
  };
  credit_incentive?: {
    title?: string;
    description?: string;
    validity_days?: number;
  };
  next_steps?: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
}

export interface HubService {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  status: ServiceStatus;
  service_type: ServiceType;
  ribbon: string | null;
  category: string | null;
  route: string | null;
  redirect_url: string | null;
  cta_text: string;

  // Display
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  accent_color: string | null;

  // Pricing
  price: number;
  anchor_price: number | null;
  price_display: string | null;
  currency: string;
  product_type: ProductType;
  stripe_price_id: string | null;

  // URLs
  landing_page_url: string | null;

  // Ticto integration
  ticto_product_id: string | null;
  ticto_checkout_url: string | null;

  // Course link
  espaco_id: string | null;

  // Landing page data
  duration: string | null;
  meeting_type: string | null;
  landing_page_data: ServiceLandingPageData | null;

  // Thank-you page data
  thank_you_page_data: ThankYouPageData | null;

  // Plan feature linking (e.g. 'resume_pass', 'title_translator')
  plan_feature_key: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================
// Meu Hub — unified access center types
// ============================================

import type { BookingWithDetails } from '@/types/booking';

export type AccessSource = 'purchase' | 'plan' | 'admin_grant' | 'free';

export type ComputedStatus =
  | 'needs_action'   // consulting: comprado mas não agendado
  | 'scheduled'      // consulting: sessão confirmada
  | 'active'         // live_mentoring / ai_tool / recorded_course em andamento
  | 'upcoming'       // live_event: evento futuro
  | 'not_started'    // recorded_course: sem progresso
  | 'completed';     // qualquer tipo: concluído

export interface UserHubService {
  id: string;
  user_id: string;
  service_id: string;
  status: 'active' | 'expired' | 'cancelled';
  access_source: AccessSource;
  sessions_total: number | null;
  sessions_used: number;
  metadata: Record<string, unknown>;
  started_at: string | null;
  expires_at: string | null;
}

export interface MyHubItem {
  user_service_id: string;
  service: HubService;
  access_source: AccessSource;
  sessions_total: number | null;
  sessions_used: number;
  computed_status: ComputedStatus;
  booking?: BookingWithDetails;           // consulting: booking mais recente
  next_session_datetime?: string;         // live_mentoring: próxima sessão
  metadata: Record<string, unknown>;
}

export type HubSectionId = 'needs_action' | 'active' | 'upcoming' | 'history';

export interface HubSection {
  id: HubSectionId;
  label: string;
  items: MyHubItem[];
}

export interface HubServiceFormData {
  name: string;
  description: string;
  icon_name: string;
  status: ServiceStatus;
  service_type: ServiceType;
  ribbon: string | null;
  category: string;
  route: string;
  redirect_url: string;
  cta_text: string;
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  accent_color: string;
  landing_page_url: string;
  price: number;
  anchor_price: number | null;
  price_display: string;
  currency: string;
  product_type: ProductType;
  stripe_price_id: string;
  // Ticto fields
  ticto_product_id: string;
  ticto_checkout_url: string;
  // Landing page fields
  duration: string;
  meeting_type: string;
  landing_page_data: ServiceLandingPageData | null;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ai_tool: 'Ferramenta IA',
  live_mentoring: 'Mentoria ao Vivo',
  recorded_course: 'Curso Gravado',
  consulting: 'Consultoria',
  live_event: 'Evento ao Vivo',
};

export const RIBBON_OPTIONS = [
  { value: '', label: 'Nenhum' },
  { value: 'NOVO', label: 'NOVO' },
  { value: 'POPULAR', label: 'POPULAR' },
  { value: 'EXCLUSIVO', label: 'EXCLUSIVO' },
];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  one_time: 'Compra Única',
  lifetime: 'Acesso Vitalício',
  subscription_monthly: 'Assinatura Mensal',
  subscription_annual: 'Assinatura Anual',
};
