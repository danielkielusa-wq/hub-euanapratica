export type AssignmentStatus = 'draft' | 'published' | 'closed';
export type SubmissionType = 'file' | 'text' | 'both';
export type SubmissionStatus = 'draft' | 'submitted' | 'reviewed';
export type ReviewResult = 'approved' | 'revision' | 'rejected';

export interface Assignment {
  id: string;
  espaco_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  due_date: string;
  submission_type: SubmissionType;
  status: AssignmentStatus;
  max_file_size: number;
  allowed_file_types: string[];
  allow_late_submission: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // Joined data
  espaco?: { name: string };
  materials?: AssignmentMaterial[];
  submission_count?: number;
}

export interface AssignmentMaterial {
  id: string;
  assignment_id: string;
  title: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  status: SubmissionStatus;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  text_content: string | null;
  draft_saved_at: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_result: ReviewResult | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: { full_name: string; email: string };
  assignment?: Assignment;
}

export interface AssignmentWithSubmission extends Assignment {
  my_submission?: Submission | null;
}

export interface AssignmentFilters {
  espaco_id?: string;
  status?: AssignmentStatus;
  tab?: 'pending' | 'submitted' | 'all';
}

export interface SubmissionFilters {
  status?: SubmissionStatus;
  submitted?: 'yes' | 'no' | 'all';
}

// Helper types for forms
export interface CreateAssignmentData {
  espaco_id: string;
  title: string;
  description?: string;
  instructions?: string;
  due_date: string;
  submission_type: SubmissionType;
  max_file_size?: number;
  allowed_file_types?: string[];
  allow_late_submission?: boolean;
  status?: AssignmentStatus;
}

export interface UpdateAssignmentData extends Partial<CreateAssignmentData> {
  id: string;
}

export interface SubmitAssignmentData {
  assignment_id: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  text_content?: string;
}

export interface ReviewSubmissionData {
  submission_id: string;
  review_result: ReviewResult;
  feedback?: string;
}

// Stats
export interface AssignmentStats {
  total_students: number;
  submitted_count: number;
  reviewed_count: number;
  pending_count: number;
  on_time_count: number;
  late_count: number;
  submission_rate: number;
}
