import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEspaco } from '@/hooks/useEspacos';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { useMaterialsByEspaco } from '@/hooks/useMaterials';
import { useAuth } from '@/contexts/AuthContext';
import { useEspacoDiscussionCount } from '@/hooks/useSessionPosts';
import { EspacoLibrary } from '@/components/library/EspacoLibrary';
import {
  EspacoHeroHeader,
  EspacoStickyTabs,
  SessionTimeline,
  TaskListGrouped,
  OverviewContent,
} from '@/components/espacos/detail';
import { DiscussionSessionsList } from '@/components/espacos/detail/DiscussionSessionsList';
import { MyFilesTab } from '@/components/espacos/detail/MyFilesTab';
import { BookOpen } from 'lucide-react';

export default function StudentEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const { data: espaco, isLoading: espacoLoading } = useEspaco(id!);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(id);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments({ espaco_id: id, status: 'published' });
  const { data: folders } = useFolders(id!);
  const { data: mentorMaterials } = useMaterialsByEspaco(id!, 'space_all');
  const { data: myFiles } = useMaterialsByEspaco(id!, 'mentor_and_owner', user?.id);
  const { data: discussionCount = 0 } = useEspacoDiscussionCount(id);

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

  if (espacoLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <DashboardTopHeader />
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
          <DashboardTopHeader />
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
        {/* Top Header */}
        <DashboardTopHeader />

        {/* Hero Header */}
        <EspacoHeroHeader 
          espaco={espaco}
          nextSession={nextSessionWithLink}
          sessionsCount={totalSessions}
          studentsCount={espaco.max_students || 0}
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
          {activeTab === 'overview' && (
            <OverviewContent
              upcomingSessions={upcomingSessions}
              pendingAssignments={pendingAssignments}
              sessionsLoading={sessionsLoading}
              assignmentsLoading={assignmentsLoading}
              onViewAllSessions={() => setActiveTab('sessions')}
              onViewAllAssignments={() => setActiveTab('assignments')}
              espacoId={id}
              totalSessions={totalSessions}
              completedSessions={completedSessions}
              studentsCount={espaco.max_students || 0}
            />
          )}

          {activeTab === 'sessions' && (
            <SessionTimeline 
              sessions={sessions} 
              isLoading={sessionsLoading} 
            />
          )}

          {activeTab === 'assignments' && (
            <TaskListGrouped 
              assignments={assignments} 
              isLoading={assignmentsLoading} 
            />
          )}

          {activeTab === 'library' && (
            <EspacoLibrary
              espacoId={id!}
              espacoName={espaco.name}
              userRole="student"
            />
          )}

          {activeTab === 'my-files' && (
            <MyFilesTab espacoId={id!} />
          )}

          {activeTab === 'discussao' && (
            <DiscussionSessionsList
              sessions={sessions}
              isLoading={sessionsLoading}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
