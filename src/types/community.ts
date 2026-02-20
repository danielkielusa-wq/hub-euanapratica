// Community system types

export interface CommunityCategory {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
  community_categories?: CommunityCategory;
  user_has_liked?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  // Joined fields
  profiles?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
  user_has_liked?: boolean;
  replies?: CommunityComment[];
}

export interface CommunityLike {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
}

export interface UserGamification {
  user_id: string;
  total_points: number;
  level: number;
  posts_count: number;
  comments_count: number;
  likes_received: number;
  last_activity_at: string;
  // Joined fields
  profiles?: {
    id: string;
    full_name: string;
    profile_photo_url: string | null;
  };
}

export interface GamificationRule {
  id: string;
  action_type: string;
  points: number;
  description: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
  created_at?: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  // Joined fields
  badges?: Badge;
}

export type PostFilter = 'recent' | 'popular' | 'unanswered';

export interface RankingMember {
  user_id: string;
  full_name: string;
  profile_photo_url: string | null;
  total_points: number;
  level: number;
}

// Level thresholds
export const LEVEL_THRESHOLDS: Record<number, { min: number; title: string }> = {
  1: { min: 0, title: 'Iniciante' },
  2: { min: 100, title: 'Participante' },
  3: { min: 250, title: 'Contribuidor' },
  4: { min: 500, title: 'Veterano' },
  5: { min: 1000, title: 'Expert' },
};

export function getLevelTitle(level: number): string {
  return LEVEL_THRESHOLDS[level]?.title || 'Iniciante';
}

export function getNextLevelProgress(points: number, currentLevel: number): { current: number; next: number; percent: number } {
  const nextLevel = Math.min(currentLevel + 1, 5);
  const currentMin = LEVEL_THRESHOLDS[currentLevel]?.min || 0;
  const nextMin = LEVEL_THRESHOLDS[nextLevel]?.min || 1000;
  
  if (currentLevel >= 5) {
    return { current: points, next: nextMin, percent: 100 };
  }
  
  const progress = points - currentMin;
  const range = nextMin - currentMin;
  const percent = Math.min(100, Math.round((progress / range) * 100));
  
  return { current: points, next: nextMin, percent };
}
