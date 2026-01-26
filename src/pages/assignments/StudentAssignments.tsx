import { AssignmentList } from '@/components/assignments/student/AssignmentList';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';

export default function StudentAssignments() {
  return (
    <DashboardLayout>
      <DashboardTopHeader />
      
      <div className="flex-1 p-6 bg-gray-50/50">
        <AssignmentList showHeader={true} />
      </div>
    </DashboardLayout>
  );
}
