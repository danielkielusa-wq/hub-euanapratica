export type FileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'png' | 'jpg' | 'link';
export type AccessLevel = 'public' | 'restricted';
export type VisibilityScope = 'space_all' | 'mentor_and_owner';

export interface Folder {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  espaco_id: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  children?: Folder[];
  materials?: Material[];
  espacos?: {
    name: string;
  };
}

export interface Material {
  id: string;
  folder_id: string;
  filename: string;
  title: string | null;
  description: string | null;
  file_url: string;
  file_size: number | null;
  file_type: FileType;
  access_level: AccessLevel;
  available_at: string;
  display_order: number;
  uploaded_by: string | null;
  uploaded_at: string;
  updated_at: string;
  is_favorite?: boolean;
  download_count?: number;
  // Novos campos para Biblioteca por Espaço
  owner_user_id: string | null;
  owner_role: string | null;
  visibility_scope: VisibilityScope;
  folders?: {
    name: string;
    espaco_id: string;
    espacos?: {
      name: string;
    };
  };
  // Joined data para exibir nome do autor
  owner_profile?: {
    full_name: string;
    email: string;
    profile_photo_url: string | null;
  };
}

export interface MaterialDownload {
  id: string;
  material_id: string;
  user_id: string;
  downloaded_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  material_id: string;
  created_at: string;
  materials?: Material;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface MaterialFilters {
  search?: string;
  fileTypes?: FileType[];
  sortBy?: 'uploaded_at' | 'filename' | 'file_size';
  sortOrder?: 'asc' | 'desc';
  favoritesOnly?: boolean;
  ownerType?: 'mentor' | 'student' | 'all';
}
