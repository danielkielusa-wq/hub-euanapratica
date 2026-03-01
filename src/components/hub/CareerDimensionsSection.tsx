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
    <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6">
      {/* Header with big score */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-foreground">Suas Dimensões</h2>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mt-0.5">Do seu diagnóstico de carreira</p>
        </div>
        <div className="text-right">
          <p className="text-[38px] font-bold leading-none text-gray-800 dark:text-foreground">{insights.score}</p>
          <div className="flex items-center gap-1 mt-1 justify-end">
            <TrendingUp size={12} className="text-green-500" />
            <span className="text-xs font-bold text-green-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-4">
        {displayed.map((dim, i) => {
          const isWeakest = dim.key === insights.weakest?.key;
          const isStrongest = dim.key === insights.strongest?.key;
          const barColor = getBarColor(dim.percent);

          return (
            <div key={dim.key}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-gray-700 dark:text-foreground truncate">{dim.label}</span>
                  {isWeakest && (
                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={10} /> Gap
                    </span>
                  )}
                  {isStrongest && (
                    <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
                <span className="text-sm font-bold text-gray-600 dark:text-muted-foreground tabular-nums shrink-0">
                  {dim.percent}%
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all ease-out`}
                  style={{ width: `${dim.percent}%`, transitionDuration: '800ms', transitionDelay: `${i * 60}ms` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Social proof + CTA */}
      {(socialProofText || weakestService) && (
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10">
          {socialProofText && (
            <p className="text-sm text-gray-500 dark:text-muted-foreground italic mb-3">{socialProofText}</p>
          )}
          {weakestService && (
            <button
              onClick={handleServiceClick}
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline group"
            >
              Melhorar {insights.weakest?.label} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
