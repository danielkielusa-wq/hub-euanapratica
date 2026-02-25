import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Play, Circle, Clock, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDuration } from '@/types/course';
import type { CourseModule, CourseProgress } from '@/types/course';
import { cn } from '@/lib/utils';

interface CoursePlayerSidebarProps {
  modules: CourseModule[];
  currentLessonId: string;
  progressMap: Record<string, CourseProgress>;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  onSelectLesson: (lessonId: string) => void;
}

export function CoursePlayerSidebar({
  modules,
  currentLessonId,
  progressMap,
  totalLessons,
  completedLessons,
  progressPercent,
  onSelectLesson,
}: CoursePlayerSidebarProps) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    // Auto-open the module containing the current lesson
    const map: Record<string, boolean> = {};
    modules.forEach((m) => {
      const hasCurrentLesson = m.lessons?.some((l) => l.id === currentLessonId);
      map[m.id] = hasCurrentLesson || false;
    });
    return map;
  });

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F11] text-white">
      {/* Course progress header */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
            Progresso
          </span>
          <span className="text-xs font-semibold text-emerald-400">
            {completedLessons}/{totalLessons} aulas
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-1.5 bg-white/[0.06] [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400"
        />
      </div>

      {/* Module tree */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {modules.map((module, moduleIndex) => {
            const lessons = module.lessons || [];
            const completedInModule = lessons.filter(
              (l) => progressMap[l.id]?.status === 'completed'
            ).length;
            const isOpen = openModules[module.id] ?? false;

            return (
              <Collapsible
                key={module.id}
                open={isOpen}
                onOpenChange={() => toggleModule(module.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-white/30 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-white/30 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[13px] font-medium text-white/90 truncate">
                        {module.title}
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {completedInModule}/{lessons.length} aulas
                      </p>
                    </div>
                    {completedInModule === lessons.length && lessons.length > 0 && (
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="ml-4 border-l border-white/[0.06] space-y-0.5 py-1">
                    {lessons.map((lesson) => {
                      const prog = progressMap[lesson.id];
                      const isCurrent = lesson.id === currentLessonId;
                      const isCompleted = prog?.status === 'completed';
                      const isInProgress = prog?.status === 'in_progress';

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson(lesson.id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2 ml-px rounded-lg text-left transition-all",
                            isCurrent
                              ? "bg-white/[0.08] border-l-2 border-primary -ml-px"
                              : "hover:bg-white/[0.03]"
                          )}
                        >
                          {/* Status icon */}
                          {isCompleted ? (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Check className="h-3 w-3 text-emerald-400" />
                            </div>
                          ) : isCurrent ? (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                              <Play className="h-3 w-3 text-primary fill-primary" />
                            </div>
                          ) : isInProgress ? (
                            <div className="flex-shrink-0 w-5 h-5 rounded-full border border-primary/40 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary/60" />
                            </div>
                          ) : (
                            <Circle className="h-5 w-5 text-white/15 flex-shrink-0" />
                          )}

                          {/* Lesson info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-[13px] truncate",
                              isCurrent ? "text-white font-medium" :
                              isCompleted ? "text-white/40" : "text-white/60"
                            )}>
                              {lesson.title}
                            </p>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {lesson.is_free_preview && (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              >
                                <Eye className="h-2.5 w-2.5 mr-0.5" />
                                Grátis
                              </Badge>
                            )}
                            {lesson.video_duration_seconds && lesson.video_duration_seconds > 0 && (
                              <span className="text-[11px] text-white/25">
                                {formatDuration(lesson.video_duration_seconds)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
