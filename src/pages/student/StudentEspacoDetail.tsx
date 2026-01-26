import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEspaco } from '@/hooks/useEspacos';
import { useSessions } from '@/hooks/useSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { useFolders } from '@/hooks/useFolders';
import { EspacoLibrary } from '@/components/library/EspacoLibrary';
import {
  EspacoHeroHeader,
  EspacoMetricsRow,
  EspacoStickyTabs,
  SessionTimeline,
  TaskListGrouped,
  OverviewContent,
} from '@/components/espacos/detail';
import { BookOpen, Video } from 'lucide-react';

type TabValue = 'overview' | 'sessions' | 'assignments' | 'library';

export default function StudentEspacoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const { data: espaco, isLoading: espacoLoading } = useEspaco(id!);
  const { data: sessions, isLoading: sessionsLoading } = useSessions(id);
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments({ espaco_id: id, status: 'published' });
  const { data: folders } = useFolders(id!);

  // Filter upcoming sessions
  const upcomingSessions = sessions?.filter(s => 
    new Date(s.datetime) >= new Date() && 
    (s.status === 'scheduled' || s.status === 'live')
  ) || [];

  // Filter pending assignments
  const pendingAssignments = assignments?.filter(a => 
    !a.my_submission || a.my_submission.status === 'draft'
  ) || [];

  // Get next session with meeting link
  const nextSessionWithLink = upcomingSessions.find(s => s.meeting_link);

  if (espacoLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-muted/30">
          <div className="space-y-4 p-4">
            <Skeleton className="h-48 rounded-2xl" />
            <div className="flex gap-3 overflow-hidden">
              <Skeleton className="h-20 w-36 rounded-2xl shrink-0" />
              <Skeleton className="h-20 w-36 rounded-2xl shrink-0" />
              <Skeleton className="h-20 w-36 rounded-2xl shrink-0" />
            </div>
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!espaco) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <div className="text-center py-12 px-6 max-w-sm mx-auto rounded-3xl bg-card/70 backdrop-blur-sm border border-border/40">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">Espaço não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Este espaço não existe ou você não tem acesso a ele.
            </p>
            <Button 
              onClick={() => navigate('/dashboard/espacos')}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl"
            >
              Voltar para Meus Espaços
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30">
        {/* Hero Header */}
        <EspacoHeroHeader 
          espaco={espaco}
          nextSession={nextSessionWithLink}
        />

        {/* Metrics Row */}
        <EspacoMetricsRow
          sessionsCount={upcomingSessions.length}
          tasksCount={pendingAssignments.length}
          materialsCount={folders?.length || 0}
          maxStudents={espaco.max_students}
        />

        {/* Sticky Tabs */}
        <EspacoStickyTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingTasks={pendingAssignments.length}
          upcomingSessions={upcomingSessions.length}
        />

        {/* Tab Content */}
        <div className="px-4 py-6 pb-28 md:pb-8">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewContent
                upcomingSessions={upcomingSessions}
                pendingAssignments={pendingAssignments}
                sessionsLoading={sessionsLoading}
                assignmentsLoading={assignmentsLoading}
                onViewAllSessions={() => setActiveTab('sessions')}
                onViewAllAssignments={() => setActiveTab('assignments')}
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
          </div>
        </div>

        {/* Fixed Bottom CTA (Mobile Only) */}
        {nextSessionWithLink && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/40 md:hidden z-20">
            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl h-12 text-base font-medium"
              asChild
            >
              <a href={nextSessionWithLink.meeting_link!} target="_blank" rel="noopener noreferrer">
                <Video className="h-5 w-5 mr-2" />
                Acessar Encontro
              </a>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
