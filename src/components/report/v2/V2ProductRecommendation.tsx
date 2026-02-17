import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles, ArrowRight, FileText } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { V2ProductRecommendation as V2ProductRecommendationType } from '@/types/leads';

interface V2ProductRecommendationProps {
  recommendation: V2ProductRecommendationType;
}

export function V2ProductRecommendation({ recommendation }: V2ProductRecommendationProps) {
  const { logEvent } = useAnalytics();
  const primary = recommendation.primary_offer;
  const secondary = recommendation.secondary_offer;

  return (
    <section className="bg-muted/30 rounded-[40px] p-8 md:p-10 border print:hidden">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-primary text-primary-foreground rounded-xl">
          <Zap size={22} className="fill-current" />
        </div>
        <h3 className="text-2xl font-black tracking-tight text-foreground">
          Proximos Passos Estrategicos
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Offer */}
        <div className="lg:col-span-2 bg-foreground dark:bg-slate-800 text-background rounded-[32px] p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-30 -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={12} className="fill-current" /> Recomendacao Para Voce
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-background/10 rounded-2xl border border-background/10">
                <FileText size={24} className="text-primary/80" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-background/50 mb-1">
                  {primary.recommended_product_tier}
                </p>
                <h4 className="text-xl font-black mb-1">{primary.recommended_product_name}</h4>
                <p className="text-background/60 text-sm">{primary.why_this_fits}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {primary.recommended_product_price && (
                <Badge variant="secondary" className="text-sm">{primary.recommended_product_price}</Badge>
              )}
              {primary.fit_score > 0 && (
                <span className="text-xs text-background/50">
                  Fit: {primary.fit_score}%
                </span>
              )}
            </div>

            <Button
              className="w-full bg-background text-foreground hover:bg-background/90 font-black py-6 rounded-2xl mt-2 group"
              onClick={() => {
                logEvent({
                  event_type: 'cta_click',
                  entity_type: 'hub_service',
                  metadata: {
                    cta_text: primary.cta,
                    placement: 'report_v2_primary',
                    url: primary.recommended_product_url || null
                  }
                });
                if (primary.recommended_product_url) {
                  window.open(primary.recommended_product_url, '_blank');
                }
              }}
            >
              {primary.cta || 'Garantir Minha Vaga'}
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Secondary Offer */}
        {secondary && (
          <div className="rounded-[32px] p-6 border bg-card flex flex-col justify-between">
            <div>
              <Badge variant="secondary" className="text-[9px] uppercase mb-3">
                Alternativa
              </Badge>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                {secondary.secondary_product_tier}
              </p>
              <h4 className="font-bold text-sm mb-2 text-foreground">
                {secondary.secondary_product_name}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {secondary.why_alternative}
              </p>
              {secondary.secondary_fit_score > 0 && (
                <p className="text-xs text-muted-foreground mb-4">
                  Fit: {secondary.secondary_fit_score}%
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full rounded-xl text-xs font-bold"
              onClick={() => {
                logEvent({
                  event_type: 'cta_click',
                  entity_type: 'hub_service',
                  metadata: {
                    cta_text: 'Saiba mais',
                    placement: 'report_v2_secondary',
                    product_name: secondary.secondary_product_name
                  }
                });
              }}
            >
              Saiba mais
            </Button>
          </div>
        )}
      </div>

      {/* Financial fit note */}
      {recommendation.financial_fit && !recommendation.financial_fit.has_budget && recommendation.financial_fit.budget_gap && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          {recommendation.financial_fit.budget_gap}
        </p>
      )}

      <p className="text-center text-xs text-muted-foreground mt-8 font-medium">
        Todos os servicos contam com garantia de satisfacao de 7 dias.
      </p>
    </section>
  );
}
