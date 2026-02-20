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
    <Card className="rounded-2xl border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-2xl opacity-40 -mr-12 -mt-12 pointer-events-none" />

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
        aria-label="Dispensar sugestão"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 pt-0.5">
          {/* Microcopy */}
          <p className="text-sm font-medium text-gray-700 leading-snug">
            {data.microcopy}
          </p>

          {/* Service info */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-700">
                {data.serviceName}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs font-medium text-gray-600">
                {data.servicePrice}
              </span>
            </div>

            <Button
              size="sm"
              onClick={handleClick}
              className={cn(
                "rounded-xl gap-1.5 text-xs h-7 px-3",
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
            <div className="text-[10px] text-indigo-600/60 font-medium">
              Alta relevância
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
