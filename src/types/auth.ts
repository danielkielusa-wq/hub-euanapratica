export type UserRole = 'student' | 'mentor' | 'admin';
export type UserStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  phone_country_code?: string;
  is_whatsapp?: boolean;
  profile_photo_url?: string;
  timezone: string;
  status?: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Profile {
  role: UserRole;
  has_completed_onboarding: boolean;
}

export interface AuthState {
  user: UserWithRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

// Audit log types
export type AuditAction = 'created' | 'updated' | 'status_changed' | 'role_changed' | 'profile_updated' | 'login';

export interface UserAuditLog {
  id: string;
  user_id: string;
  changed_by_user_id: string | null;
  action: AuditAction;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  changed_by?: {
    full_name: string;
    email: string;
  };
}
