export interface LeadCSVRow {
  Nome: string;
  email: string;
  telefone?: string;
  Area?: string;
  Atuação?: string;
  'trabalha internacional'?: string;
  experiencia?: string;
  Englishlevel?: string;
  objetivo?: string;
  VisaStatus?: string;
  timeline?: string;
  FamilyStatus?: string;
  incomerange?: string;
  'investment range'?: string;
  impediment?: string;
  impedmentother?: string;
  'main concern'?: string;
  relatorio: string;
}

export interface CareerEvaluation {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  area?: string;
  atuacao?: string;
  trabalha_internacional?: boolean;
  experiencia?: string;
  english_level?: string;
  objetivo?: string;
  visa_status?: string;
  timeline?: string;
  family_status?: string;
  income_range?: string;
  investment_range?: string;
  impediment?: string;
  impediment_other?: string;
  main_concern?: string;
  report_content: string;
  formatted_report?: string;
  formatted_at?: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'error';
  processing_error?: string;
  processing_started_at?: string;
  access_token: string;
  first_accessed_at?: string;
  access_count: number;
  imported_by?: string;
  import_batch_id?: string;
  recommended_product_name?: string;
  recommendation_description?: string;
  recommendation_landing_page_url?: string;
  raw_llm_response?: Record<string, any>;
  recommendation_status?: 'pending' | 'processing' | 'completed' | 'error' | 'skipped';
  created_at: string;
  updated_at: string;
}

export interface ServiceRecommendation {
  service_id: string;
  type: 'PRIMARY' | 'SECONDARY' | 'UPGRADE';
  reason: string;
  // Enriched by edge function for frontend rendering
  service_name?: string;
  service_description?: string | null;
  service_price_display?: string | null;
  service_cta_text?: string | null;
  service_checkout_url?: string | null;
}

export interface FormattedReportData {
  greeting: {
    title: string;
    subtitle: string;
    phase_highlight: string;
    phase_description: string;
  };
  diagnostic: {
    english: { level: string; description: string };
    experience: { summary: string; details: string };
    objective: { goal: string; timeline: string };
    financial: { income: string; investment: string };
  };
  rota_method: {
    current_phase: 'R' | 'O' | 'T' | 'A';
    phase_analysis: string;
  };
  action_plan: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  resources: Array<{
    type: 'youtube' | 'instagram' | 'guide' | 'articles' | 'ebook';
    label: string;
    url?: string;
  }>;
  whatsapp_keyword: string;
  recommendations?: ServiceRecommendation[];
}

export interface ImportResult {
  totalRows: number;
  newUsersCreated: number;
  reportsLinkedToExisting: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  email?: string;
  message: string;
}

export interface ParsedLead {
  row: number;
  data: LeadCSVRow;
  isValid: boolean;
  error?: string;
}

// ============================================================
// V2 Report Types (report_version: "2.0")
// ============================================================

export interface V2ReportMetadata {
  generated_at: string;
  report_version: '2.0';
  ai_model_used: string;
  prompt_version: string;
}

export interface V2ScoreBreakdown {
  score_english: number;
  score_experience: number;
  score_international_work: number;
  score_timeline: number;
  score_objective: number;
  score_visa: number;
  score_readiness: number;
  score_area_bonus: number;
}

export interface V2Scoring {
  readiness_score: number;
  readiness_percentual: number;
  max_score: number;
  score_breakdown: V2ScoreBreakdown;
}

export interface V2PhaseClassification {
  phase_id: number;
  phase_name: string;
  phase_emoji: string;
  phase_color: string;
  rota_letter: string;
  urgency_level: string;
  can_apply_jobs: boolean;
  estimated_preparation_months: number;
  short_diagnosis: string;
  full_diagnosis: string;
}

export interface V2BarriersAnalysis {
  has_english_barrier: boolean;
  has_experience_barrier: boolean;
  has_financial_barrier: boolean;
  has_family_barrier: boolean;
  has_visa_barrier: boolean;
  has_time_barrier: boolean;
  has_clarity_barrier: boolean;
  critical_blockers: string[];
  recommended_first_action: string;
}

export interface V2AnalysisDimension {
  current_level: string;
  score_contribution: number;
  assessment: string;
  is_barrier: boolean;
  priority: string;
  recommendation: string;
}

