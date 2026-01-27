// Error types for parsing failures
export type AnalysisErrorCode = 
  | "UNSUPPORTED_FORMAT" 
  | "EXTRACTION_FAILED" 
  | "INSUFFICIENT_CONTENT" 
  | "AI_ERROR";

export interface AnalysisError {
  error_code: AnalysisErrorCode;
  error: string;
  error_message: string;
  parsing_error: boolean;
}

// Qualitative score labels
export type QualitativeScore = "Crítico" | "Precisa Melhorar" | "Perfeito";

// Full Analysis Result from AI (20+ fields)
export interface FullAnalysisResult {
  header: {
    score: number;
    status_tag: string;
    main_message: string;
    sub_message: string;
  };
  metrics: {
    ats_format: MetricItem;
    keywords: KeywordsMetric;
    action_verbs: VerbsMetric;
    brevity: BrevityMetric;
  };
  cultural_bridge: {
    brazil_title: string;
    us_equivalent: string;
    explanation: string;
  };
  market_value: {
    range: string;
    context: string;
  };
  power_verbs_suggestions: string[];
  improvements: Improvement[];
  linkedin_fix: {
    headline: string;
    reasoning_pt: string;
  };
  interview_cheat_sheet: InterviewQuestion[];
  // Optional error fields from AI
  parsing_error?: boolean;
  parsing_error_message?: string;
}

export interface MetricItem {
  score: number;
  label: string;
  details_pt: string;
}

export interface KeywordsMetric extends MetricItem {
  matched_count: number;
  total_required: number;
}

export interface VerbsMetric extends MetricItem {
  count: number;
}

export interface BrevityMetric extends MetricItem {
  page_count: number;
  ideal_page_count: number;
}

export interface Improvement {
  tags: string[];
  original: string;
  improved: string;
  impact_label: string;
}

export interface InterviewQuestion {
  question: string;
  context_pt: string;
}

// Storage key for localStorage persistence
export const CURRICULO_RESULT_STORAGE_KEY = 'curriculo_analysis_result';
