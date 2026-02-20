import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useResumePassReports } from '@/hooks/useResumePassReports';

// Helper function to get score styling and label
function getScoreInfo(score: number) {
  if (score < 50) {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      label: '· abaixo do mínimo recomendado',
      labelColor: 'text-red-600',
    };
  }
  if (score < 70) {
    return {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      label: '· pode ser melhorado',
      labelColor: 'text-yellow-600',
    };
  }
  return {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: '· boa compatibilidade',
    labelColor: 'text-green-600',
  };
}

export function ReportHistory() {
  const navigate = useNavigate();
  const { data: reports, isLoading, error } = useResumePassReports();

  console.log('[ReportHistory]', { isLoading, error: error?.message, reportsCount: reports?.length, reports: reports?.map(r => ({ id: r.id, title: r.title, hasData: !!r.report_data })) });

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        DEBUG: ReportHistory query error: {String(error)}
      </div>
    );
  }

  if (isLoading || !reports || reports.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Histórico de Relatórios
        </h3>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {reports.map((report) => {
          const date = new Date(report.created_at);
          const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const score = report.report_data?.header?.score;
          const scoreInfo = score !== undefined ? getScoreInfo(score) : null;

          return (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {report.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                    {score !== undefined && scoreInfo && (
                      <>
                        <span className="text-gray-300">|</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-help">
                                <span className={`font-semibold ${scoreInfo.color}`}>
                                  {score}%
                                </span>
                                <span className={`text-[10px] ${scoreInfo.labelColor}`}>
                                  {scoreInfo.label}
                                </span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <p className="text-sm">
                                Scores abaixo de 70% são frequentemente descartados automaticamente
                                pelos sistemas ATS antes de chegar a um recrutador.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-primary hover:text-primary/80 flex-shrink-0"
                onClick={() => navigate(`/resumepass/report/${report.id}`)}
              >
                Ver relatório
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
