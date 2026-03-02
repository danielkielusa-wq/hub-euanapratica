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
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  FileText,
  Award
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useJob } from '@/hooks/useJob';
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
import JobSidebarUpsell from '@/components/jobSearch/JobSidebarUpsell';
import JobPostApplyModal from '@/components/jobSearch/JobPostApplyModal';
import { useJobUpsellConfig } from '@/hooks/useJobUpsell';
import { cn } from '@/lib/utils';

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { planId, isPremiumPlan, isVipPlan } = usePlanAccess();
  const [showPostApplyModal, setShowPostApplyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');
  const upsellConfig = useJobUpsellConfig();

  // Fetch job details
  const { data: job, isLoading, error } = useJob(id);

  // Quota (unified credit system — single source of truth for apply access)
  const { data: quota } = usePrimeJobsQuota();
  const hasPlan = quota ? quota.monthlyLimit > 0 : false;
  const canApply = quota?.canApply ?? false;

  // Mutations
  const toggleBookmark = useToggleBookmark();
  const applyToJob = useApplyToJob();

  useEffect(() => {
    if (!job) return;
    logEvent({
      event_type: 'prime_jobs_job_view',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: {
        title: job.title,
        company: job.company_name
      }
    });
  }, [job, logEvent]);

  const handleBookmark = () => {
    if (!job) return;
    logEvent({
      event_type: 'prime_jobs_toggle_bookmark',
      entity_type: 'prime_job',
      entity_id: job.id,
      metadata: {
        currently_bookmarked: job.is_bookmarked || false,
        source: 'detail'
      }
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
      metadata: {
        has_plan: hasPlan,
        can_apply: canApply,
        remaining: quota?.remaining ?? null
      }
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
    const url = window.location.href;
    logEvent({
      event_type: 'prime_jobs_share',
      entity_type: 'prime_job',
      entity_id: job?.id || null,
      metadata: { url }
    });
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado!', {
        description: 'Compartilhe esta vaga com seus amigos.',
      });
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-20 bg-card rounded-lg border border-border">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Vaga não encontrada</h2>
            <p className="text-muted-foreground mb-6">Esta vaga não está mais disponível ou foi removida.</p>
            <Button onClick={() => navigate('/prime-jobs')}>
              Voltar para Prime Jobs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Format data
  const salaryDisplay = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen">
        {/* Header Section — Vuexy-style flex row with title + actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => navigate('/prime-jobs')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h5 className="text-base sm:text-lg font-semibold text-foreground mb-0 truncate max-w-[200px] sm:max-w-[350px] md:max-w-[500px]">
                {job.title}
              </h5>
              {job.is_applied && (
                <span className="bg-green-500/10 text-green-600 text-xs font-medium px-2.5 py-1 rounded">
                  Acessada
                </span>
              )}
              <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded">
                {JOB_TYPE_LABELS[job.job_type]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground ml-7">
              {job.company_name} &middot; {job.location} &middot; {getTimeAgo(job.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBookmark}
              disabled={toggleBookmark.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                job.is_bookmarked
                  ? 'border-red-200 text-red-500 bg-red-50 hover:bg-red-100'
                  : 'border-border text-muted-foreground hover:text-red-500 hover:bg-red-50 hover:border-red-200'
              )}
            >
              <Heart className="w-4 h-4" fill={job.is_bookmarked ? 'currentColor' : 'none'} />
              Salvar
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>
        </div>

        {/* FREE User Banner — Vuexy alert style */}
        {!canApply && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary p-2 rounded-lg">
                <Lock className="w-5 h-5" />
              </span>
              <div>
                <h6 className="font-semibold text-foreground mb-0">Oportunidade exclusiva Prime Jobs</h6>
                <p className="text-sm text-muted-foreground mb-0">Faça upgrade para ter acesso direto ao recrutador.</p>
              </div>
            </div>
            <button
              onClick={() => {
                logEvent({
                  event_type: 'prime_jobs_upgrade_click',
                  metadata: { plan_id: planId || null, source: 'job_banner' }
                });
                navigate('/pricing');
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-lg shrink-0 flex items-center gap-2 transition-colors text-sm"
            >
              Ver Planos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Two-Column Layout — Vuexy 8-4 ratio */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column — Main Content */}
          <div className="md:col-span-7 lg:col-span-8 space-y-6">

            {/* Job Header Card */}
            <div className="bg-card border border-border rounded-lg">
              <div className="p-5">
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded">
                    {REMOTE_TYPE_LABELS[job.remote_type]}
                  </span>
                  <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded">
                    {EXPERIENCE_LABELS[job.experience_level]}
                  </span>
                  {job.industry && (
                    <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded">
                      {job.industry}
                    </span>
                  )}
                  {salaryDisplay && (
                    <span className="bg-green-500/10 text-green-600 text-xs font-medium px-2.5 py-1 rounded">
                      <DollarSign className="w-3 h-3 inline mr-0.5" />
                      {salaryDisplay}
                    </span>
                  )}
                </div>

                {/* Company & Location row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-4 h-4" />
                    <span className="font-medium">{job.company_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeAgo(job.created_at)}</span>
                  </div>
                </div>

                {/* Salary Notes */}
                {job.salary_notes && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {job.salary_notes}
                  </p>
                )}

                {/* Tech Stack */}
                {job.tech_stack && job.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.tech_stack.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabs — Vuexy underline tab style */}
            <div className="bg-card border border-border rounded-lg">
              <div className="border-b border-border px-5">
                <nav className="flex gap-4 -mb-px">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={cn(
                      'py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                      activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    )}
                  >
                    Visão Geral
                  </button>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={cn(
                      'py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
                      activeTab === 'analysis'
                        ? 'border-purple-600 text-purple-700'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    )}
                  >
                    <Sparkles className="w-4 h-4 animate-pulse [animation-duration:2s] text-purple-500 [animation-name:sparkle-blink]" />
                    Análise ENP
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded">
                      AI
                    </span>
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-5 animate-fade-in" key={activeTab}>
                {activeTab === 'overview' ? (
                  <div className="space-y-6">
                    {/* Job Description */}
                    <div>
                      <h5 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        Sobre a Vaga
                      </h5>
                      <div className="prose max-w-none text-sm text-muted-foreground leading-relaxed">
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || '') }}
                        />
                      </div>
                    </div>

                    {job.requirements && (
                      <>
                        <hr className="border-border" />
                        <div>
                          <h5 className="text-base font-semibold text-foreground mb-4">Requisitos</h5>
                          <div className="prose max-w-none text-sm text-muted-foreground leading-relaxed">
                            <div
                              className="whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.requirements) }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {job.benefits && (
                      <>
                        <hr className="border-border" />
                        <div>
                          <h5 className="text-base font-semibold text-foreground mb-4">Benefícios</h5>
                          <div className="prose max-w-none text-sm text-muted-foreground leading-relaxed">
                            <div
                              className="whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.benefits) }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {job.ai_enrichment ? (
                      <JobAIInsights enrichment={job.ai_enrichment} />
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <h5 className="font-semibold text-foreground text-base mb-2">Análise em processamento</h5>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                          A análise de compatibilidade para esta vaga ainda está sendo gerada. Volte em breve para ver os insights personalizados.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats — Vuexy card grid below tabs */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-green-500/10 text-green-600 p-2 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0">Compensação</p>
                      <h6 className="font-semibold text-foreground mb-0">Em {job.salary_currency || 'USD'}</h6>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-0">
                    {salaryDisplay
                      ? `${salaryDisplay} — Pagamento mensal em ${job.salary_currency || 'USD'}. Valor competitivo para o mercado LATAM.`
                      : 'Pagamento mensal. Valor a combinar conforme experiência.'}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-primary/10 text-primary p-2 rounded-lg">
                      <Clock className="w-5 h-5" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-0">Modelo</p>
                      <h6 className="font-semibold text-foreground mb-0">{REMOTE_TYPE_LABELS[job.remote_type]}</h6>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-0">
                    {job.remote_type === 'fully_remote'
                      ? 'Trabalho 100% remoto. Necessário alinhamento com o fuso horário do cliente.'
                      : job.remote_type === 'hybrid'
                        ? 'Modelo híbrido. Pode exigir presença em escritório em alguns dias.'
                        : 'Trabalho presencial. Localização fixa necessária.'}
                  </p>
                </div>
              </div>
            )}

            {/* Upsell block — contextual services based on job gaps */}
            {activeTab === 'overview' && <JobUpsellBlock job={job} />}
          </div>

          {/* Right Column — Sidebar */}
          <aside className="md:col-span-5 lg:col-span-4 space-y-6 md:sticky md:top-8">
            {/* Action Card — Vuexy card style */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h5 className="text-sm font-semibold text-foreground mb-0">Vaga Ativa</h5>
                </div>
              </div>
              <div className="p-5">
                <h6 className="font-semibold text-foreground mb-2">
                  {job.is_applied
                    ? 'A porta está aberta — o próximo passo é seu.'
                    : 'Pronto para aplicar?'}
                </h6>
                <p className="text-sm text-muted-foreground mb-4">
                  {job.is_applied
                    ? 'Você já acessou o caminho para esta vaga. Agora é hora de agir — envie sua mensagem, candidate-se e se destaque.'
                    : 'Você tem o perfil para esta vaga. Acesse o link oficial e siga nossas dicas.'}
                </p>

                <div className="space-y-3">
                  {!hasPlan ? (
                    <button
                      onClick={() => {
                        logEvent({
                          event_type: 'prime_jobs_upgrade_click',
                          metadata: { plan_id: planId || null, source: 'apply_lock' }
                        });
                        navigate('/pricing');
                      }}
                      className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Lock className="w-4 h-4" /> Sem Créditos — Ver Planos
                    </button>
                  ) : job.is_applied ? (
                    <button
                      disabled
                      className="w-full py-2.5 border-2 border-green-500 bg-green-50 text-green-600 font-medium rounded-lg flex items-center justify-center gap-2 text-sm cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Acesso Liberado
                    </button>
                  ) : !canApply ? (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Lock className="w-4 h-4" /> Sem Créditos — Ver Planos
                    </button>
                  ) : (
                    <button
                      onClick={handleApply}
                      disabled={applyToJob.isPending}
                      className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      {applyToJob.isPending ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Acessar Vaga
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 pt-2">
                    <Users className="w-3 h-3" />
                    {job.is_applied
                      ? 'Você acessou — agora é com você'
                      : 'Link exclusivo · nunca exposto publicamente'}
                  </p>
                </div>

                {/* Quota Display */}
                {hasPlan && quota && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-muted-foreground">Créditos este mês</span>
                      <span className="font-semibold text-foreground">{quota.usedThisMonth}/{quota.monthlyLimit}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          quota.remaining <= 0 ? 'bg-amber-500' : quota.remaining <= 3 ? 'bg-amber-400' : 'bg-primary'
                        )}
                        style={{ width: `${Math.min(100, (quota.usedThisMonth / Math.max(1, quota.monthlyLimit)) * 100)}%` }}
                      />
                    </div>
                    {quota.remaining <= 3 && quota.remaining > 0 && (
                      <p className="text-xs text-amber-600 font-medium">
                        Restam apenas {quota.remaining} crédito(s) este mês
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resume Optimization Widget */}
            {job.ai_enrichment?.resume_pass_keywords && job.ai_enrichment.resume_pass_keywords.length > 0 && (
              <div className="bg-card border border-border rounded-lg">
                <div className="px-5 py-4 border-b border-border">
                  <h5 className="text-sm font-semibold text-foreground mb-0 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Otimize seu CV
                  </h5>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground mb-4">
                    Use estas palavras-chave para passar no filtro ATS:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.ai_enrichment.resume_pass_keywords.slice(0, 3).map((kw, i) => (
                      <span key={i} className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">
                        {kw}
                      </span>
                    ))}
                    {job.ai_enrichment.resume_pass_keywords.length > 3 && (
                      <span className="px-2.5 py-1 bg-secondary text-muted-foreground rounded text-xs font-medium">
                        +{job.ai_enrichment.resume_pass_keywords.length - 3}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/curriculo')}
                    className="w-full py-2.5 border-2 border-primary bg-primary/10 text-primary rounded-lg font-medium text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar CV Otimizado
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar upsell — fixed service configured by admin */}
            <JobSidebarUpsell />

            {/* Company Info — Vuexy card style */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-4 border-b border-border">
                <h5 className="text-sm font-semibold text-foreground mb-0">
                  Sobre {job.company_name}
                </h5>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between py-1.5">
                  <span className="text-xs text-muted-foreground">Categoria</span>
                  <span className="text-xs font-medium text-foreground">{job.category}</span>
                </div>
                {job.industry && (
                  <div className="flex justify-between py-1.5 border-t border-border">
                    <span className="text-xs text-muted-foreground">Indústria</span>
                    <span className="text-xs font-medium text-foreground">{job.industry}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-t border-border">
                  <span className="text-xs text-muted-foreground">Localização</span>
                  <span className="text-xs font-medium text-foreground">{job.location}</span>
                </div>
                <div className="flex justify-between py-1.5 border-t border-border">
                  <span className="text-xs text-muted-foreground">Publicado</span>
                  <span className="text-xs font-medium text-foreground">{getTimeAgo(job.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Mentorship Promo — Vuexy primary card */}
            <div
              onClick={() => navigate('/prime-jobs')}
              className="bg-primary border border-primary rounded-lg p-5 text-primary-foreground cursor-pointer transition-opacity hover:opacity-90"
            >
              <div className="flex items-center gap-2 text-xs font-medium opacity-80 mb-2">
                <Award className="w-4 h-4" /> Carreira
              </div>
              <h6 className="font-semibold mb-1">Quer ajuda para passar?</h6>
              <p className="text-sm opacity-80 mb-3">
                Mentoria em Grupo ROTA EUA™ com vagas abertas para a próxima turma.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                Saiba mais <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </aside>
        </div>

        {/* Post-apply upsell modal */}
        <JobPostApplyModal
          open={showPostApplyModal}
          onClose={() => setShowPostApplyModal(false)}
          jobTitle={job.title}
        />
      </div>
    </DashboardLayout>
  );
}
