export interface CourseModule {
  id: string;
  espaco_id: string;
  title: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  content_html: string | null;
  video_url: string | null;
  bunny_video_id: string | null;
  video_duration_seconds: number | null;
  video_status: VideoStatus;
  thumbnail_url: string | null;
  is_free_preview: boolean;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  attachments?: CourseLessonAttachment[];
}

export interface CourseLessonAttachment {
  id: string;
  lesson_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  display_order: number;
  created_at: string;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  watch_percentage: number;
  last_position_seconds: number;
  completed_at: string | null;
  updated_at: string;
}

export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed';

export const VIDEO_STATUS_CONFIG: Record<VideoStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Aguardando Upload', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  processing: { label: 'Processando', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  ready: { label: 'Pronto', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  failed: { label: 'Erro', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export interface CourseWithCurriculum {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  category: string | null;
  status: string | null;
  modules: CourseModule[];
  totalLessons: number;
  totalDurationSeconds: number;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}
