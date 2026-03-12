import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  MapPin,
  Building,
  Heart,
  Share2,
  ArrowRight,
  Lock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  FileText,
  Globe,
  Languages
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useJob, useTranslateJob } from '@/hooks/useJob';
import type { JobTranslation } from '@/hooks/useJob';
import { useToggleBookmark } from '@/hooks/useJobBookmarks';
import { useApplyToJob, usePrimeJobsQuota } from '@/hooks/useJobApplications';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';
import {
  formatSalary,
  getTimeAgo,
  REMOTE_TYPE_LABELS,
  JOB_TYPE_LABELS,
  EXPERIENCE_LABELS
} from '@/types/jobs';
import JobAIInsights from '@/components/jobSearch/JobAIInsights';
import JobUpsellBlock from '@/components/jobSearch/JobUpsellBlock';
import JobPostApplyModal from '@/components/jobSearch/JobPostApplyModal';
import { useJobUpsellConfig } from '@/hooks/useJobUpsell';

type TabKey = 'overview' | 'company' | 'analysis';

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { planId } = usePlanAccess();
  const [showPostApplyModal, setShowPostApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showTranslation, setShowTranslation] = useState(false);
  const upsellConfig = useJobUpsellConfig();

  const { data: job, isLoading, error } = useJob(id);
  const translateJob = useTranslateJob(id);

  const { data: quota } = usePrimeJobsQuota();
  const hasPlan = quota ? quota.monthlyLimit > 0 : false;
  const canApply = quota?.canApply ?? false;

  const toggleBookmark = useToggleBookmark();
  const applyToJob = useApplyToJob();

  useEffect(() => {
    if (!job) return;
    logEvent({
      event_type: 'prime_jobs_job_view',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: { title: job.title, company: job.company_name }
    });
  }, [job, logEvent]);

  const handleBookmark = () => {
    if (!job) return;
    logEvent({
      event_type: 'prime_jobs_toggle_bookmark',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: { currently_bookmarked: job.is_bookmarked || false, source: 'detail' }
    });
    toggleBookmark.mutate({
      jobId: job.id,
      isBookmarked: job.is_bookmarked || false,
    });
  };

  const handleApply = () => {
    if (!job) return;
    logEvent({
      event_type: 'prime_jobs_apply_click',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: { has_plan: hasPlan, can_apply: canApply, remaining: quota?.remaining ?? null }
    });

    if (!hasPlan || !canApply) {
      navigate('/pricing');
      return;
    }

    applyToJob.mutate(
      { jobId: job.id },
      {
        onSuccess: () => {
          if (upsellConfig.enabled && upsellConfig.post_apply_service_id) {
            setShowPostApplyModal(true);
          }
        },
      }
    );
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/vaga/${id}`;
    logEvent({
      event_type: 'prime_jobs_share',
      entity_type: 'prime_job',
      entity_id: job?.id || null,
      metadata: { url: shareUrl }
    });
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado!', { description: 'Compartilhe esta vaga com seus amigos.' });
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f8f9fc]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-20 rounded-3xl" />
            <Skeleton className="h-12 rounded-full" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-4">
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Vaga nao encontrada</h2>
            <p className="text-gray-500 mb-6">Esta vaga nao esta mais disponivel ou foi removida.</p>
            <Button onClick={() => navigate('/prime-jobs')} className="rounded-full">
              Voltar para Prime Jobs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const salaryDisplay = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Descricao' },
    { key: 'company', label: 'Empresa' },
    { key: 'analysis', label: 'Analise ENP' },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8f9fc]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">

          {/* Top Navigation */}
          <nav className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/prime-jobs')}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBookmark}
                disabled={toggleBookmark.isPending}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-sm ${
                  job.is_bookmarked
                    ? 'border-red-200 bg-red-50 text-red-500'
                    : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${job.is_bookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </nav>

          {/* Job Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
              {job.company_name?.charAt(0) || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1 leading-tight">{job.title}</h1>
              <p className="text-gray-500 text-sm">
                {job.company_name} &middot; {job.location}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-blue-600" />
              {REMOTE_TYPE_LABELS[job.remote_type]}
            </span>
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium">
              {JOB_TYPE_LABELS[job.job_type]}
            </span>
            {job.experience_level && (
              <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium">
                {EXPERIENCE_LABELS[job.experience_level]}
              </span>
            )}
            {salaryDisplay && (
              <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {salaryDisplay}
              </span>
            )}
            {job.is_applied && (
              <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-600 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Acessada
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-8">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" /> {job.company_name}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {getTimeAgo(job.created_at)}
            </span>
          </div>

          {/* Upgrade Banner (no plan) */}
          {!canApply && (
            <div className="bg-primary/5 rounded-3xl p-5 border border-primary/20 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h6 className="font-semibold text-gray-900 text-sm">Oportunidade exclusiva Prime Jobs</h6>
                  <p className="text-xs text-gray-500">Faca upgrade para ter acesso direto ao recrutador.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  logEvent({ event_type: 'prime_jobs_upgrade_click', metadata: { plan_id: planId || null, source: 'job_banner' } });
                  navigate('/pricing');
                }}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2 shrink-0"
              >
                Ver Planos <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tabs (pill style) */}
          <div className="bg-gray-100 p-1 rounded-full flex mb-8">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.key === 'analysis' && (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {tab.label}
                {tab.key === 'analysis' && (
                  <span className="px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded">
                    AI
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div key={activeTab}>
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Description Card */}
                {(() => {
                  const translation = job.ai_enrichment?.translation_pt as JobTranslation | undefined;
                  const hasCache = !!translation?.description;
                  const isTranslating = translateJob.isPending;

                  const handleTranslateToggle = () => {
                    if (showTranslation) {
                      setShowTranslation(false);
                      return;
                    }
                    if (hasCache) {
                      setShowTranslation(true);
                      return;
                    }
                    translateJob.mutate(undefined, {
                      onSuccess: () => setShowTranslation(true),
                    });
                  };

                  const desc = showTranslation && translation?.description
                    ? translation.description
                    : (job.description || '');

                  return (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-900">Sobre a vaga</h2>
                        <button
                          onClick={handleTranslateToggle}
                          disabled={isTranslating}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            showTranslation
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                          }`}
                        >
                          {isTranslating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Languages className="w-3.5 h-3.5" />
                          )}
                          {isTranslating
                            ? 'Traduzindo...'
                            : showTranslation
                              ? 'Original'
                              : 'Traduzir PT-BR'}
                        </button>
                      </div>
                      <div className="text-gray-600 text-sm leading-relaxed prose max-w-none">
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(desc) }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Tech Stack Card */}
                {job.tech_stack && job.tech_stack.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Tecnologias</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.tech_stack.map((tech, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-xs font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary & Remote info cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Compensacao</p>
                        <p className="font-semibold text-gray-900 text-sm">{job.salary_currency || 'USD'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {salaryDisplay
                        ? `${salaryDisplay} — Pagamento mensal.`
                        : 'Valor a combinar conforme experiencia.'}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Modelo</p>
                        <p className="font-semibold text-gray-900 text-sm">{REMOTE_TYPE_LABELS[job.remote_type]}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {job.remote_type === 'fully_remote'
                        ? '100% remoto. Fuso horario alinhado ao cliente.'
                        : job.remote_type === 'hybrid'
                          ? 'Modelo hibrido.'
                          : 'Trabalho presencial.'}
                    </p>
                  </div>
                </div>

                {/* Resume optimization card */}
                {job.ai_enrichment?.resume_pass_keywords && job.ai_enrichment.resume_pass_keywords.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Otimize seu CV
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Use estas palavras-chave para passar no filtro ATS:</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {job.ai_enrichment.resume_pass_keywords.slice(0, 5).map((kw, i) => (
                        <span key={i} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-xs font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate('/curriculo')}
                      className="w-full py-3 bg-gray-900 text-white rounded-full font-medium text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Gerar CV Otimizado
                    </button>
                  </div>
                )}

                {/* Upsell */}
                <JobUpsellBlock job={job} />
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-5">
                {/* About company card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Sobre {job.company_name}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Empresa focada em contratar talentos LATAM para atuar remotamente com equipes nos EUA. Valorizamos autonomia, comunicacao clara e uma forte etica de trabalho.
                  </p>
                </div>

                {/* Company details card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                  <div className="flex justify-between items-center px-6 py-4">
                    <span className="text-xs text-gray-500">Categoria</span>
                    <span className="text-xs font-semibold text-gray-900">{job.category}</span>
                  </div>
                  {job.industry && (
                    <div className="flex justify-between items-center px-6 py-4">
                      <span className="text-xs text-gray-500">Industria</span>
                      <span className="text-xs font-semibold text-gray-900">{job.industry}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-6 py-4">
                    <span className="text-xs text-gray-500">Localizacao</span>
                    <span className="text-xs font-semibold text-gray-900">{job.location}</span>
                  </div>
                  <div className="flex justify-between items-center px-6 py-4">
                    <span className="text-xs text-gray-500">Publicado</span>
                    <span className="text-xs font-semibold text-gray-900">{getTimeAgo(job.created_at)}</span>
                  </div>
                  {job.salary_notes && (
                    <div className="flex justify-between items-center px-6 py-4">
                      <span className="text-xs text-gray-500">Notas salariais</span>
                      <span className="text-xs font-semibold text-gray-900">{job.salary_notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {job.ai_enrichment ? (
                  <JobAIInsights enrichment={job.ai_enrichment} />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Analise em processamento</h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                      A analise de compatibilidade para esta vaga ainda esta sendo gerada. Volte em breve.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quota indicator (inline) */}
          {hasPlan && quota && (
            <div className="mt-8 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-medium text-gray-500">Creditos este mes</span>
                <span className="font-bold text-gray-900">{quota.usedThisMonth}/{quota.monthlyLimit}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    quota.remaining <= 0 ? 'bg-amber-500' : quota.remaining <= 3 ? 'bg-amber-400' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (quota.usedThisMonth / Math.max(1, quota.monthlyLimit)) * 100)}%` }}
                />
              </div>
              {quota.remaining <= 3 && quota.remaining > 0 && (
                <p className="text-xs text-amber-600 font-medium mt-2">
                  Restam apenas {quota.remaining} credito(s) este mes
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar — inside content flow, doesn't cover sidebar */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 p-4 sm:p-6 -mx-4 sm:-mx-6 mt-8">
          <div className="max-w-5xl mx-auto">
            {!hasPlan ? (
              <button
                onClick={() => {
                  logEvent({ event_type: 'prime_jobs_upgrade_click', metadata: { plan_id: planId || null, source: 'apply_lock' } });
                  navigate('/pricing');
                }}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold text-base transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" /> Ver Planos para Acessar
              </button>
            ) : job.is_applied ? (
              <button
                disabled
                className="w-full py-4 bg-green-500 text-white rounded-full font-semibold text-base cursor-default flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Acesso Liberado
              </button>
            ) : !canApply ? (
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold text-base transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" /> Sem Creditos — Ver Planos
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applyToJob.isPending}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold text-base transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                {applyToJob.isPending ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Briefcase className="w-5 h-5" />
                    Acessar Vaga
                  </>
                )}
              </button>
            )}
            <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1.5">
              <Users className="w-3 h-3" />
              {job.is_applied ? 'Voce acessou — agora e com voce' : 'Link exclusivo · nunca exposto publicamente'}
            </p>
          </div>
        </div>
      </div>

      <JobPostApplyModal
        open={showPostApplyModal}
        onClose={() => setShowPostApplyModal(false)}
        jobTitle={job.title}
      />
    </DashboardLayout>
  );
}
