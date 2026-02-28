export type LibraryItemType = 'file' | 'link';
export type LibraryAccessLevel = 'public' | 'restricted';

export interface LibraryFolder {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  access_level: LibraryAccessLevel;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  children?: LibraryFolder[];
  item_count?: number;
}

export interface LibraryItem {
  id: string;
  folder_id: string;
  title: string;
  description: string | null;
  item_type: LibraryItemType;
  // File fields
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  filename: string | null;
  // Link fields
  link_url: string | null;
  // Organization
  tags: string[];
  display_order: number;
  // Metadata
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  // Client-side enrichment
  download_count?: number;
  is_favorite?: boolean;
  folder?: { name: string };
}

export interface LibraryItemDownload {
  id: string;
  item_id: string;
  user_id: string;
  downloaded_at: string;
}

export interface LibraryItemFavorite {
  id: string;
  item_id: string;
  user_id: string;
  created_at: string;
}

export interface LibraryFilters {
  search?: string;
  itemTypes?: LibraryItemType[];
  tags?: string[];
  sortBy?: 'created_at' | 'title' | 'file_size';
  sortOrder?: 'asc' | 'desc';
  favoritesOnly?: boolean;
}
