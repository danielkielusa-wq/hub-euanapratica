import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Briefcase,
  DollarSign,
  TrendingUp,
  Zap,
  Filter,
  X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import JobCard from '@/components/jobSearch/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useJobs, usePrimeJobsStats, useJobCategories } from '@/hooks/useJobs';
import { useToggleBookmark } from '@/hooks/useJobBookmarks';
import { usePrimeJobsQuota } from '@/hooks/useJobApplications';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { JobFilters, Job } from '@/types/jobs';
import { JOB_CATEGORIES, EXPERIENCE_LABELS, REMOTE_TYPE_LABELS, JOB_TYPE_LABELS } from '@/types/jobs';

const FREE_PREVIEW_COUNT = 3;

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

  // Stats data
  const statsData = [
    { label: 'Vagas Ativas', val: stats?.totalActiveJobs?.toLocaleString() || '0', icon: Briefcase, color: 'text-brand-600', bg: 'bg-brand-50' },
    { label: 'Média Salarial', val: stats?.avgSalaryMin ? `$${Math.round(stats.avgSalaryMin / 1000)}k` : '$0', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Novas Esta Semana', val: `+${stats?.newThisWeek || 0}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Setor em Alta', val: stats?.topCategory || 'Engineering', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-10 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Prime Jobs</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                  userPlan === 'vip' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  userPlan === 'pro' ? 'bg-brand-50 text-brand-600 border-brand-200' :
                  'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                Plano {userPlan}
              </span>
            </div>
            <p className="text-gray-500 font-medium">
              Vagas remotas curadas para brasileiros trabalharem em empresas americanas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {quota && userPlan !== 'free' && (
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm">
                <span className="text-gray-500">Aplicações:</span>{' '}
                <span className="font-bold text-gray-900">{quota.remaining}/{quota.monthlyLimit}</span>
              </div>
            )}
            <Button
              onClick={() => {
                logEvent({ event_type: 'prime_jobs_open_bookmarks' });
                navigate('/prime-jobs/bookmarks');
              }}
              variant="outline"
              className="rounded-xl"
            >
              Minhas Vagas Salvas
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <s.icon size={22} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-2xl font-black text-gray-900">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Título da vaga, tecnologia ou empresa..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-lg shadow-brand-600/20 transition-all active:scale-95"
            >
              <Search size={20} className="mr-2" /> BUSCAR
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="px-6 py-4 rounded-2xl"
            >
              <Filter size={20} className="mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-brand-600 rounded-full" />
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white"
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
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Senioridade</label>
                <select
                  value={filters.experienceLevel || ''}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value as any)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white"
                >
                  <option value="">Todos os níveis</option>
                  {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Remote Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Modelo</label>
                <select
                  value={filters.remoteType || ''}
                  onChange={(e) => handleFilterChange('remoteType', e.target.value as any)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white"
                >
                  <option value="">Todos</option>
                  {Object.entries(REMOTE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Job Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Contrato</label>
                <select
                  value={filters.jobType || ''}
                  onChange={(e) => handleFilterChange('jobType', e.target.value as any)}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-sm outline-none focus:bg-white"
                >
                  <option value="">Todos os tipos</option>
                  {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="col-span-full flex justify-end">
                  <Button
                    onClick={clearFilters}
                    variant="ghost"
                    className="text-gray-500"
                  >
                    <X size={16} className="mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-500">
            {totalCount} vaga{totalCount !== 1 ? 's' : ''} encontrada{totalCount !== 1 ? 's' : ''}
          </p>
          {userPlan === 'free' && totalCount > FREE_PREVIEW_COUNT && (
            <p className="text-sm text-amber-600 font-bold">
              Você está vendo {FREE_PREVIEW_COUNT} de {totalCount} vagas. Faça upgrade para ver todas!
            </p>
          )}
        </div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 rounded-[32px]" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">
              Nenhuma vaga encontrada
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              Tente ajustar os filtros ou volte mais tarde. Novas vagas são adicionadas diariamente!
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {jobs.map((job, index) => {
              const isLocked = userPlan === 'free' && index >= FREE_PREVIEW_COUNT;

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
