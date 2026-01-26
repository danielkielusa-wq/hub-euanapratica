import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
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
      <div className="flex flex-col h-full">
        {/* Top Header - Only visible on desktop */}
        <DashboardTopHeader />
        
        {/* Main Content Area */}
        <div className="flex-1 p-6 lg:p-8 bg-muted/30">
          <div className="grid lg:grid-cols-3 gap-6 xl:gap-8">
            {/* Left Column - 2/3 width */}
            <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
              <HeroCard />
              <MetricsRow />
              <RecentActivities onViewAll={handleViewAllTasks} />
            </div>
            
            {/* Right Column - 1/3 width */}
            <div className="order-1 lg:order-2">
              <SessionsSidebar />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
