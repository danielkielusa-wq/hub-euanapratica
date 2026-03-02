import { Globe, ArrowRight, Info } from 'lucide-react';
import type { FullAnalysisResult } from '@/types/curriculo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CulturalBridgeCardProps {
  data: FullAnalysisResult['cultural_bridge'];
}

export function CulturalBridgeCard({ data }: CulturalBridgeCardProps) {
  return (
    <TooltipProvider>
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          Cultural Bridge
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors">
              <Info className="w-4 h-4 text-gray-400" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-sm">
            <p>Traduz seu cargo brasileiro para o equivalente americano. Títulos diferentes podem significar a mesma função — usar o termo certo aumenta sua visibilidade para recrutadores dos EUA.</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Title Comparison - Clean design without flags */}
      <div className="flex items-center gap-3 mb-4">
        {/* Original Title */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <span 
              className="text-sm font-semibold text-gray-700 block break-words leading-tight text-center"
              style={{ hyphens: 'auto' }}
            >
              {data.brazil_title}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />

        {/* US Equivalent Title */}
        <div className="flex-1 min-w-0">
          <div className="bg-primary/10 rounded-xl px-4 py-3">
            <span 
              className="text-sm font-semibold text-primary block break-words leading-tight text-center"
              style={{ hyphens: 'auto' }}
            >
              {data.us_equivalent}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-sm text-gray-500 leading-relaxed">
        {data.explanation}
      </p>
    </div>
    </TooltipProvider>
  );
}
