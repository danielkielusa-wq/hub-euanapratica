import { useState } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PowerVerbsRow } from './PowerVerbsRow';
import { ImprovementCard } from './ImprovementCard';
import type { Improvement } from '@/types/curriculo';

interface ImprovementsSectionProps {
  improvements: Improvement[];
  powerVerbs: string[];
}

const ITEMS_PER_PAGE = 3;

export function ImprovementsSection({ improvements, powerVerbs }: ImprovementsSectionProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(improvements.length / ITEMS_PER_PAGE);
  
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleImprovements = improvements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPrevious = () => setCurrentPage(p => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Melhorias de Impacto
            </h3>
            <p className="text-sm text-gray-500">
              Nossa IA reescreveu seus bullet points para o padrão americano.
            </p>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentPage === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-500 min-w-[40px] text-center">
              {currentPage + 1}/{totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Power Verbs */}
      <PowerVerbsRow verbs={powerVerbs} />

      {/* Improvement Cards */}
      <div className="space-y-4">
        {visibleImprovements.map((improvement, index) => (
          <ImprovementCard 
            key={startIndex + index} 
            improvement={improvement} 
            index={startIndex + index} 
          />
        ))}
      </div>
    </div>
  );
}
