import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { getBarColor } from '@/components/report/v2/scoring';
import { useDimensionService } from '@/hooks/useDimensionService';
import type { CareerInsights, HubDashboardConfig } from '@/types/hub';

interface CareerDimensionsSectionProps {
  insights: CareerInsights;
  config: HubDashboardConfig;
}

export function CareerDimensionsSection({ insights, config }: CareerDimensionsSectionProps) {
  const navigate = useNavigate();
  const { data: weakestService } = useDimensionService(insights.weakest?.key);

  if (!insights.hasReport || insights.dimensions.length === 0) return null;

  // Show top 6 dimensions (sorted weakest-first from the hook)
  const displayed = insights.dimensions.slice(0, 6);
  const socialProofText = insights.weakest?.key
    ? config.social_proof.dimension_cta[insights.weakest.key as keyof typeof config.social_proof.dimension_cta]
    : null;

  const handleServiceClick = () => {
    if (!weakestService) return;
    if (weakestService.landing_page_url) {
      if (weakestService.landing_page_url.startsWith('/')) {
        navigate(weakestService.landing_page_url);
      } else {
        window.open(weakestService.landing_page_url, '_blank');
      }
    } else if (weakestService.ticto_checkout_url) {
      window.open(weakestService.ticto_checkout_url, '_blank');
    } else if (weakestService.route) {
      navigate(weakestService.route);
    }
  };

  return (
    <div className="bg-card rounded-md shadow-md p-6">
      {/* Header with big score */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-foreground">Suas Dimensões</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">Do seu diagnóstico de carreira</p>
        </div>
        <div className="text-right">
          <p className="text-[38px] font-medium leading-none text-foreground">{insights.score}</p>
          <div className="flex items-center gap-1 mt-1 justify-end">
            <TrendingUp size={12} className="text-[#28c76f]" />
            <span className="text-xs font-medium text-[#28c76f]">/ 100</span>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3.5">
        {displayed.map((dim, i) => {
          const isWeakest = dim.key === insights.weakest?.key;
          const isStrongest = dim.key === insights.strongest?.key;
          const barColor = getBarColor(dim.percent);

          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] font-medium text-foreground truncate">{dim.label}</span>
                  {isWeakest && (
                    <span className="vuexy-badge-danger text-[10px] gap-1">
                      <AlertTriangle size={10} /> Gap
                    </span>
                  )}
                  {isStrongest && (
                    <CheckCircle2 size={14} className="text-[#28c76f] flex-shrink-0" />
                  )}
                </div>
                <span className="text-[13px] font-medium text-muted-foreground tabular-nums shrink-0">
                  {dim.score}/{dim.maxScore}
                </span>
              </div>
              <div className="h-[6px] rounded-sm bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-sm ${barColor} transition-all ease-out`}
                  style={{ width: `${dim.percent}%`, transitionDuration: '800ms', transitionDelay: `${i * 60}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Social proof + CTA */}
      {(socialProofText || weakestService) && (
        <div className="mt-6 pt-5 border-t border-border/30">
          {socialProofText && (
            <p className="text-[13px] text-muted-foreground italic mb-3">{socialProofText}</p>
          )}
          {weakestService && (
            <button
              onClick={handleServiceClick}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#7367f0] hover:text-[#7367f0]/80 hover:gap-3 transition-all"
            >
              Melhorar {insights.weakest?.label} <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
