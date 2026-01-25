export type EspacoCategory = 'immersion' | 'group_mentoring' | 'workshop' | 'bootcamp' | 'course';
export type EspacoVisibility = 'public' | 'private';
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled' | 'paused' | 'completed';

export const CATEGORY_LABELS: Record<EspacoCategory, string> = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso'
};

export const VISIBILITY_LABELS: Record<EspacoVisibility, string> = {
  public: 'Pública',
  private: 'Privada'
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'Ativo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
  paused: 'Pausado',
  completed: 'Concluído'
};

export interface EspacoExtended {
  id: string;
  name: string;
  description: string | null;
  category: EspacoCategory;
  visibility: EspacoVisibility;
  max_students: number;
  mentor_id: string | null;
  mentor?: { full_name: string; email: string };
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Calculated
  enrolled_count?: number;
  pending_tasks?: number;
  avg_attendance?: number;
}

export interface EnrollmentExtended {
  id: string;
  user_id: string;
  espaco_id: string;
  enrolled_at: string | null;
  status: string | null;
  access_expires_at: string | null;
  enrolled_by: string | null;
  notes: string | null;
  last_access_at: string | null;
  // Joined
  user?: { full_name: string; email: string; profile_photo_url: string | null };
  espaco?: { name: string };
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  access_duration_days: number | null;
  price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  espacos?: { id: string; name: string }[];
}

export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  purchased_at: string;
  expires_at: string | null;
  status: string;
  created_at: string;
  product?: Product;
}

export interface EnrollmentHistory {
  id: string;
  user_espaco_id: string | null;
  user_id: string;
  espaco_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  performer?: { full_name: string };
  espaco?: { name: string };
}

export interface CSVImportRow {
  nome: string;
  email: string;
  turma?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; email: string; message: string }[];
  created_users: number;
}

export interface AdminStats {
  totalUsers: number;
  totalActiveEspacos: number;
  totalActiveEnrollments: number;
  newEnrollments30Days: number;
  expiringAccess30Days: number;
}

export interface EspacoFilters {
  status?: string;
  category?: EspacoCategory;
  mentor_id?: string;
  search?: string;
}

export interface UserFilters {
  role?: 'admin' | 'mentor' | 'student';
  search?: string;
}

export interface EnrollmentFilters {
  espaco_id?: string;
  status?: string;
  expiring_soon?: boolean;
  search?: string;
}
