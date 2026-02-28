import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CoursePlayerSidebar } from '@/components/course/player/CoursePlayerSidebar';
import { CourseVideoPlayer } from '@/components/course/player/CourseVideoPlayer';
import { AutoAdvanceOverlay } from '@/components/course/player/AutoAdvanceOverlay';
import { LessonContentTabs } from '@/components/course/player/LessonContentTabs';
import { LessonNavigation } from '@/components/course/player/LessonNavigation';
import { LessonQuiz } from '@/components/course/player/LessonQuiz';
import { CourseProgressRing } from '@/components/course/player/CourseProgressRing';
import { MilestoneCelebration } from '@/components/course/player/MilestoneCelebration';
import { CourseCertificate } from '@/components/course/CourseCertificate';
import { useCourseData } from '@/hooks/useCoursePlayer';
import { useCourseAccess } from '@/hooks/useCourseAccess';
import { useCourseStreak } from '@/hooks/useCourseGamification';
import { useCourseMilestones } from '@/hooks/useCourseMilestones';
import { useQuizForLesson } from '@/hooks/useCourseQuiz';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function CoursePlayer() {
  const { espacoId, lessonId: routeLessonId } = useParams<{
    espacoId: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAutoAdvance, setShowAutoAdvance] = useState(false);

  const { data: courseData, isLoading } = useCourseData(espacoId!);
  const { data: accessData } = useCourseAccess(espacoId!);
  const { data: streakData } = useCourseStreak();
  const { newMilestone, markMilestoneSeen } = useCourseMilestones(espacoId!, courseData?.progressPercent ?? 0);
  const [celebratingMilestone, setCelebratingMilestone] = useState<number | null>(null);

  // Show milestone celebration when a new one is detected
  useEffect(() => {
    if (newMilestone && newMilestone !== celebratingMilestone) {
      setCelebratingMilestone(newMilestone);
      markMilestoneSeen(newMilestone);
    }
  }, [newMilestone, celebratingMilestone, markMilestoneSeen]);

  // Determine current lesson
  const currentLessonId = routeLessonId || courseData?.allLessons[0]?.id;
  const currentLesson = courseData?.allLessons.find((l) => l.id === currentLessonId);

  // F16: Compute next lesson for auto-advance
  const currentLessonIndex = courseData?.allLessons.findIndex((l) => l.id === currentLessonId) ?? -1;
  const nextLesson =
    currentLessonIndex >= 0 && courseData
      ? courseData.allLessons[currentLessonIndex + 1] ?? null
      : null;

  // Reset auto-advance when lesson changes
  useEffect(() => {
    setShowAutoAdvance(false);
  }, [currentLessonId]);

  const handleVideoEnded = useCallback(() => {
    if (nextLesson) {
      setShowAutoAdvance(true);
    }
  }, [nextLesson]);

  const handleAutoAdvance = useCallback(() => {
    if (nextLesson) {
      setShowAutoAdvance(false);
      navigate(`/curso/${espacoId}/${nextLesson.id}`);
      setSidebarOpen(false);
    }
  }, [nextLesson, espacoId, navigate]);

  // Auto-navigate to first lesson if no lessonId in route
  useEffect(() => {
    if (courseData && !routeLessonId && courseData.allLessons.length > 0) {
      navigate(`/curso/${espacoId}/${courseData.allLessons[0].id}`, { replace: true });
    }
  }, [courseData, routeLessonId, espacoId, navigate]);

  const handleSelectLesson = (id: string) => {
    navigate(`/curso/${espacoId}/${id}`);
    setSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!courseData || !currentLesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Curso não encontrado</p>
          <Button variant="outline" onClick={() => navigate('/dashboard/cursos')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const hasAccess = accessData?.hasAccess ?? false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ─── Top Bar ─────────────────────────────────── */}
      <header className="h-12 bg-[#0F0F11] flex items-center px-4 gap-3 flex-shrink-0 z-30">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard/cursos')}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Course title */}
        <h1 className="text-sm font-medium text-white/80 truncate flex-1">
          {courseData.espaco.name}
        </h1>

        {/* Progress ring */}
        <div className="flex items-center gap-2">
          <CourseProgressRing percent={courseData.progressPercent} />
          <span className="text-xs text-white/40 hidden sm:block">
            {courseData.completedLessons}/{courseData.totalLessons}
          </span>
        </div>
      </header>

      {/* ─── Main Layout ─────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r border-white/[0.04] transition-all duration-300 flex-shrink-0",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-[320px]"
          )}
        >
          <CoursePlayerSidebar
            modules={courseData.modules}
            currentLessonId={currentLessonId!}
            progressMap={courseData.progressMap}
            totalLessons={courseData.totalLessons}
            completedLessons={courseData.completedLessons}
            progressPercent={courseData.progressPercent}
            onSelectLesson={handleSelectLesson}
            streak={streakData?.current_streak}
          />
        </aside>

        {/* Mobile Sidebar (Sheet) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[320px] p-0 bg-[#0F0F11] border-0">
            <CoursePlayerSidebar
              modules={courseData.modules}
              currentLessonId={currentLessonId!}
              progressMap={courseData.progressMap}
              totalLessons={courseData.totalLessons}
              completedLessons={courseData.completedLessons}
              progressPercent={courseData.progressPercent}
              onSelectLesson={handleSelectLesson}
              streak={streakData?.current_streak}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Video Player */}
            <div className="relative">
              <CourseVideoPlayer
                lesson={currentLesson}
                progress={courseData.progressMap[currentLesson.id]}
                hasAccess={hasAccess}
                onVideoEnded={handleVideoEnded}
              />
              {nextLesson && (
                <AutoAdvanceOverlay
                  visible={showAutoAdvance}
                  nextLessonTitle={nextLesson.title}
                  onAdvance={handleAutoAdvance}
                  onCancel={() => setShowAutoAdvance(false)}
                />
              )}
            </div>

            {/* Lesson Info */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {currentLesson.title}
              </h2>
              {currentLesson.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {currentLesson.description}
                </p>
              )}
            </div>

            {/* Content Tabs */}
            <LessonContentTabs lesson={currentLesson} />

            {/* Quiz (F7) */}
            <LessonQuiz lessonId={currentLessonId!} />

            {/* Navigation */}
            <LessonNavigation
              currentLesson={currentLesson}
              allLessons={courseData.allLessons}
              progress={courseData.progressMap[currentLesson.id]}
              onNavigate={handleSelectLesson}
            />

            {/* Certificate — shown at 100% completion */}
            {courseData.progressPercent >= 100 && (
              <CourseCertificate
                studentName={user?.full_name || 'Aluno'}
                courseName={courseData.espaco.name}
                completedAt={new Date().toISOString()}
                totalLessons={courseData.totalLessons}
                totalDurationHours={
                  courseData.allLessons.reduce(
                    (s, l) => s + (l.video_duration_seconds || 0),
                    0
                  ) > 0
                    ? Math.round(
                        courseData.allLessons.reduce(
                          (s, l) => s + (l.video_duration_seconds || 0),
                          0
                        ) / 3600
                      )
                    : undefined
                }
              />
            )}
          </div>
        </main>
      </div>

      {/* Milestone celebration modal (F9) */}
      <MilestoneCelebration
        milestone={celebratingMilestone}
        onClose={() => setCelebratingMilestone(null)}
      />
    </div>
  );
}
