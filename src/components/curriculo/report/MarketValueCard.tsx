import { DollarSign, TrendingUp, Info } from 'lucide-react';
import type { FullAnalysisResult } from '@/types/curriculo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MarketValueCardProps {
  data: FullAnalysisResult['market_value'];
}

export function MarketValueCard({ data }: MarketValueCardProps) {
  return (
    <TooltipProvider>
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          Valor de Mercado
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors">
              <Info className="w-4 h-4 text-gray-400" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-sm">
            <p>Estimativa de faixa salarial anual (USD) para o seu perfil no mercado americano, com base na sua experiência, área e localização típica para este cargo.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Salary Range */}
      <div className="text-center mb-4">
        <span className="text-2xl md:text-3xl font-extrabold text-gray-900">
          {data.range}
        </span>
      </div>

      {/* Context */}
      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
        <TrendingUp className="w-4 h-4" />
        <span className="font-medium">{data.context}</span>
      </div>
    </div>
    </TooltipProvider>
  );
}
