import { ArrowRight, Sparkles, Clock, Lock, CalendarCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { ReportShareBlock } from './ReportShareBlock';
import type { V2ProductRecommendation } from '@/types/leads';

interface LlmRecommendation {
  productName?: string;
  description?: string;
  landingPageUrl?: string;
}

interface V2CTAFinalProps {
  userName: string;
  recommendation?: V2ProductRecommendation | null;
  llmRecommendation?: LlmRecommendation;
  isLimited?: boolean;
  referralCode?: string;
  referralCount?: number;
  referralUnlocked?: boolean;
}

export function V2CTAFinal({ userName, recommendation, llmRecommendation, isLimited = false, referralCode, referralCount = 0, referralUnlocked = false }: V2CTAFinalProps) {
  const { logEvent } = useAnalytics();
  const navigate = useNavigate();
  const firstName = userName.split(' ')[0];
  const [consultoriaUrl, setConsultoriaUrl] = useState('');

  useEffect(() => {
    if (!isLimited) return;
    supabase
      .from('app_configs')
      .select('value')
      .eq('key', 'report_cta_consultoria_url')
      .single()
      .then(({ data }) => {
        if (data?.value) setConsultoriaUrl(data.value);
      });
  }, [isLimited]);
  const primary = recommendation?.primary_offer;

  // LLM recommendation takes priority when available
  const hasLlmRec = llmRecommendation?.productName;
  const productName = hasLlmRec ? llmRecommendation.productName : primary?.recommended_product_name || 'Hub Gratuito';
  const ctaText = hasLlmRec
    ? `Conhecer ${llmRecommendation.productName}`
    : primary?.cta || 'Acessar o Hub Gratuito';
  const ctaUrl = hasLlmRec
    ? llmRecommendation.landingPageUrl || primary?.recommended_product_url || 'https://hub.euanapratica.com'
    : primary?.recommended_product_url || 'https://hub.euanapratica.com';
  const description = hasLlmRec && llmRecommendation.description
    ? llmRecommendation.description
    : primary?.why_this_fits || 'Acesse o Hub gratuito e comece sua preparação hoje. Materiais, comunidade e suporte — tudo que você precisa para dar o primeiro passo.';

  // Limited mode: dual CTA (consultoria + assinatura)
  if (isLimited) {
    return (
      <div className="space-y-4 sm:space-y-6 print:hidden">
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 text-white shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px]" />

          <div className="relative z-10 p-6 sm:p-8 md:p-12 flex flex-col items-center text-center space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center space-x-2 bg-violet-500/10 border border-violet-500/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-violet-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Relatório Completo Disponível</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight px-4 sm:px-0">
                Seu plano de ação está pronto,{' '}
                <span className="text-violet-400">{firstName}.</span>
              </h2>

              <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed px-4 sm:px-0">
                Identificamos seus bloqueadores e criamos um plano personalizado. Para transformar esse diagnóstico em resultados, escolha como avançar:
              </p>
            </div>

            {/* Dual CTA */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              {/* Consultoria */}
              <div className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-5 flex flex-col gap-4 text-left">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Quero ajuda profissional</span>
                  </div>
                  <h3 className="font-bold text-base text-white">Sessão de diagnóstico</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    45 min com especialista para revisar seu diagnóstico e criar um plano de ação sob medida.
                  </p>
                </div>
                <button
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => {
                    logEvent({
                      event_type: 'cta_click',
                      entity_type: 'consulting',
                      metadata: { placement: 'report_v2_limited_dual_cta', cta: 'consultoria' },
                    });
                    window.open(consultoriaUrl || 'https://hub.euanapratica.com', '_blank');
                  }}
                >
                  Agendar sessão
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Assinatura */}
              <div className="bg-white/5 border border-violet-500/30 rounded-xl sm:rounded-2xl p-5 flex flex-col gap-4 text-left relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">Recomendado</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Quero o relatório completo</span>
                  </div>
                  <h3 className="font-bold text-base text-white">Assinar o Hub</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Acesse o relatório completo com plano de ação, checkpoints e recomendações detalhadas por dimensão.
                  </p>
                </div>
                <button
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
                  onClick={() => {
                    logEvent({
                      event_type: 'cta_click',
                      entity_type: 'subscription',
                      metadata: { placement: 'report_v2_limited_dual_cta', cta: 'assinatura' },
                    });
                    navigate('/pricing');
                  }}
                >
                  Ver planos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Share Block */}
        {referralCode && (
          <ReportShareBlock
            referralCode={referralCode}
            referralCount={referralCount}
            isUnlocked={referralUnlocked}
            userName={userName}
            isLimited={true}
          />
        )}

        {/* Explorer invite */}
        <div className="rounded-xl sm:rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:p-6 md:p-8 text-center space-y-2 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            Programa Explorer
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground px-4 sm:px-0">
            Faça parte do grupo Explorer
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed px-2 sm:px-0">
            Nossa plataforma está em estágio experimental e estamos buscando pessoas como você para
            nos ajudar a validar a experiência. Explorers recebem acesso antecipado a novas funcionalidades,
            suporte prioritário e benefícios exclusivos por contribuírem com feedback.
          </p>
          <button
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-primary/30 bg-background hover:bg-primary/5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-[1.02] mt-2 sm:mt-0"
            onClick={() => {
              logEvent({
                event_type: 'cta_click',
                entity_type: 'explorer_program',
                metadata: { placement: 'report_v2_explorer_invite' },
              });
              window.open('https://hub.euanapratica.com', '_blank');
            }}
          >
            Quero ser Explorer
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Full access: original product CTA
  return (
    <div className="space-y-4 sm:space-y-6 print:hidden">
      {/* Main CTA banner - Premium design matching reference */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-900 text-white shadow-2xl transition-all duration-300">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]" />

        <div className="relative z-10 p-6 sm:p-8 md:p-12 flex flex-col items-center text-center space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-blue-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span>Ação Recomendada</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight px-4 sm:px-0">
              O próximo passo é seu, <span className="text-blue-400">{firstName}.</span>
            </h2>

            <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed px-4 sm:px-0">
              Com base no seu diagnóstico, recomendo{' '}
              <span className="text-white font-medium">{productName}</span>.{' '}
              {description}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl w-full max-w-xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="text-center md:text-left flex-1 w-full">
                <h3 className="text-blue-400 font-semibold text-xs sm:text-sm uppercase mb-1">
                  Especialmente para você:
                </h3>
                <p className="text-base sm:text-lg font-bold break-words">{productName}</p>
                {hasLlmRec && (
                  <div className="flex items-center justify-center md:justify-start text-slate-400 text-xs sm:text-sm mt-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span>Consultoria estratégica personalizada</span>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 px-3 sm:px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 font-bold text-xs sm:text-sm uppercase tracking-wider">Disponível</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col items-center space-y-3 sm:space-y-4 px-4 sm:px-0">
            <button
              className="group relative w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 sm:space-x-3"
              onClick={() => {
                logEvent({
                  event_type: 'cta_click',
                  entity_type: 'hub_service',
                  metadata: {
                    cta_text: ctaText,
                    placement: 'report_v2_final_cta',
                    url: ctaUrl,
                  },
                });
                window.open(ctaUrl, '_blank');
              }}
            >
              <span className="truncate">{ctaText}</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 flex-shrink-0" />
            </button>

            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Acesse agora:{' '}
              <a
                href={ctaUrl}
                className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4 break-all sm:break-normal"
                target="_blank"
                rel="noopener noreferrer"
              >
                {ctaUrl.replace(/^https?:\/\//, '')}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Referral Share Block (compact for full-access users) */}
      {referralCode && (
        <ReportShareBlock
          referralCode={referralCode}
          referralCount={referralCount}
          isUnlocked={referralUnlocked}
          userName={userName}
          isLimited={false}
        />
      )}

      {/* Explorer invite */}
      <div className="rounded-xl sm:rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 sm:p-6 md:p-8 text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          Programa Explorer
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground px-4 sm:px-0">
          Faça parte do grupo Explorer
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed px-2 sm:px-0">
          Nossa plataforma está em estágio experimental e estamos buscando pessoas como você para
          nos ajudar a validar a experiência. Explorers recebem acesso antecipado a novas funcionalidades,
          suporte prioritário e benefícios exclusivos por contribuírem com feedback.
        </p>
        <button
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-primary/30 bg-background hover:bg-primary/5 text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-[1.02] mt-2 sm:mt-0"
          onClick={() => {
            logEvent({
              event_type: 'cta_click',
              entity_type: 'explorer_program',
              metadata: { placement: 'report_v2_explorer_invite' },
            });
            window.open('https://hub.euanapratica.com', '_blank');
          }}
        >
          Quero ser Explorer
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
