import { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List, Calendar, FileText, FolderOpen, BookOpen, CalendarDays } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEspaco } from '@/hooks/useEspacos';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { useMaterialsByEspaco } from '@/hooks/useMaterials';
import { useAuth } from '@/contexts/AuthContext';
import { useEspacoDiscussionCount } from '@/hooks/useSessionPosts';
import { useStudentActivityFeed } from '@/hooks/useStudentActivityFeed';
import { useEspacoAvatars } from '@/hooks/useEspacoAvatars';
import { supabase } from '@/integrations/supabase/client';
import { EspacoLibrary } from '@/components/library/EspacoLibrary';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import {
  EspacoHeroHeader,
  EspacoMetricsRow,
  EspacoStickyTabs,
  SessionTimeline,
  TaskListGrouped,
  OverviewContent,
  StudentTaskKanban,
  QuickActionsGrid,
  MentorActivityFeed,
} from '@/components/espacos/detail';
import { DiscussionSessionsList } from '@/components/espacos/detail/DiscussionSessionsList';
import { MyFilesTab } from '@/components/espacos/detail/MyFilesTab';
import type { CalendarEvent } from '@/types/calendar';

// Animation variants (same as mentor for consistency)
const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function StudentEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'overview');
  const [taskView, setTaskView] = useState<'kanban' | 'list'>('kanban');

  const { data: espaco, isLoading: espacoLoading } = useEspaco(id!);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(id);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments({ espaco_id: id, status: 'published' });
  const { data: folders } = useFolders(id!);
  const { data: mentorMaterials } = useMaterialsByEspaco(id!, 'space_all');
  const { data: myFiles } = useMaterialsByEspaco(id!, 'mentor_and_owner', user?.id);
  const { data: discussionCount = 0 } = useEspacoDiscussionCount(id);
  const { data: activityFeed, isLoading: feedLoading } = useStudentActivityFeed(id || '');
  const { data: avatarData } = useEspacoAvatars(id || '');

  // Record last access timestamp (fire-and-forget)
  useEffect(() => {
    if (id && user?.id) {
      supabase
        .from('user_espacos')
        .update({ last_access_at: new Date().toISOString() })
        .eq('espaco_id', id)
        .eq('user_id', user.id)
        .then(() => {});
    }
  }, [id, user?.id]);

  // Filter upcoming sessions
  const upcomingSessions = sessions?.filter(s =>
    new Date(s.datetime) >= new Date() &&
    (s.status === 'scheduled' || s.status === 'live')
  ) || [];

  // Filter pending assignments
  const pendingAssignments = assignments?.filter(a =>
    !a.my_submission || a.my_submission.status === 'draft' ||
    (a.my_submission.status === 'reviewed' && a.my_submission.review_result === 'rejected')
  ) || [];

  // Get next session with meeting link
  const nextSessionWithLink = upcomingSessions.find(s => s.meeting_link);

  // Calculate counts
  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;

  // Calendar events from sessions
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!sessions) return [];
    return sessions.map(s => ({
      kind: 'session' as const,
      data: s,
      datetime: s.datetime,
    }));
  }, [sessions]);

  if (espacoLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="space-y-4 p-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-12" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center py-12 px-6 max-w-sm mx-auto rounded-[24px] bg-card border border-border/50">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">Espaço não encontrado</h2>
              <p className="text-muted-foreground mb-6">
                Este espaço não existe ou você não tem acesso a ele.
              </p>
              <Button
                onClick={() => navigate('/dashboard/espacos')}
                className="rounded-xl"
              >
                Voltar para Meus Espaços
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-muted/30">
        {/* Hero Header with avatars */}
        <EspacoHeroHeader
          espaco={espaco}
          nextSession={nextSessionWithLink}
          sessionsCount={totalSessions}
          studentsCount={avatarData?.total || espaco.max_students || 0}
          studentAvatars={avatarData?.avatars}
        />

        {/* Metrics Row */}
        <EspacoMetricsRow
          sessionsCount={upcomingSessions.length}
          tasksCount={pendingAssignments.length}
          materialsCount={mentorMaterials?.length || 0}
          maxStudents={espaco.max_students}
        />

        {/* Sticky Tabs */}
        <EspacoStickyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingTasks={pendingAssignments.length}
          upcomingSessions={upcomingSessions.length}
          materialsCount={mentorMaterials?.length || 0}
          myFilesCount={myFiles?.length || 0}
          discussionCount={discussionCount}
        />

        {/* Tab Content */}
        <div className="flex-1 px-4 lg:px-8 py-6 pb-28 md:pb-8">
          <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-6">
                {/* Row 1: Sessions + Quick Actions */}
                <div className="grid gap-6 lg:grid-cols-3 items-stretch">
                  <div className="lg:col-span-2 flex">
                    <OverviewContent
                      upcomingSessions={upcomingSessions}
                      pendingAssignments={[]}
                      sessionsLoading={sessionsLoading}
                      assignmentsLoading={false}
                      onViewAllSessions={() => setActiveTab('sessions')}
                      onViewAllAssignments={() => setActiveTab('assignments')}
                      espacoId={id}
                      variant="sessions-only"
                    />
                  </div>
                  <div className="flex">
                    <QuickActionsGrid actions={[
                      { icon: CalendarDays, label: 'Calendário', onClick: () => setActiveTab('calendar') },
                      { icon: FileText, label: 'Minhas Tarefas', onClick: () => setActiveTab('assignments') },
                      { icon: FolderOpen, label: 'Materiais', onClick: () => setActiveTab('library'), colSpan: 2 },
                    ]} />
                  </div>
                </div>

                {/* Row 2: Assignments */}
                <OverviewContent
                  upcomingSessions={[]}
                  pendingAssignments={pendingAssignments}
                  sessionsLoading={false}
                  assignmentsLoading={assignmentsLoading}
                  onViewAllSessions={() => setActiveTab('sessions')}
                  onViewAllAssignments={() => setActiveTab('assignments')}
                  espacoId={id}
                  variant="assignments-only"
                />

                {/* Row 3: Activity Feed */}
                <MentorActivityFeed activities={activityFeed || []} isLoading={feedLoading} />
              </div>
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div key="sessions" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Sessões</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => setActiveTab('calendar')}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Ver Calendário
                  </Button>
                </div>
                <SessionTimeline
                  sessions={sessions}
                  isLoading={sessionsLoading}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div key="calendar" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Calendário</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2"
                    onClick={() => setActiveTab('sessions')}
                  >
                    <List className="h-4 w-4" />
                    Ver Lista
                  </Button>
                </div>
                <MonthCalendar
                  events={calendarEvents}
                  perspective="student"
                  onJoinMeeting={(event) => {
                    if (event.kind === 'session' && event.data.meeting_link) {
                      window.open(event.data.meeting_link, '_blank');
                    }
                  }}
                  onViewMaterials={() => setActiveTab('library')}
                  onViewRecording={(event) => {
                    if (event.kind === 'session' && event.data.recording_url) {
                      window.open(event.data.recording_url, '_blank');
                    }
                  }}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div key="assignments" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Minhas Tarefas</h2>
                  <div className="flex items-center rounded-xl border border-border/50 p-0.5">
                    <Button
                      variant={taskView === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-lg px-3 h-8"
                      onClick={() => setTaskView('kanban')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-1.5" />
                      Kanban
                    </Button>
                    <Button
                      variant={taskView === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-lg px-3 h-8"
                      onClick={() => setTaskView('list')}
                    >
                      <List className="h-4 w-4 mr-1.5" />
                      Lista
                    </Button>
                  </div>
                </div>
                {taskView === 'kanban' ? (
                  <StudentTaskKanban
                    assignments={assignments}
                    isLoading={assignmentsLoading}
                  />
                ) : (
                  <TaskListGrouped
                    assignments={assignments}
                    isLoading={assignmentsLoading}
                  />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div key="library" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <EspacoLibrary
                espacoId={id!}
                espacoName={espaco.name}
                userRole="student"
              />
            </motion.div>
          )}

          {activeTab === 'my-files' && (
            <motion.div key="my-files" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <MyFilesTab espacoId={id!} />
            </motion.div>
          )}

          {activeTab === 'discussao' && (
            <motion.div key="discussao" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
              <DiscussionSessionsList
                sessions={sessions}
                isLoading={sessionsLoading}
              />
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
