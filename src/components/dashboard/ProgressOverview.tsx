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
    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{cohort.name}</span>
        </div>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">
          {cohort.percentComplete}%
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={cohort.percentComplete} className="h-2 flex-1" />
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 w-16 text-right">
          {cohort.completedSessions}/{cohort.totalSessions} sessões
        </span>
      </div>
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 space-y-3">
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
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Progresso Geral
          </CardTitle>
          {!isLoading && cohorts.length > 0 && (
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{overallProgress}%</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <ProgressSkeleton />
            <ProgressSkeleton />
          </>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400">
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
