import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StudentHeader } from '@/components/dashboard/StudentHeader';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useStudentUpcomingSessions, useStudentProgress } from '@/hooks/useStudentSessions';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Buscar dados reais do Supabase
  const { data: upcomingSessions, isLoading: sessionsLoading } = useStudentUpcomingSessions(5);
  const { data: cohortProgress, isLoading: progressLoading } = useStudentProgress();

  const handleViewAllSessions = () => {
    navigate('/dashboard/agenda');
  };

  const handleViewAllTasks = () => {
    navigate('/dashboard/tarefas');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <StudentHeader />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content - left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <UpcomingSessions 
              sessions={upcomingSessions || []}
              isLoading={sessionsLoading}
              onViewAll={handleViewAllSessions}
              hasMore={(upcomingSessions?.length || 0) > 3}
            />
            <PendingTasks onViewAll={handleViewAllTasks} />
          </div>

          {/* Sidebar - right column */}
          <div className="space-y-6">
            <QuickActions />
            <ProgressOverview 
              cohorts={cohortProgress || []}
              isLoading={progressLoading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
