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

  // Report dimension linking (for personalized upsell)
  report_dimension: string | null;

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
  remaining_bookable: number;             // sessions_total - sessions_used - confirmed_bookings
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

// ============================================
// Hub Dashboard Config (admin-configurable)
// ============================================

export type HubDashboardSectionId =
  | 'career_hero'
  | 'smart_next_step'
  | 'active_items'
  | 'career_dimensions'
  | 'community_pulse'
  | 'smart_upsell'
  | 'quick_tools'
  | 'getting_started'
  | 'secondary_services';

export type SmartNextStepType =
  | 'unscheduled_consultation'
  | 'upcoming_event_24h'
  | 'report_first_action'
  | 'checklist_incomplete'
  | 'resume_suggestion'
  | 'community_prompt';

export type ReportDimensionKey =
  | 'english'
  | 'experience'
  | 'objective'
  | 'timeline'
  | 'visa_immigration'
  | 'financial_context'
  | 'mental_readiness'
  | 'family_context';

export const REPORT_DIMENSION_OPTIONS: { value: ReportDimensionKey; label: string }[] = [
  { value: 'english', label: 'Inglês' },
  { value: 'experience', label: 'Experiência' },
  { value: 'objective', label: 'Objetivo' },
  { value: 'timeline', label: 'Cronograma' },
  { value: 'visa_immigration', label: 'Visto / Imigração' },
  { value: 'financial_context', label: 'Contexto Financeiro' },
  { value: 'mental_readiness', label: 'Prontidão Mental' },
  { value: 'family_context', label: 'Contexto Familiar' },
];

export interface HubDashboardConfig {
  sections_order: HubDashboardSectionId[];
  sections_visibility: Record<HubDashboardSectionId, boolean>;
  greetings: {
    morning: string;
    afternoon: string;
    evening: string;
    no_report: string;
  };
  smart_next_step_priority: SmartNextStepType[];
  community_pulse: {
    trending_period_days: number;
    show_top_post: boolean;
    no_activity_cta: string;
  };
  social_proof: {
    dimension_cta: Partial<Record<ReportDimensionKey, string>>;
    general_upsell: string;
  };
  quick_tools: string[];
}

// ============================================
// Career Insights (derived from report data)
// ============================================

export interface DimensionInsight {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  percent: number;
  isBarrier: boolean;
  priority: string;
}

export interface CareerInsights {
  hasReport: boolean;
  score: number;
  phase: { name: string; emoji: string; letter: string; color: string } | null;
  temperature: string | null;
  shortDiagnosis: string | null;
  dimensions: DimensionInsight[];
  weakest: DimensionInsight | null;
  strongest: DimensionInsight | null;
  criticalGaps: string[];
  strengths: string[];
  recommendedFirstAction: string | null;
  reportToken: string | null;
}

export interface CommunityPulse {
  postsToday: number;
  topPost: {
    id: string;
    title: string;
    likes_count: number;
    comments_count: number;
    author_name: string;
  } | null;
  userLatestPost: {
    id: string;
    title: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
  } | null;
}

export interface SmartNextStep {
  type: SmartNextStepType;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: string;
  urgencyLevel: 'high' | 'medium' | 'low';
}
