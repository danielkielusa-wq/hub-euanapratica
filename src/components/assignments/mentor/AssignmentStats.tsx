import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  FileCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { useAssignmentStats } from '@/hooks/useSubmissions';

interface AssignmentStatsProps {
  assignmentId: string;
}

export function AssignmentStats({ assignmentId }: AssignmentStatsProps) {
  const { data: stats, isLoading } = useAssignmentStats(assignmentId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total de Alunos',
      value: stats.total_students,
      icon: Users,
      description: 'Matriculados na turma',
    },
    {
      title: 'Taxa de Entrega',
      value: `${stats.submission_rate}%`,
      icon: FileCheck,
      description: `${stats.submitted_count} de ${stats.total_students} entregaram`,
      progress: stats.submission_rate,
    },
    {
      title: 'Avaliações Pendentes',
      value: stats.pending_count,
      icon: Clock,
      description: `${stats.reviewed_count} já avaliadas`,
    },
    {
      title: 'Entregas no Prazo',
      value: stats.on_time_count,
      icon: CheckCircle,
      description: stats.late_count > 0 ? `${stats.late_count} atrasadas` : 'Todas no prazo',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.progress !== undefined && (
                <Progress value={stat.progress} className="mt-3 h-2" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
