import { DollarSign, TrendingUp } from 'lucide-react';
import type { FullAnalysisResult } from '@/types/curriculo';

interface MarketValueCardProps {
  data: FullAnalysisResult['market_value'];
}

export function MarketValueCard({ data }: MarketValueCardProps) {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          Valor de Mercado
        </h3>
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
  );
}
