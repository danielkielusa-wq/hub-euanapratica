// Plan tier and theme types
export type PlanTier = 'basic' | 'pro' | 'vip';
export type PlanTheme = 'gray' | 'blue' | 'purple';

// Feature keys for access control
export type PlanFeatureKey =
  | 'hotseats'
  | 'hotseat_priority'
  | 'hotseat_guaranteed'
  | 'community'
  | 'library'
  | 'masterclass'
  | 'job_concierge'
  | 'prime_jobs'
  | 'show_improvements'
  | 'show_power_verbs'
  | 'show_cheat_sheet'
  | 'allow_pdf';

// Limited features (with usage counts)
export type LimitedFeature = 'resume_pass' | 'title_translator' | 'job_concierge';

// Discount categories
export interface PlanDiscounts {
  base: number;
  consulting: number;
  curriculum: number;
  mentorship_group: number;
  mentorship_individual: number;
}

// Full plan features structure
export interface PlanFeatures {
  // Usage limits
  resume_pass_limit: number;
  title_translator_limit: number;
  job_concierge_count: number;
  
  // Access toggles
  hotseats: boolean;
  hotseat_priority: boolean;
  hotseat_guaranteed: boolean;
  community: boolean;
  library: boolean;
  masterclass: boolean;
  job_concierge: boolean;
  
  // Prime Jobs
  prime_jobs: boolean;

  // Curriculo USA features
  show_improvements: boolean;
  show_power_verbs: boolean;
  show_cheat_sheet: boolean;
  allow_pdf: boolean;
  
  // Discounts
  discounts: PlanDiscounts;
  
  // Auto-applied coupon
  coupon_code: string;
}

// Full plan configuration
export interface FullPlanConfig {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  theme: PlanTheme;
  is_active: boolean;
  is_popular: boolean;
  monthly_limit: number;
  features: PlanFeatures;
  display_features: string[];
  cta_text: string;
}

// User's plan access state
export interface UserPlanAccess {
  planId: string;
  planName: string;
  theme: PlanTheme;
  priceMonthly: number;
  priceAnnual: number;
  features: PlanFeatures;
  usedThisMonth: number;
  monthlyLimit: number;
  remaining: number;
}

// Default features for fallback
export const DEFAULT_PLAN_FEATURES: PlanFeatures = {
  resume_pass_limit: 1,
  title_translator_limit: 1,
  job_concierge_count: 0,
  hotseats: false,
  hotseat_priority: false,
  hotseat_guaranteed: false,
  community: true,
  library: false,
  masterclass: false,
  job_concierge: false,
  prime_jobs: false,
  show_improvements: false,
  show_power_verbs: false,
  show_cheat_sheet: false,
  allow_pdf: false,
  discounts: {
    base: 0,
    consulting: 0,
    curriculum: 0,
    mentorship_group: 0,
    mentorship_individual: 0,
  },
  coupon_code: '',
};

// Route to feature mapping for access control
export const ROUTE_FEATURE_MAP: Record<string, PlanFeatureKey> = {
  '/biblioteca': 'library',
  '/comunidade': 'community',
  '/masterclass': 'masterclass',
  '/prime-jobs/bookmarks': 'prime_jobs',
};

// Service type to discount category mapping
export const SERVICE_DISCOUNT_MAP: Record<string, keyof PlanDiscounts> = {
  'consulting': 'consulting',
  'curriculum': 'curriculum',
  'live_mentoring': 'mentorship_group',
  'individual_mentoring': 'mentorship_individual',
};
