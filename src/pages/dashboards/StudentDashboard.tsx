import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StudentHeader } from '@/components/dashboard/StudentHeader';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import { PendingTasks } from '@/components/dashboard/PendingTasks';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
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
      <div className="space-y-8">
        <StudentHeader />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content - left 2 columns */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            <UpcomingSessions 
              sessions={upcomingSessions || []}
              isLoading={sessionsLoading}
              onViewAll={handleViewAllSessions}
              hasMore={(upcomingSessions?.length || 0) > 3}
            />
            <PendingTasks onViewAll={handleViewAllTasks} />
          </div>

          {/* Sidebar - right column */}
          <div className="order-1 lg:order-2 flex flex-col items-center lg:items-stretch">
            <div className="w-full max-w-[90%] lg:max-w-none mx-auto lg:mx-0">
              <ProgressOverview 
                cohorts={cohortProgress || []}
                isLoading={progressLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
