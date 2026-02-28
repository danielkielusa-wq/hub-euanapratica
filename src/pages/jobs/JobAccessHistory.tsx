import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle2, Clock, XCircle, Briefcase } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAccessHistory, usePrimeJobsQuota } from '@/hooks/useJobApplications';
import type { AccessHistoryItem } from '@/hooks/useJobApplications';
import { EXPERIENCE_LABELS, REMOTE_TYPE_LABELS } from '@/types/jobs';

function groupByMonth(items: AccessHistoryItem[]) {
  const groups: Record<string, AccessHistoryItem[]> = {};
  for (const item of items) {
    const date = new Date(item.applied_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function JobAccessHistory() {
  const navigate = useNavigate();
  const { data: history, isLoading } = useAccessHistory();
  const { data: quota } = usePrimeJobsQuota();

  const grouped = groupByMonth(history || []);
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6 animate-fade-in space-y-8">
        {/* Back */}
        <button
          onClick={() => navigate('/prime-jobs')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para Prime Jobs
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Histórico de Acessos
          </h1>
          <p className="text-gray-500 font-medium">
            Cada oportunidade acessada que consumiu um crédito do seu plano.
          </p>
        </div>

        {/* Quota summary card */}
        {quota && quota.monthlyLimit > 0 && (
          <div className="bg-gray-900 text-white rounded-[32px] p-6 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mês atual</p>
              <p className="text-2xl font-black">
                {quota.usedThisMonth}
                <span className="text-gray-400 font-bold text-lg"> / {quota.monthlyLimit} acessos</span>
              </p>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                <span>Usado</span>
                <span>{quota.remaining} restante{quota.remaining !== 1 ? 's' : ''}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quota.remaining <= 0 ? 'bg-amber-500' : quota.remaining <= 3 ? 'bg-amber-400' : 'bg-brand-500'
                  }`}
                  style={{ width: `${Math.min(100, (quota.usedThisMonth / Math.max(1, quota.monthlyLimit)) * 100)}%` }}
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-medium sm:max-w-[140px] leading-relaxed">
              Créditos resetam no 1º dia de cada mês.
            </p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-[20px]" />
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">
              Nenhuma oportunidade acessada ainda
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              Quando você acessar uma vaga Prime Jobs, ela aparecerá aqui para sua referência.
            </p>
            <Button onClick={() => navigate('/prime-jobs')}>
              Explorar Vagas
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            {months.map((monthKey) => {
              const items = grouped[monthKey];
              const isCurrentMonth = monthKey === currentMonthKey;

              return (
                <div key={monthKey}>
                  {/* Month header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-sm font-black text-gray-500 uppercase tracking-widest capitalize">
                      {formatMonthLabel(monthKey)}
                    </h2>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs font-bold text-gray-400">
                      {items.length} acesso{items.length !== 1 ? 's' : ''}
                      {isCurrentMonth && quota && quota.monthlyLimit > 0 && (
                        <span className="ml-1 text-brand-600">
                          (de {quota.monthlyLimit})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Access list */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.application_id}
                        className="bg-white rounded-[20px] border border-gray-100 p-5 flex items-center gap-5 hover:border-gray-200 hover:shadow-sm transition-all"
                      >
                        {/* Company avatar */}
                        <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                          {item.company_logo_url ? (
                            <img
                              src={item.company_logo_url}
                              alt={item.company_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            item.company_name?.slice(0, 2).toUpperCase() || '??'
                          )}
                        </div>

                        {/* Job info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-sm leading-tight truncate">
                            {item.title || 'Vaga removida'}
                          </p>
                          <p className="text-xs text-gray-500 font-medium truncate">
                            {item.company_name || '—'}
                            {item.experience_level && (
                              <span className="ml-2 text-gray-400">
                                · {EXPERIENCE_LABELS[item.experience_level] || item.experience_level}
                              </span>
                            )}
                            {item.remote_type && (
                              <span className="ml-2 text-gray-400">
                                · {REMOTE_TYPE_LABELS[item.remote_type] || item.remote_type}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Status + date */}
                        <div className="text-right shrink-0 hidden sm:block">
                          <div className="flex items-center justify-end gap-1.5 mb-1">
                            {item.is_active ? (
                              <>
                                <CheckCircle2 size={12} className="text-green-500" />
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-wide">Ativa</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={12} className="text-gray-400" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Encerrada</span>
                              </>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {formatDate(item.applied_at)}
                          </p>
                        </div>

                        {/* Action */}
                        {item.is_active && (
                          <button
                            onClick={() => navigate(`/prime-jobs/${item.job_id}`)}
                            className="shrink-0 p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-all"
                            title="Ver vaga"
                          >
                            <ExternalLink size={16} />
                          </button>
                        )}

                        {/* Mobile date */}
                        <div className="sm:hidden text-right text-[10px] text-gray-400 font-medium shrink-0">
                          {new Date(item.applied_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Transparency note */}
            <div className="flex items-start gap-3 bg-gray-50 rounded-[20px] p-5">
              <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Este histórico lista todas as oportunidades cujo link foi acessado pelo seu plano.
                Cada acesso consome 1 crédito mensal — independente de você ter enviado a candidatura ou não.
                Os créditos são resetados automaticamente no primeiro dia de cada mês.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
