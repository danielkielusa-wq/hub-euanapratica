import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  DollarSign,
  TrendingUp,
  Zap,
  Filter,
  X,
  History,
  ChevronDown
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import JobCard from '@/components/jobSearch/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useJobs, usePrimeJobsStats, useJobCategories } from '@/hooks/useJobs';
import { useToggleBookmark } from '@/hooks/useJobBookmarks';
import { usePrimeJobsQuota } from '@/hooks/useJobApplications';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import type { JobFilters, Job } from '@/types/jobs';
import { JOB_CATEGORIES, EXPERIENCE_LABELS, REMOTE_TYPE_LABELS, JOB_TYPE_LABELS } from '@/types/jobs';

export default function PrimeJobs() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { planId, isPremiumPlan, isVipPlan } = usePlanAccess();
  const [filters, setFilters] = useState<JobFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Determine user plan for UI
  const userPlan = isVipPlan ? 'vip' : isPremiumPlan ? 'pro' : 'free';

  // Free preview count (admin-configurable via app_configs)
  const { getConfigValue } = useAppConfigs();
  const freePreviewCount = parseInt(getConfigValue('prime_jobs_free_preview_count') || '3', 10);

  // Fetch jobs
  const { jobs, totalCount, isLoading, refetch } = useJobs({ filters, limit: 50 });

  // Fetch stats
  const { data: stats } = usePrimeJobsStats();

  // Fetch categories
  const { data: categories } = useJobCategories();

  // Quota
  const { data: quota } = usePrimeJobsQuota();

  // Bookmark mutation
  const toggleBookmark = useToggleBookmark();

  const handleSearch = useCallback(() => {
    logEvent({
      event_type: 'prime_jobs_search',
      metadata: { query: searchInput || null }
    });
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  }, [searchInput, logEvent]);

  const handleFilterChange = (key: keyof JobFilters, value: string | number | undefined) => {
    logEvent({
      event_type: 'prime_jobs_filter_change',
      metadata: { filter: key, value: value || null }
    });
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    logEvent({
      event_type: 'prime_jobs_filters_clear'
    });
    setFilters({});
    setSearchInput('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  const handleViewDetails = (job: Job) => {
    logEvent({
      event_type: 'prime_jobs_open_job',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: {
        title: job.title,
        company: job.company_name
      }
    });
    navigate(`/prime-jobs/${job.id}`);
  };

  const handleBookmark = (job: Job) => {
    logEvent({
      event_type: 'prime_jobs_toggle_bookmark',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: {
        currently_bookmarked: job.is_bookmarked || false,
        source: 'list'
      }
    });
    toggleBookmark.mutate({
      jobId: job.id,
      isBookmarked: job.is_bookmarked || false,
    });
  };

  const handleUpgrade = () => {
    logEvent({
      event_type: 'prime_jobs_upgrade_click',
      metadata: { plan_id: planId || null }
    });
    setShowUpgradeModal(true);
  };

  // Stats data (all sourced from get_prime_jobs_stats RPC)
  const statsData = [
    { label: 'VAGAS ATIVAS', val: stats?.totalActiveJobs?.toLocaleString() || '0', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'MÉDIA SALARIAL', val: stats?.avgSalaryMin ? `$${Math.round(stats.avgSalaryMin / 1000)}k` : '—', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'NOVAS ESTA SEMANA', val: `+${stats?.newThisWeek || 0}`, icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'SETOR EM ALTA', val: stats?.topCategory || '—', icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' }
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-800">Prime Jobs</h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                userPlan === 'vip' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                userPlan === 'pro' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                PLANO {userPlan.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Vagas remotas curadas para brasileiros trabalharem em empresas americanas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {quota && quota.monthlyLimit > 0 && (
              <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                Créditos: <span className={`font-bold ${quota.remaining <= 0 ? 'text-amber-600' : quota.remaining <= 3 ? 'text-amber-500' : 'text-gray-900'}`}>
                  {quota.remaining} restantes
                </span>
              </div>
            )}
            <button
              onClick={() => {
                logEvent({ event_type: 'prime_jobs_open_history' });
                navigate('/prime-jobs/historico');
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
            <button
              onClick={() => {
                logEvent({ event_type: 'prime_jobs_open_bookmarks' });
                navigate('/prime-jobs/bookmarks');
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Minhas Vagas Salvas
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-2xl font-bold text-gray-800">{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar & Filters */}
        <div className="space-y-4">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Título da vaga, tecnologia ou empresa..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-[#2563eb] text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              <Search className="w-4 h-4" />
              BUSCAR
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border ${
                showFilters ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todas</option>
                    {(categories || JOB_CATEGORIES.map(c => ({ category: c, count: 0 }))).map(cat => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} {cat.count > 0 && `(${cat.count})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Senioridade</label>
                  <select
                    value={filters.experienceLevel || ''}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value as any)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todos os níveis</option>
                    {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Remote Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</label>
                  <select
                    value={filters.remoteType || ''}
                    onChange={(e) => handleFilterChange('remoteType', e.target.value as any)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todos</option>
                    {Object.entries(REMOTE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Job Type */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo de Contrato</label>
                  <select
                    value={filters.jobType || ''}
                    onChange={(e) => handleFilterChange('jobType', e.target.value as any)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todos os tipos</option>
                    {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500 font-medium flex justify-between items-center">
          <span>
            {totalCount} vaga{totalCount !== 1 ? 's' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4">
            {userPlan === 'free' && totalCount > freePreviewCount && (
              <span className="text-amber-600 text-xs font-bold">
                Você está vendo {freePreviewCount} de {totalCount} vagas
              </span>
            )}
            <span className="text-xs text-gray-400">Atualizado há 5 min</span>
          </div>
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-gray-500 max-w-sm">
              Tente ajustar seus filtros ou buscar por outros termos. Novas vagas são adicionadas diariamente.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-6 text-blue-600 font-bold hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {jobs.map((job, index) => {
                const isLocked = userPlan === 'free' && index >= freePreviewCount;

                return (
                  <JobCard
                    key={job.id}
                    job={job}
                    userPlan={userPlan}
                    isLocked={isLocked}
                    onViewDetails={() => handleViewDetails(job)}
                    onBookmark={() => handleBookmark(job)}
                    onUpgrade={handleUpgrade}
                    isBookmarkLoading={toggleBookmark.isPending}
                  />
                );
              })}
            </div>

            {/* Load More */}
            <div className="flex justify-center pt-8 pb-4">
              <button className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors shadow-sm">
                Carregar mais vagas
              </button>
            </div>
          </>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlanId={planId}
          reason="upgrade"
        />
      </div>
    </DashboardLayout>
  );
}
