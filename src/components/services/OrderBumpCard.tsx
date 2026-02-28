import { useState } from 'react';
import { Gift, CheckCircle2 } from 'lucide-react';
import { PriceDisplay } from '@/components/hub/PriceDisplay';
import type { HubService } from '@/types/hub';
import { cn } from '@/lib/utils';

interface OrderBumpCardProps {
  bumpService: HubService;
  onToggle: (checked: boolean) => void;
  checked: boolean;
}

export function OrderBumpCard({ bumpService, onToggle, checked }: OrderBumpCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 p-5 cursor-pointer transition-all",
        checked
          ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"
          : "border-dashed border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50"
      )}
      onClick={() => onToggle(!checked)}
    >
      {/* Ribbon */}
      <div className="absolute -top-3 left-4 px-3 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
        <Gift className="inline h-3 w-3 mr-1 -mt-0.5" />
        Oferta Especial
      </div>

      <div className="flex items-start gap-4 mt-1">
        {/* Checkbox */}
        <div className={cn(
          "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
          checked
            ? "bg-indigo-600 border-indigo-600"
            : "border-gray-300 bg-white"
        )}>
          {checked && <CheckCircle2 className="h-4 w-4 text-white" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm mb-1">
            Adicione: {bumpService.name}
          </p>
          {bumpService.description && (
            <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">
              {bumpService.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <PriceDisplay
              price={bumpService.price}
              currency={bumpService.currency}
              priceDisplay={bumpService.price_display}
              anchorPrice={bumpService.anchor_price}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
