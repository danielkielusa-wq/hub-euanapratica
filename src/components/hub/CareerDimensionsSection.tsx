import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-black text-gray-900">Suas Dimensões</h2>
        <span className="text-xs text-gray-400 font-medium">— do seu diagnóstico de carreira</span>
      </div>

      <Card className="rounded-[24px] shadow-sm border-gray-100">
        <CardContent className="p-5 md:p-8">
          <div className="space-y-4">
            {displayed.map((dim, i) => {
              const isWeakest = dim.key === insights.weakest?.key;
              const isStrongest = dim.key === insights.strongest?.key;
              const barColor = getBarColor(dim.percent);

              return (
                <div key={dim.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-700 truncate">{dim.label}</span>
                      {isWeakest && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          <AlertTriangle size={10} /> Maior Gap
                        </span>
                      )}
                      {isStrongest && (
                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 tabular-nums shrink-0">
                      {dim.score}/{dim.maxScore}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
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
            <div className="mt-6 pt-5 border-t border-gray-100">
              {socialProofText && (
                <p className="text-sm text-gray-500 italic mb-3">{socialProofText}</p>
              )}
              {weakestService && (
                <button
                  onClick={handleServiceClick}
                  className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:gap-3 transition-all"
                >
                  Melhorar {insights.weakest?.label} <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
