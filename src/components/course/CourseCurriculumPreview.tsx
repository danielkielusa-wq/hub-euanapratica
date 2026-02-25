import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronRight, Play, Lock, Clock, Eye, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDuration } from '@/types/course';
import type { CourseModule } from '@/types/course';
import { cn } from '@/lib/utils';

interface CourseCurriculumPreviewProps {
  espacoId: string;
}

export function CourseCurriculumPreview({ espacoId }: CourseCurriculumPreviewProps) {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const { data: modules, isLoading } = useQuery({
    queryKey: ['course-curriculum-preview', espacoId],
    queryFn: async () => {
      const { data: mods, error: modError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('espaco_id', espacoId)
        .eq('is_published', true)
        .order('display_order');

      if (modError) throw modError;

      const { data: lessons, error: lesError } = await supabase
        .from('course_lessons')
        .select('id, module_id, title, video_duration_seconds, is_free_preview, is_published')
        .in('module_id', mods.map((m) => m.id))
        .eq('is_published', true)
        .order('display_order');

      if (lesError) throw lesError;

      return mods.map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id),
      })) as CourseModule[];
    },
    enabled: !!espacoId,
  });

  const toggleModule = (id: string) => {
    setOpenModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading || !modules || modules.length === 0) return null;

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalDuration = modules.reduce(
    (acc, m) =>
      acc +
      (m.lessons || []).reduce((s, l) => s + (l.video_duration_seconds || 0), 0),
    0
  );

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 mb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
          <BookOpen size={20} />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Conteúdo do Curso</h2>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
        <span className="font-semibold">{modules.length} módulos</span>
        <span>•</span>
        <span className="font-semibold">{totalLessons} aulas</span>
        {totalDuration > 0 && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {formatDuration(totalDuration)} total
            </span>
          </>
        )}
      </div>

      {/* Module Tree */}
      <div className="space-y-2">
        {modules.map((module, idx) => {
          const lessons = module.lessons || [];
          const isOpen = openModules[module.id] ?? idx === 0;
          const moduleDuration = lessons.reduce(
            (s, l) => s + (l.video_duration_seconds || 0),
            0
          );

          return (
            <Collapsible
              key={module.id}
              open={isOpen}
              onOpenChange={() => toggleModule(module.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      Módulo {idx + 1}: {module.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    <span>{lessons.length} aulas</span>
                    {moduleDuration > 0 && (
                      <span>{formatDuration(moduleDuration)}</span>
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="ml-6 border-l-2 border-gray-100 mt-1 mb-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 px-4 py-3 ml-4 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {/* Icon */}
                      {lesson.is_free_preview ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                          <Play size={12} className="ml-0.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                          <Lock size={12} />
                        </div>
                      )}

                      {/* Title */}
                      <span className={cn(
                        "text-sm flex-1 truncate",
                        lesson.is_free_preview ? "text-gray-900 font-medium" : "text-gray-600"
                      )}>
                        {lesson.title}
                      </span>

                      {/* Meta */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {lesson.is_free_preview && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Eye size={10} />
                            Grátis
                          </span>
                        )}
                        {lesson.video_duration_seconds && lesson.video_duration_seconds > 0 && (
                          <span className="text-xs text-gray-400">
                            {formatDuration(lesson.video_duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
