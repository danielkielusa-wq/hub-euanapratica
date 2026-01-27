import { useState, useRef } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImprovementCard } from './ImprovementCard';
import type { Improvement } from '@/types/curriculo';

interface ImprovementsSectionProps {
  improvements: Improvement[];
  powerVerbs: string[];
}

const ITEMS_PER_PAGE = 3;

export function ImprovementsSection({ improvements, powerVerbs }: ImprovementsSectionProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(improvements.length / ITEMS_PER_PAGE);
  
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const visibleImprovements = improvements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPrevious = () => setCurrentPage(p => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Melhorias de Impacto
            </h3>
            <p className="text-sm text-muted-foreground">
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
            <span className="text-sm text-muted-foreground min-w-[40px] text-center">
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

      {/* Power Verbs Horizontal Scroll */}
      {powerVerbs.length > 0 && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-10 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex-shrink-0 mr-2">
              Power Verbs:
            </span>
            {powerVerbs.map((verb, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium flex-shrink-0"
              >
                {verb}
              </span>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

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