export interface V2DetailedAnalysis {
  english: V2AnalysisDimension;
  experience: V2AnalysisDimension;
  objective: V2AnalysisDimension;
  timeline: V2AnalysisDimension;
  visa_immigration: V2AnalysisDimension;
  financial_context: V2AnalysisDimension;
  mental_readiness: V2AnalysisDimension;
  family_context: V2AnalysisDimension;
}

export interface V2PrimaryOffer {
  recommended_product_tier: string;
  recommended_product_name: string;
  recommended_product_price: string;
  recommended_product_url: string;
  fit_score: number;
  why_this_fits: string;
  cta: string;
}

export interface V2SecondaryOffer {
  secondary_product_tier: string;
  secondary_product_name: string;
  secondary_fit_score: number;
  why_alternative: string;
}

export interface V2FinancialFit {
  has_budget: boolean;
  budget_gap: string;
  estimated_ltv: number;
}

export interface V2ProductRecommendation {
  primary_offer: V2PrimaryOffer;
  secondary_offer?: V2SecondaryOffer;
  financial_fit: V2FinancialFit;
}

export interface V2LeadQualification {
  lead_temperature: string;
  lead_priority_score: number;
  is_tech_professional: boolean;
  is_senior_level: boolean;
  works_remotely: boolean;
  has_family: boolean;
  is_high_income: boolean;
  best_contact_time: string;
  preferred_communication: string;
}

export interface V2TimelineMilestones {
  next_milestone_action: string;
  next_milestone_deadline: string;
  recheck_recommended_at: string;
  scheduled_follow_up_1: string;
  scheduled_follow_up_2: string;
  scheduled_follow_up_3: string;
  auto_nurture_sequence: string;
}

export interface V2ActionPlanStep {
  step_number: number;
  title: string;
  description: string;
  priority: string;
  estimated_hours_week?: number;
  milestone?: string;
}

export interface V2ActionPlan {
  next_30_days: V2ActionPlanStep[];
  next_90_days: V2ActionPlanStep[];
  next_6_months: V2ActionPlanStep[];
}

export interface V2RotaPhase {
  letter: string;
  name: string;
  status: string;
  completion_percentage: number;
}

export interface V2RotaFrameworkProgress {
  current_phase: string;
  phases: V2RotaPhase[];
}

export interface V2KeyMetrics {
  strengths: string[];
  critical_gaps: string[];
  estimated_timeline_months: number;
  can_start_applying: boolean;
}

export interface V2Resource {
  type: string;
  title: string;
  url: string;
  price?: string;
}

export interface V2HeroSection {
  headline: string;
  subheadline: string;
  score_display: string;
  phase_badge: string;
}

export interface V2WebReportData {
  hero_section: V2HeroSection;
  rota_framework_progress: V2RotaFrameworkProgress;
  key_metrics: V2KeyMetrics;
  resources: V2Resource[];
}

export interface V2DatabaseFields {
  processing_status: string;
  processing_error: string | null;
  formatted_at: string;
}

export interface V2UserData {
  name: string;
  email: string;
  phone?: string;
  area?: string;
  atuacao?: string;
  trabalha_internacional?: boolean;
  experiencia?: string;
  english_level?: string;
  objetivo?: string;
  visa_status?: string;
  timeline?: string;
  family_status?: string;
  income_range?: string;
  investment_range?: string;
  impediment?: string;
  main_concern?: string;
}

/** Top-level V2 formatted report JSON */
export interface V2FormattedReportData {
  report_metadata: V2ReportMetadata;
  user_data: V2UserData;
  scoring: V2Scoring;
  phase_classification: V2PhaseClassification;
  barriers_analysis: V2BarriersAnalysis;
  detailed_analysis: V2DetailedAnalysis;
  product_recommendation: V2ProductRecommendation;
  lead_qualification: V2LeadQualification;
  timeline_milestones: V2TimelineMilestones;
  action_plan: V2ActionPlan;
  web_report_data: V2WebReportData;
  database_fields: V2DatabaseFields;
}

/** Type guard: returns true if parsed JSON is a V2 report */
export function isV2Report(data: unknown): data is V2FormattedReportData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'report_metadata' in data &&
    (data as Record<string, unknown>).report_metadata !== null &&
    typeof (data as Record<string, unknown>).report_metadata === 'object' &&
    typeof ((data as Record<string, Record<string, unknown>>).report_metadata).report_version === 'string' &&
    ((data as Record<string, Record<string, unknown>>).report_metadata).report_version.startsWith('2.')
  );
}
