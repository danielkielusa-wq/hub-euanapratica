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
  subtitle?: string;
  isLoading?: boolean;
}

function MetricCard({ icon, iconBg, label, value, subtitle, isLoading }: MetricCardProps) {
  return (
    <Card variant="dashboard" className="p-5 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-9 w-20 mb-1" />
        ) : (
          <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        )}
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

  const studyTimeHours = Math.round(completedSessions * 1.5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        icon={<Video className="h-5 w-5 text-[#7367f0]" />}
        iconBg="bg-[#7367f0]/10"
        label="Mentoria Elite"
        value={`${completedSessions}/${totalSessions}`}
        subtitle="Aulas concluídas"
        isLoading={progressLoading}
      />
      <MetricCard
        icon={<ClipboardList className="h-5 w-5 text-amber-500" />}
        iconBg="bg-amber-500/10"
        label="Atividades Pendentes"
        value={`${pendingAssignments}`}
        subtitle="Aguardando entrega"
        isLoading={assignmentsLoading}
      />
      <MetricCard
        icon={<Clock className="h-5 w-5 text-emerald-500" />}
        iconBg="bg-emerald-500/10"
        label="Tempo Estimado"
        value={`~${studyTimeHours}h`}
        subtitle="Horas estudadas"
        isLoading={progressLoading}
      />
    </div>
  );
}
