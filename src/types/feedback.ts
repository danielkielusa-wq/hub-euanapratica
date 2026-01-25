export type FeedbackType = 'bug' | 'enhancement';
export type FeedbackPriority = 'low' | 'medium' | 'high';
export type FeedbackStatus = 
  | 'new' 
  | 'in_review' 
  | 'resolved' 
  | 'considered_no_action' 
  | 'discarded';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  page_url: string;
  user_id: string;
  user_role: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  admin_notes: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  profiles?: {
    full_name: string;
    email: string;
    profile_photo_url: string | null;
  };
}

export interface FeedbackFilters {
  type?: FeedbackType | 'all';
  status?: FeedbackStatus | 'all';
  priority?: FeedbackPriority | 'all';
  userRole?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  enhancement: 'Sugestão de Melhoria'
};

export const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Novo',
  in_review: 'Em Análise',
  resolved: 'Resolvido',
  considered_no_action: 'Considerado (Sem Ação)',
  discarded: 'Desconsiderado'
};

export const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, string> = {
  new: 'bg-muted text-muted-foreground',
  in_review: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  resolved: 'bg-green-500/10 text-green-600 dark:text-green-400',
  considered_no_action: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  discarded: 'bg-destructive/10 text-destructive'
};

export const FEEDBACK_PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  high: 'bg-destructive/10 text-destructive'
};
