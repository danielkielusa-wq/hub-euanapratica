import { useNavigate } from 'react-router-dom';
import { FileText, History, ChevronRight } from 'lucide-react';
import { useResumePassReports } from '@/hooks/useResumePassReports';

function getScoreStatus(score: number): 'good' | 'warning' | 'critical' {
  if (score >= 70) return 'good';
  if (score >= 50) return 'warning';
  return 'critical';
}

function getStatusColor(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good': return 'text-green-600 bg-green-50 border-green-100';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    case 'critical': return 'text-red-600 bg-red-50 border-red-100';
  }
}

function getStatusLabel(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good': return 'Boa compatibilidade';
    case 'warning': return 'Pode ser melhorado';
    case 'critical': return 'Abaixo do recomendado';
  }
}

export function ReportHistory() {
  const navigate = useNavigate();
  const { data: reports, isLoading, error } = useResumePassReports();

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
        Erro ao carregar histórico: {String(error)}
      </div>
    );
  }

  if (isLoading || !reports || reports.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          Histórico de Relatórios
        </h3>
        {reports.length > 3 && (
          <button className="text-xs sm:text-sm text-[#7367F0] font-bold hover:underline">
            Ver todos
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {reports.map((report) => {
          const date = new Date(report.created_at);
          const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const score = report.report_data?.header?.score;
          const status = score !== undefined ? getScoreStatus(score) : null;

          return (
            <div
              key={report.id}
              onClick={() => navigate(`/resumepass/report/${report.id}`)}
              className="px-3 py-3 sm:p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer gap-3"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-[#7367F0] shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-800 text-xs sm:text-sm mb-0.5 group-hover:text-[#7367F0] transition-colors truncate">
                    {report.title}
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500 flex-wrap">
                    <span>{formattedDate}</span>
                    {score !== undefined && status && (
                      <>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className={`hidden sm:inline ${status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {getStatusLabel(status)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {score !== undefined && status && (
                  <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[10px] sm:text-xs font-bold ${getStatusColor(status)}`}>
                    {score}%
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#7367F0] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
