import { AssignmentList } from '@/components/assignments/student/AssignmentList';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';


export default function StudentAssignments() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AssignmentList showHeader={true} />
      </div>
    </DashboardLayout>
  );
}
