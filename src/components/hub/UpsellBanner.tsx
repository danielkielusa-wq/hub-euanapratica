import { Sparkles, CheckCircle2, Calendar, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { HubService } from '@/types/hub';

interface UpsellBannerProps {
  service: HubService | null;
  isLoading?: boolean;
}

export function UpsellBanner({ service, isLoading }: UpsellBannerProps) {
  const handleBuy = () => {
    if (service?.ticto_checkout_url) {
      window.open(service.ticto_checkout_url, '_blank');
    } else if (service?.redirect_url) {
      window.open(service.redirect_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="mb-16">
        <Skeleton className="h-80 rounded-[40px]" />
      </div>
    );
  }

  if (!service) return null;

  const price = service.price_display || (service.price ? `R$ ${service.price}` : 'Consultar');

  return (
    <div className="mb-16">
      <div className="relative bg-slate-900 rounded-[40px] p-8 md:p-12 overflow-hidden shadow-2xl group">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3 group-hover:opacity-30 transition-opacity" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-3 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-primary/80 rounded-full border border-white/10 backdrop-blur-md">
              <Sparkles size={14} className="text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Recomendado para você</span>
            </div>
            
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
                {service.name}
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                {service.description}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Análise de perfil e elegibilidade de visto</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Definição de cargos-alvo e pretensão salarial</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <CheckCircle2 size={18} className="text-green-500" />
                <span>Estratégia de LinkedIn e Networking</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center hover:bg-white/10 transition-colors">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Investimento Único</p>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-5xl font-black text-white">{price}</span>
              </div>
              
              <button 
                onClick={handleBuy}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2"
              >
                {service.cta_text || 'Agendar Sessão'} <Calendar size={18} />
              </button>

              {service.ribbon && (
                <div className="flex items-start gap-2 text-left bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-200 leading-tight">
                    <strong className="text-emerald-400 block mb-0.5">Risco Zero (Cashback)</strong>
                    100% do valor vira crédito se você entrar na Mentoria em até 7 dias.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
