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
  access_token: string;
  first_accessed_at?: string;
  access_count: number;
  imported_by?: string;
  import_batch_id?: string;
  created_at: string;
  updated_at: string;
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
