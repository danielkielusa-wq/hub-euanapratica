import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpsertProgress } from '@/hooks/useCoursePlayer';
import type { CourseLesson, CourseProgress } from '@/types/course';

interface LessonNavigationProps {
  currentLesson: CourseLesson;
  allLessons: CourseLesson[];
  progress: CourseProgress | undefined;
  onNavigate: (lessonId: string) => void;
}

export function LessonNavigation({
  currentLesson,
  allLessons,
  progress,
  onNavigate,
}: LessonNavigationProps) {
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isCompleted = progress?.status === 'completed';
  const upsertProgress = useUpsertProgress();

  const handleMarkComplete = () => {
    upsertProgress.mutate({
      lessonId: currentLesson.id,
      status: 'completed',
      watchPercentage: 100,
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-border/50">
      {/* Previous */}
      <div className="flex-1">
        {prevLesson && (
          <button
            onClick={() => onNavigate(prevLesson.id)}
            className="flex items-center gap-2 text-left group"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Anterior</p>
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {prevLesson.title}
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Mark complete (for lessons without video) */}
      {!currentLesson.bunny_video_id && !isCompleted && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5"
          onClick={handleMarkComplete}
        >
          <CheckCircle className="h-4 w-4" />
          Marcar como concluída
        </Button>
      )}

      {isCompleted && (
        <div className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          Concluída
        </div>
      )}

      {/* Next */}
      <div className="flex-1 text-right">
        {nextLesson && (
          <button
            onClick={() => onNavigate(nextLesson.id)}
            className="inline-flex items-center gap-2 text-right group ml-auto"
          >
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Próxima</p>
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {nextLesson.title}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
