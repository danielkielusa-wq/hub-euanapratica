import { useRef, useEffect, useCallback } from 'react';
import { Loader2, PlayCircle, AlertCircle, Lock } from 'lucide-react';
import { useVideoToken, useUpsertProgress } from '@/hooks/useCoursePlayer';
import type { CourseLesson, CourseProgress } from '@/types/course';
import { cn } from '@/lib/utils';

interface CourseVideoPlayerProps {
  lesson: CourseLesson;
  progress: CourseProgress | undefined;
  hasAccess: boolean;
}

export function CourseVideoPlayer({ lesson, progress, hasAccess }: CourseVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef(0);
  const upsertProgress = useUpsertProgress();

  // Only fetch token if user has access (or it's a free preview)
  const canWatch = hasAccess || lesson.is_free_preview;
  const hasBunnyVideo = !!lesson.bunny_video_id && lesson.video_status === 'ready';
  const { data: tokenData, isLoading: tokenLoading } = useVideoToken(
    canWatch && hasBunnyVideo ? lesson.id : undefined
  );

  // Debounced progress save
  const saveProgress = useCallback(
    (seconds: number, duration: number) => {
      const now = Date.now();
      // Save at most every 5 seconds
      if (now - lastSavedRef.current < 5000) return;
      lastSavedRef.current = now;

      const pct = duration > 0 ? Math.round((seconds / duration) * 100) : 0;

      upsertProgress.mutate({
        lessonId: lesson.id,
        status: pct >= 90 ? 'completed' : 'in_progress',
        watchPercentage: Math.min(pct, 100),
        lastPositionSeconds: Math.round(seconds),
      });
    },
    [lesson.id, upsertProgress]
  );

  // Player.js event listener
  useEffect(() => {
    if (!iframeRef.current || !tokenData?.embedUrl) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'string') return;

      try {
        const data = JSON.parse(event.data);

        if (data.event === 'timeupdate' && data.data) {
          const { seconds, duration } = data.data;
          if (typeof seconds === 'number' && typeof duration === 'number') {
            saveProgress(seconds, duration);
          }
        }

        if (data.event === 'ended') {
          upsertProgress.mutate({
            lessonId: lesson.id,
            status: 'completed',
            watchPercentage: 100,
          });
        }
      } catch {
        // Not a JSON message from the player
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tokenData?.embedUrl, lesson.id, saveProgress, upsertProgress]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // No access
  if (!canWatch) {
    return (
      <div className="relative aspect-video rounded-2xl bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="h-12 w-12 text-white/30 mx-auto" />
          <p className="text-white/60 text-sm">Matricule-se para assistir</p>
        </div>
      </div>
    );
  }

  // External video URL (YouTube, etc.)
  if (!hasBunnyVideo && lesson.video_url) {
    // Try YouTube embed
    const youtubeMatch = lesson.video_url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );

    if (youtubeMatch) {
      return (
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-2xl shadow-black/20">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Generic external link
    return (
      <div className="relative aspect-video rounded-2xl bg-gray-900 flex items-center justify-center">
        <a
          href={lesson.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <PlayCircle className="h-12 w-12" />
          <span>Assistir vídeo externo</span>
        </a>
      </div>
    );
  }

  // No video at all
  if (!hasBunnyVideo && !lesson.video_url) {
    return (
      <div className="relative aspect-video rounded-2xl bg-gray-900/50 flex items-center justify-center border border-dashed border-white/10">
        <div className="text-center space-y-2">
          <PlayCircle className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground text-sm">Nenhum vídeo disponível</p>
        </div>
      </div>
    );
  }

  // Loading token
  if (tokenLoading) {
    return (
      <div className="relative aspect-video rounded-2xl bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  // Token error or no URL
  if (!tokenData?.embedUrl) {
    return (
      <div className="relative aspect-video rounded-2xl bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-white/60 text-sm">Erro ao carregar o vídeo</p>
        </div>
      </div>
    );
  }

  // Bunny iframe with resume position
  const startTime = progress?.last_position_seconds
    ? `&t=${progress.last_position_seconds}`
    : '';

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-2xl shadow-black/20 ring-1 ring-white/5">
      <iframe
        ref={iframeRef}
        src={`${tokenData.embedUrl}${startTime}`}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
