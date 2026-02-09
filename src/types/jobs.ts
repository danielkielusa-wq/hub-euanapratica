// Prime Jobs Types

export type RemoteType = 'fully_remote' | 'hybrid' | 'onsite';
export type JobType = 'full_time' | 'part_time' | 'contract' | 'freelance';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type ApplicationStatus = 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';

export interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string;
  remote_type: RemoteType;
  job_type: JobType;
  experience_level: ExperienceLevel;
  category: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  tech_stack: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  apply_url: string;
  is_featured: boolean;
  created_at: string;
  // User context (populated by RPC)
  is_bookmarked?: boolean;
  is_applied?: boolean;
  total_count?: number;
}

export interface JobBookmark {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  job?: Job;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  notes: string | null;
  applied_at: string;
  updated_at: string;
  job?: Job;
}

export interface JobFilters {
  search?: string;
  category?: string;
  experienceLevel?: ExperienceLevel;
  remoteType?: RemoteType;
  jobType?: JobType;
  salaryMin?: number;
}

export interface PrimeJobsQuota {
  canApply: boolean;
  usedThisMonth: number;
  monthlyLimit: number;
  remaining: number;
  planId: string;
}

export interface PrimeJobsStats {
  totalActiveJobs: number;
  newThisWeek: number;
  avgSalaryMin: number;
  topCategory: string;
}

export interface JobCategory {
  category: string;
  count: number;
}

// UI Display Labels
export const REMOTE_TYPE_LABELS: Record<RemoteType, string> = {
  fully_remote: '100% Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contrato',
  freelance: 'Freelance',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead/Staff',
  executive: 'Executive',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Candidatado',
  interviewing: 'Em Entrevista',
  offered: 'Oferta Recebida',
  rejected: 'Rejeitado',
  withdrawn: 'Desistiu',
};

// Badge colors for UI
export const REMOTE_TYPE_COLORS: Record<RemoteType, { bg: string; text: string; border: string }> = {
  fully_remote: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  hybrid: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  onsite: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
};

export const JOB_TYPE_COLORS: Record<JobType, { bg: string; text: string; border: string }> = {
  full_time: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  part_time: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  contract: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  freelance: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
};

export const EXPERIENCE_COLORS: Record<ExperienceLevel, { bg: string; text: string; border: string }> = {
  entry: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  mid: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  senior: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  lead: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  executive: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
};

// Job categories
export const JOB_CATEGORIES = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Legal',
  'Support',
  'Other',
] as const;

export type JobCategoryType = typeof JOB_CATEGORIES[number];

// Helper functions
export function formatSalary(min: number | null, max: number | null, currency = 'USD'): string {
  if (!min && !max) return '';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) {
    return `${formatter.format(min)}+`;
  }
  return `Up to ${formatter.format(max!)}`;
}

export function isNewJob(createdAt: string, hoursThreshold = 48): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffHours <= hoursThreshold;
}

export function getTimeAgo(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Agora mesmo';
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana(s) atrás`;
  return `${Math.floor(diffDays / 30)} mês(es) atrás`;
}
