import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, Calendar, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/components/hub/PriceDisplay';
import { useDimensionService } from '@/hooks/useDimensionService';
import type { CareerInsights, HubDashboardConfig, HubService } from '@/types/hub';

interface SmartUpsellSectionProps {
  insights: CareerInsights | null;
  highlightedService: HubService | null;
  config: HubDashboardConfig;
}

function UpsellCard({
  service,
  headline,
  subtitle,
  socialProof,
  onBuy,
}: {
  service: HubService;
  headline: string;
  subtitle: string;
  socialProof: string | null;
  onBuy: () => void;
}) {
  return (
    <div className="relative bg-[#0F172A] rounded-md p-8 md:p-12 overflow-hidden shadow-2xl shadow-indigo-900/20 group">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3 group-hover:opacity-30 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
        <div className="lg:col-span-3 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-indigo-200 rounded-full border border-white/10 backdrop-blur-md">
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Recomendado para você</span>
          </div>

          <div>
            <p className="text-sm text-indigo-300 mb-1">{headline}</p>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
              {service.name}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
              {subtitle}
            </p>
          </div>

          {socialProof && (
            <p className="text-sm text-gray-400 italic border-l-2 border-indigo-500/40 pl-3">
              {socialProof}
            </p>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-md p-8 text-center hover:bg-white/10 transition-colors">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {service.product_type === 'one_time' ? 'Investimento Único' : 'Investimento'}
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {service.anchor_price && service.anchor_price > service.price && service.price > 0 && (
                <span className="text-lg text-gray-500 line-through">
                  R$ {Math.floor(service.anchor_price)}
                </span>
              )}
              <span className="text-sm font-medium text-gray-400 mt-2">R$</span>
              <span className="text-5xl font-black text-white">
                {service.price_display || Math.floor(service.price)}
              </span>
              {service.anchor_price && service.anchor_price > service.price && service.price > 0 && (
                <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-bold px-3 py-1 rounded-full">
                  {Math.round((1 - service.price / service.anchor_price) * 100)}% OFF
                </span>
              )}
            </div>

            <button
              onClick={onBuy}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2"
            >
              {service.cta_text || 'Agendar Sessão'} <Calendar size={18} />
            </button>

            <div className="flex items-start gap-2 text-left bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-emerald-200 leading-tight">
                <strong className="text-emerald-400 block mb-0.5">Risco Zero (Cashback)</strong>
                100% do valor vira crédito se você entrar na Mentoria em até 7 dias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SmartUpsellSection({ insights, highlightedService, config }: SmartUpsellSectionProps) {
  const navigate = useNavigate();
  const weakestKey = insights?.weakest?.key;
  const { data: dimensionService } = useDimensionService(weakestKey);

  // Determine which service to show
  const service = dimensionService || highlightedService;
  if (!service) return null;

  const handleBuy = () => {
    if (service.landing_page_url) {
      if (service.landing_page_url.startsWith('/') || service.landing_page_url.startsWith(window.location.origin)) {
        const path = service.landing_page_url.startsWith('/') ? service.landing_page_url : new URL(service.landing_page_url).pathname;
        navigate(path);
      } else {
        window.open(service.landing_page_url, '_blank');
      }
    } else if (service.ticto_checkout_url) {
      window.open(service.ticto_checkout_url, '_blank');
    }
  };

  // Personalized copy if we have dimension data
  const isPersonalized = !!dimensionService && !!insights?.weakest;
  const headline = isPersonalized
    ? `Seu ${insights!.weakest!.label} pontuou ${insights!.weakest!.score}/${insights!.weakest!.maxScore}`
    : '';
  const subtitle = service.description ?? '';
  const socialProof = isPersonalized
    ? config.social_proof.dimension_cta[weakestKey as keyof typeof config.social_proof.dimension_cta] ?? null
    : config.social_proof.general_upsell;

  return (
    <div>
      <UpsellCard
        service={service}
        headline={headline}
        subtitle={subtitle}
        socialProof={socialProof}
        onBuy={handleBuy}
      />
    </div>
  );
}
