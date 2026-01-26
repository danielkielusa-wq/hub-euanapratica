import { Video, ClipboardList, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useStudentProgress } from '@/hooks/useStudentSessions';
import { useAssignments } from '@/hooks/useAssignments';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  isLoading?: boolean;
}

function MetricCard({ icon, iconBg, label, value, isLoading }: MetricCardProps) {
  return (
    <Card className="p-4 rounded-[20px] border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16 mt-1" />
          ) : (
            <p className="text-lg font-bold text-foreground">{value}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function MetricsRow() {
  const { data: cohortProgress, isLoading: progressLoading } = useStudentProgress();
  const { data: assignments, isLoading: assignmentsLoading } = useAssignments();

  // Calculate metrics from real data
  const totalSessions = cohortProgress?.reduce((acc, c) => acc + c.totalSessions, 0) || 0;
  const completedSessions = cohortProgress?.reduce((acc, c) => acc + c.completedSessions, 0) || 0;
  
  const pendingAssignments = assignments?.filter(a => 
    a.status === 'published' && !a.my_submission
  ).length || 0;

  // Placeholder for study time (would need tracking feature)
  const studyTimeHours = Math.round(completedSessions * 1.5); // Estimate 1.5h per session

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        icon={<Video className="h-5 w-5 text-primary" />}
        iconBg="bg-primary/10"
        label="Mentoria Elite"
        value={`${completedSessions}/${totalSessions} Aulas`}
        isLoading={progressLoading}
      />
      <MetricCard
        icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
        iconBg="bg-amber-500/10"
        label="Atividades"
        value={`${pendingAssignments} Pendentes`}
        isLoading={assignmentsLoading}
      />
      <MetricCard
        icon={<Clock className="h-5 w-5 text-emerald-500" />}
        iconBg="bg-emerald-500/10"
        label="Tempo Total"
        value={`${studyTimeHours}h Estudadas`}
        isLoading={progressLoading}
      />
    </div>
  );
}
