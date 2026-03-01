import { useState } from 'react';
import { Sparkles, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UpsellCardData } from '@/types/upsell';
import { useUpsellTracking } from '@/hooks/useUpsellTracking';
import { cn } from '@/lib/utils';

interface UpsellCardProps {
  data: UpsellCardData;
  onDismiss?: () => void;
}

export function UpsellCard({ data, onDismiss }: UpsellCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const { markClick, markDismiss } = useUpsellTracking();

  const handleClick = () => {
    markClick.mutate(data.impressionId);

    const url = data.landingPageUrl || data.checkoutUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    markDismiss.mutate(data.impressionId, {
      onSuccess: () => {
        onDismiss?.();
      },
    });
  };

  if (dismissed) return null;

  return (
    <Card className="rounded-xl border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 p-3 sm:p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-full blur-2xl opacity-40 -mr-12 -mt-12 pointer-events-none" />

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 p-1 sm:p-1.5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
        aria-label="Dispensar sugestão"
      >
        <X className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
      </button>

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2 pt-0.5 pr-4">
          {/* Microcopy */}
          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">
            {data.microcopy}
          </p>

          {/* Service info — stacked on mobile, inline on wider */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                {data.serviceName}
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                {data.servicePrice}
              </span>
            </div>

            <Button
              size="sm"
              onClick={handleClick}
              className={cn(
                "rounded-lg gap-1.5 text-xs h-7 px-3 w-full sm:w-auto",
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "hover:from-indigo-700 hover:to-purple-700",
                "shadow-sm"
              )}
            >
              Ver Detalhes
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          {/* Confidence indicator (subtle) */}
          {data.confidence >= 0.9 && (
            <div className="text-[10px] text-indigo-600/60 dark:text-indigo-400/60 font-medium">
              Alta relevância
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
