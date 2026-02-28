import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Heart,
  Share2,
  ArrowRight,
  Lock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
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

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logEvent } = useAnalytics();
  const { planId, isPremiumPlan, isVipPlan } = usePlanAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPostApplyModal, setShowPostApplyModal] = useState(false);
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

    if (!hasPlan) {
      setShowUpgradeModal(true);
      return;
    }

    if (!canApply) {
      toast.error('Limite de acessos atingido', {
        description: `Você já acessou suas ${quota?.monthlyLimit || 0} oportunidades este mês. Faça upgrade para continuar.`,
      });
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
        <div className="max-w-5xl mx-auto p-6 space-y-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 rounded-[48px]" />
          <Skeleton className="h-96 rounded-[40px]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto p-6">
          <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vaga não encontrada</h2>
            <p className="text-gray-500 mb-6">Esta vaga não está mais disponível ou foi removida.</p>
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
  const companyInitials = job.company_name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => navigate('/prime-jobs')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm mb-10 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para Prime Jobs
        </button>

        {/* FREE User Banner */}
        {!canApply && (
          <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Oportunidade exclusiva Prime Jobs</h3>
                <p className="text-sm text-amber-700">Algumas dessas vagas não existem em nenhum outro lugar — faça upgrade para ter acesso direto ao recrutador.</p>
              </div>
            </div>
            <Button
              onClick={() => {
                logEvent({
                  event_type: 'prime_jobs_upgrade_click',
                  metadata: { plan_id: planId || null, source: 'job_banner' }
                });
                setShowUpgradeModal(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              Ver Planos <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Header Card */}
            <div className="bg-white rounded-[48px] p-10 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 opacity-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                <div className="flex gap-6 items-start">
                  <div className="w-20 h-20 rounded-3xl bg-brand-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-600/20 overflow-hidden">
                    {job.company_logo_url ? (
                      <img src={job.company_logo_url} alt={job.company_name} className="w-full h-full object-cover" />
                    ) : (
                      companyInitials
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                      {job.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Briefcase size={16} /> {job.company_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={16} /> {job.location}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBookmark}
                    disabled={toggleBookmark.isPending}
                    className={`p-2.5 rounded-xl transition-all ${
                      job.is_bookmarked
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart size={18} fill={job.is_bookmarked ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2.5 bg-gray-100 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3 mt-10">
                <span className="px-4 py-2 bg-brand-50 text-brand-700 font-bold text-xs rounded-xl border border-brand-100">
                  {JOB_TYPE_LABELS[job.job_type]}
                </span>
                <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100">
                  {REMOTE_TYPE_LABELS[job.remote_type]}
                </span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-100">
                  {EXPERIENCE_LABELS[job.experience_level]}
                </span>
                {salaryDisplay && (
                  <span className="px-4 py-2 bg-green-50 text-green-700 font-bold text-xs rounded-xl border border-green-100">
                    {salaryDisplay}
                  </span>
                )}
                {job.industry && (
                  <span className="px-4 py-2 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl border border-gray-100">
                    {job.industry}
                  </span>
                )}
              </div>

              {/* Salary Notes */}
              {job.salary_notes && (
                <p className="text-sm text-gray-500 font-medium mt-4">
                  {job.salary_notes}
                </p>
              )}

              {/* Tech Stack */}
              {job.tech_stack && job.tech_stack.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {job.tech_stack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-[40px] p-10 md:p-12 border border-gray-100 shadow-sm space-y-8">
              <div className="prose prose-blue max-w-none">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Sobre a Vaga</h2>
                <div
                  className="text-gray-600 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description || '') }}
                />

                {job.requirements && (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mt-10 mb-6">Requisitos</h3>
                    <div
                      className="text-gray-600 leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.requirements) }}
                    />
                  </>
                )}

                {job.benefits && (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mt-10 mb-6">Benefícios</h3>
                    <div
                      className="text-gray-600 leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.benefits) }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* AI Insights for Brazilian Professionals */}
            {job.ai_enrichment && (
              <JobAIInsights enrichment={job.ai_enrichment} />
            )}

            {/* Upsell block — contextual services based on job gaps */}
            <JobUpsellBlock job={job} />
          </div>

          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            {/* Access CTA Box */}
            <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl">
              <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-3">Acesso Prime</p>
              <h3 className="text-xl font-black mb-3 leading-snug">
                {job.is_applied
                  ? 'A porta está aberta — o próximo passo é seu.'
                  : 'Vaga garimpada. Acesso direto.'}
              </h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                {job.is_applied
                  ? 'Você já acessou o caminho para esta vaga. Agora é hora de agir — envie sua mensagem, candidate-se e se destaque.'
                  : 'Esta vaga pode não estar publicada em nenhum outro lugar. Você recebe o link direto — seja para a página da empresa ou para o perfil do recrutador responsável.'}
              </p>

              <div className="space-y-4">
                {!hasPlan ? (
                  <button
                    onClick={() => {
                      logEvent({
                        event_type: 'prime_jobs_upgrade_click',
                        metadata: { plan_id: planId || null, source: 'apply_lock' }
                      });
                      setShowUpgradeModal(true);
                    }}
                    className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xl"
                  >
                    <Lock size={18} /> Desbloquear Acesso
                  </button>
                ) : job.is_applied ? (
                  <button
                    disabled
                    className="w-full py-5 bg-green-600/20 border border-green-500/30 text-green-400 font-black rounded-2xl flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Acesso Liberado
                  </button>
                ) : !canApply ? (
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                    Limite do Mês Atingido — Upgrade
                  </button>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applyToJob.isPending}
                    className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {applyToJob.isPending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        Acessar Oportunidade <ExternalLink size={18} />
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {job.is_applied
                    ? 'Você acessou — agora é com você'
                    : 'Link exclusivo · nunca exposto publicamente'}
                </p>
              </div>

              {/* Quota Display */}
              {hasPlan && quota && (
                <div className="mt-10 pt-8 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-widest">Acessos este mês</span>
                    <span className="font-black">{quota.usedThisMonth}/{quota.monthlyLimit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quota.remaining <= 0 ? 'bg-amber-500' : quota.remaining <= 3 ? 'bg-amber-400' : 'bg-brand-500'
                      }`}
                      style={{ width: `${Math.min(100, (quota.usedThisMonth / Math.max(1, quota.monthlyLimit)) * 100)}%` }}
                    />
                  </div>
                  {quota.remaining <= 3 && quota.remaining > 0 && (
                    <p className="text-xs text-amber-400 font-bold">
                      Restam apenas {quota.remaining} acesso(s) este mês
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar upsell — fixed service configured by admin */}
            <JobSidebarUpsell />

            {/* Company Info */}
            <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">
                Sobre {job.company_name}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Categoria</span>
                  <span className="text-xs font-black text-gray-900">{job.category}</span>
                </div>
                {job.industry && (
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Indústria</span>
                    <span className="text-xs font-black text-gray-900">{job.industry}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Localização</span>
                  <span className="text-xs font-black text-gray-900">{job.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Publicado</span>
                  <span className="text-xs font-black text-gray-900">{getTimeAgo(job.created_at)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          currentPlanId={planId}
          reason="upgrade"
        />

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
