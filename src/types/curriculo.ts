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
