import { CohortProgress } from '@/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BookOpen } from 'lucide-react';

interface ProgressOverviewProps {
  cohorts: CohortProgress[];
  isLoading?: boolean;
}

function ProgressItem({ cohort }: { cohort: CohortProgress }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground truncate">{cohort.name}</span>
        </div>
        <span className="text-sm font-semibold text-primary shrink-0 ml-2">
          {cohort.percentComplete}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={cohort.percentComplete} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
          {cohort.completedSessions}/{cohort.totalSessions} sessões
        </span>
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-12" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 flex-1" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function ProgressOverview({ cohorts, isLoading }: ProgressOverviewProps) {
  // Calculate overall progress
  const overallProgress = cohorts.length > 0
    ? Math.round(cohorts.reduce((sum, c) => sum + c.percentComplete, 0) / cohorts.length)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Progresso Geral
          </CardTitle>
          {!isLoading && cohorts.length > 0 && (
            <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <ProgressSkeleton />
            <ProgressSkeleton />
          </>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma turma ativa no momento</p>
          </div>
        ) : (
          cohorts.map((cohort) => (
            <ProgressItem key={cohort.id} cohort={cohort} />
          ))
        )}
      </CardContent>
    </Card>
  );
}
