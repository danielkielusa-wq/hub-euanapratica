export type UserRole = 'student' | 'mentor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  profile_photo_url?: string;
  timezone?: string;
  role: UserRole;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface AuthState {
  user: User | null;
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
