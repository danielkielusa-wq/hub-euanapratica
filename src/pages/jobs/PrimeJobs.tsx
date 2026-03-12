import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Bookmark,
  Clock,
  X,
  History,
  Briefcase,
  DollarSign,
  TrendingUp,
  Zap,
  Lock,
  Heart,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobs, usePrimeJobsStats, useJobCategories } from '@/hooks/useJobs';
import { useToggleBookmark } from '@/hooks/useJobBookmarks';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import type { JobFilters, Job } from '@/types/jobs';
import {
  JOB_CATEGORIES,
  EXPERIENCE_LABELS,
  REMOTE_TYPE_LABELS,
  JOB_TYPE_LABELS,
  formatSalary,
  getTimeAgo,
  isNewJob
} from '@/types/jobs';

export default function PrimeJobs() {
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { planId, isPremiumPlan, isVipPlan } = usePlanAccess();
  const [filters, setFilters] = useState<JobFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const userPlan = isVipPlan ? 'vip' : isPremiumPlan ? 'pro' : 'free';

  const { getConfigValue } = useAppConfigs();
  const freePreviewCount = parseInt(getConfigValue('prime_jobs_free_preview_count') || '3', 10);

  const { jobs, totalCount, isLoading, refetch } = useJobs({ filters, limit: 50 });
  const { data: stats } = usePrimeJobsStats();
  const { data: categories } = useJobCategories();
  const toggleBookmark = useToggleBookmark();

  const handleSearch = useCallback(() => {
    logEvent({
      event_type: 'prime_jobs_search',
      metadata: { query: searchInput || null }
    });
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  }, [searchInput, logEvent]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    logEvent({
      event_type: 'prime_jobs_filter_change',
      metadata: { filter: 'category', value: cat === 'All' ? null : cat }
    });
    setFilters(prev => ({ ...prev, category: cat === 'All' ? undefined : cat }));
  };

  const handleFilterChange = (key: keyof JobFilters, value: string | number | undefined) => {
    logEvent({
      event_type: 'prime_jobs_filter_change',
      metadata: { filter: key, value: value || null }
    });
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const clearFilters = () => {
    logEvent({ event_type: 'prime_jobs_filters_clear' });
    setFilters({});
    setSearchInput('');
    setSelectedCategory('All');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  const handleViewDetails = (job: Job) => {
    logEvent({
      event_type: 'prime_jobs_open_job',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: { title: job.title, company: job.company_name }
    });
    navigate(`/prime-jobs/${job.id}`);
  };

  const handleBookmark = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    logEvent({
      event_type: 'prime_jobs_toggle_bookmark',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: { currently_bookmarked: job.is_bookmarked || false, source: 'list' }
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
    navigate('/pricing');
  };

  // Stats data
  const statsData = [
    { label: 'Vagas Ativas', val: stats?.totalActiveJobs?.toLocaleString() || '0', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Média Salarial', val: stats?.avgSalaryMin ? `$${Math.round(stats.avgSalaryMin / 1000)}k` : '--', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Novas esta semana', val: `+${stats?.newThisWeek || 0}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Setor em alta', val: stats?.topCategory || '--', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-100' }
  ];

  // Category list
  const categoryList = ['All', ...(categories?.map(c => c.category) || JOB_CATEGORIES)];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8f9fc] pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 leading-tight">
                  Prime <span className="font-bold">Jobs</span>
                </h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  userPlan === 'vip' ? 'bg-amber-100 text-amber-600' :
                  userPlan === 'pro' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {userPlan.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    logEvent({ event_type: 'prime_jobs_open_history' });
                    navigate('/prime-jobs/historico');
                  }}
                  className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                  title="Historico"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    logEvent({ event_type: 'prime_jobs_open_bookmarks' });
                    navigate('/prime-jobs/bookmarks');
                  }}
                  className="p-2.5 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                  title="Vagas Salvas"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Vagas remotas curadas para brasileiros trabalharem em empresas americanas.
            </p>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar vaga, empresa ou tecnologia..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3.5 bg-white rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm border border-gray-100"
                />
              </div>
              <button
                onClick={handleSearch}
                className="p-3.5 bg-gray-900 rounded-full shadow-sm text-white hover:bg-gray-800 transition-colors shrink-0"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3.5 rounded-full shadow-sm border transition-colors shrink-0 relative ${
                  showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm mb-6 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Senioridade</label>
                  <select
                    value={filters.experienceLevel || ''}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todos os niveis</option>
                    {Object.entries(EXPERIENCE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Modelo</label>
                  <select
                    value={filters.remoteType || ''}
                    onChange={(e) => handleFilterChange('remoteType', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todos</option>
                    {Object.entries(REMOTE_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de Contrato</label>
                  <select
                    value={filters.jobType || ''}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Todos os tipos</option>
                    {Object.entries(JOB_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
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

          {/* Stats (compact horizontal) */}
          <div className="flex overflow-x-auto no-scrollbar gap-3 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            {statsData.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 min-w-[160px] shrink-0">
                <div className={`w-10 h-10 ${s.bg} rounded-full flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</div>
                  <div className="text-lg font-bold text-gray-900">{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categoria</h2>
            <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {categoryList.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat === 'All' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {totalCount} vaga{totalCount !== 1 ? 's' : ''}
            </h2>
            {userPlan === 'free' && totalCount > freePreviewCount && (
              <span className="text-amber-600 text-xs font-bold">
                Vendo {freePreviewCount} de {totalCount}
              </span>
            )}
          </div>

          {/* Job List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-3xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-gray-500 max-w-sm text-sm">
                Tente ajustar seus filtros ou buscar por outros termos. Novas vagas sao adicionadas diariamente.
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="mt-6 text-blue-600 font-bold text-sm hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {jobs.map((job, index) => {
                  const isLocked = userPlan === 'free' && index >= freePreviewCount;
                  const salaryDisplay = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
                  const isNew = isNewJob(job.created_at);

                  return (
                    <div
                      key={job.id}
                      onClick={() => isLocked ? handleUpgrade() : handleViewDetails(job)}
                      className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-sm transition-all cursor-pointer ${
                        isLocked ? 'opacity-70 hover:opacity-90' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Company initial avatar */}
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                            isLocked ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {isLocked ? <Lock className="w-5 h-5" /> : (job.company_name?.charAt(0) || '?')}
                          </div>
                          <div className="min-w-0">
                            <h3 className={`font-semibold text-base leading-snug ${
                              isLocked ? 'text-gray-400 blur-[2px] select-none' : 'text-gray-900'
                            }`}>
                              {job.title}
                            </h3>
                            <p className={`text-sm truncate ${isLocked ? 'text-gray-300' : 'text-gray-500'}`}>
                              {isLocked ? `${job.company_name.substring(0, 3)}***` : job.company_name} &middot; {job.location}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className={`font-bold text-base ${isLocked ? 'text-gray-300 blur-[2px]' : 'text-gray-900'}`}>
                            {salaryDisplay ? (
                              <>{salaryDisplay.split('/')[0]}<span className="text-sm font-normal text-gray-500">/mo</span></>
                            ) : (
                              <span className="text-sm font-normal text-gray-400">A combinar</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-blue-600" />
                          {REMOTE_TYPE_LABELS[job.remote_type]}
                        </span>
                        <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium">
                          {JOB_TYPE_LABELS[job.job_type]}
                        </span>
                        {job.experience_level && (
                          <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium">
                            {EXPERIENCE_LABELS[job.experience_level]}
                          </span>
                        )}
                        {job.tech_stack && job.tech_stack.length > 0 && !isLocked && (
                          <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs font-medium">
                            +{job.tech_stack.length} tech
                          </span>
                        )}
                        {isNew && !isLocked && (
                          <span className="px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-xs font-bold">
                            NOVO
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {getTimeAgo(job.created_at)}
                          </span>
                          {job.is_applied && (
                            <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Acessada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isLocked && (
                            <button
                              onClick={(e) => handleBookmark(e, job)}
                              disabled={toggleBookmark.isPending}
                              className={`p-1.5 rounded-full transition-all ${
                                job.is_bookmarked ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${job.is_bookmarked ? 'fill-current' : ''}`} />
                            </button>
                          )}
                          {isLocked && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-400 font-semibold rounded text-[10px] uppercase tracking-wider">
                              Upgrade
                            </span>
                          )}
                          {job.is_featured && !isLocked && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-600 font-semibold rounded text-[10px] uppercase tracking-wider">
                              Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load More */}
              <div className="flex justify-center pt-8 pb-4">
                <button className="px-8 py-3 bg-white border border-gray-200 rounded-full text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                  Carregar mais vagas
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
