import { useEffect } from 'react';
import { Brain, RefreshCw, Sparkles, Check, Loader2, Database, MessageSquare, Settings2 } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIDailyPriorities, type ProgressPhase, PHASE_LABELS } from '@/hooks/useAIDailyPriorities';
import { PriorityCategorySection } from './PriorityCategorySection';
import { cn } from '@/lib/utils';

// ── Progress steps ────────────────────────────────────────────────────

const STEPS: { phase: ProgressPhase; icon: typeof Brain }[] = [
  { phase: 'loading_config', icon: Settings2 },
  { phase: 'querying_leads', icon: Database },
  { phase: 'querying_interactions', icon: MessageSquare },
  { phase: 'calling_ai', icon: Sparkles },
  { phase: 'parsing_response', icon: Check },
];

const PHASE_ORDER: ProgressPhase[] = STEPS.map(s => s.phase);

function PrioritiesLoader({ currentPhase }: { currentPhase: ProgressPhase | null }) {
  const currentIdx = currentPhase ? PHASE_ORDER.indexOf(currentPhase) : -1;

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6">
      <div className="relative">
        <div className="absolute inset-0 w-20 h-20 bg-indigo-100 rounded-full animate-ping opacity-40" />
        <div className="relative flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg border border-indigo-100">
          <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
        </div>
      </div>

      <div className="w-full max-w-xs space-y-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div
              key={step.phase}
              className={cn(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-300',
                isActive && 'bg-indigo-50 border border-indigo-200',
                isDone && 'opacity-60',
                isPending && 'opacity-30',
              )}
            >
              <div className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                isDone && 'bg-green-100',
                isActive && 'bg-indigo-100',
                isPending && 'bg-gray-100',
              )}>
                {isDone ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                ) : (
                  <Icon className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <span className={cn(
                'text-xs',
                isActive && 'font-medium text-indigo-700',
                isDone && 'text-gray-500 line-through',
                isPending && 'text-gray-400',
              )}>
                {PHASE_LABELS[step.phase]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────

interface AIDailyPrioritiesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIDailyPrioritiesPanel({ open, onOpenChange }: AIDailyPrioritiesPanelProps) {
  const {
    data, isGenerating, progressPhase, completedItems, generatePriorities, markAsDone,
  } = useAIDailyPriorities();

  // Auto-generate on first open
  useEffect(() => {
    if (open && !data && !isGenerating) {
      generatePriorities();
    }
  }, [open, data, isGenerating, generatePriorities]);

  // Count non-empty categories
  const nonEmptyCategories = data?.categories?.filter(c => c.items?.length > 0) || [];
  const defaultOpenCategories = nonEmptyCategories.slice(0, 2).map(c => c.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
                <Brain className="w-4 h-4 text-indigo-600" />
              </div>
              Prioridades do Dia
            </SheetTitle>
            <SheetDescription className="text-xs">
              Sugestões inteligentes de ações prioritárias baseadas nos seus leads
            </SheetDescription>
          </SheetHeader>

          {/* Regenerate button */}
          <div className="flex items-center gap-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-xl gap-1.5"
              onClick={generatePriorities}
              disabled={isGenerating}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isGenerating && 'animate-spin')} />
              Regenerar
            </Button>

            {data && !isGenerating && (
              <span className="text-[10px] text-gray-400">
                Gerado às {new Date(data.generated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Loading with progress steps */}
          {isGenerating && <PrioritiesLoader currentPhase={progressPhase} />}

          {/* Results */}
          {data && !isGenerating && (
            <>
              {/* Summary card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                  {data.summary}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="outline" className="text-[10px] bg-white/60 border-blue-200 text-blue-600">
                    {data.total_actionable_leads} leads acionáveis
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-white/60 border-blue-200 text-blue-600">
                    {nonEmptyCategories.length} categorias
                  </Badge>
                </div>
              </div>

              {/* Categories as accordion */}
              {nonEmptyCategories.length > 0 ? (
                <Accordion
                  type="multiple"
                  defaultValue={defaultOpenCategories}
                  className="space-y-2"
                >
                  {data.categories.map((category) => {
                    const itemCount = category.items?.length || 0;
                    if (itemCount === 0) return null;

                    return (
                      <AccordionItem
                        key={category.id}
                        value={category.id}
                        className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50 [&[data-state=open]]:bg-gray-50">
                          <div className="flex items-center gap-2 text-left">
                            <span className="text-sm font-medium text-gray-800">
                              {category.title}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] rounded-full px-1.5 py-0 bg-white border-gray-200"
                            >
                              {itemCount}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 pt-1">
                          <PriorityCategorySection
                            category={category}
                            completedItems={completedItems}
                            onMarkDone={markAsDone}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-gray-400">
                    Nenhuma ação prioritária identificada hoje.
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Todos os leads estão em dia!
                  </p>
                </div>
              )}
            </>
          )}

          {/* Empty state (before first generation) */}
          {!data && !isGenerating && (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Brain className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">
                  Clique em "Regenerar" para gerar as prioridades do dia
                </p>
                <p className="text-xs text-gray-400">
                  A IA vai analisar seus leads e sugerir ações prioritárias
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
