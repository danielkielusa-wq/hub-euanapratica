export type UserRole = 'student' | 'mentor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  profile_photo_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Profile {
  role: UserRole;
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
