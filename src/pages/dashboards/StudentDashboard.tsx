import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { HeroCard } from '@/components/dashboard/HeroCard';
import { MetricsRow } from '@/components/dashboard/MetricsRow';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { SessionsSidebar } from '@/components/dashboard/SessionsSidebar';

export default function StudentDashboard() {
  const navigate = useNavigate();

  const handleViewAllTasks = () => {
    navigate('/dashboard/tarefas');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <HeroCard />
        <MetricsRow />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content — activities */}
          <div className="lg:col-span-2">
            <RecentActivities onViewAll={handleViewAllTasks} />
          </div>

          {/* Sidebar — sessions */}
          <div>
            <SessionsSidebar />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
