import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import {
  useGuidedTourState,
  useUpdateGuidedTourState,
  useChecklistStatus,
} from '@/hooks/useGuidedTour';
import { SmartNextStepCard } from '@/components/hub/SmartNextStepCard';
import type { GuidedTourState, ChecklistItemKey, ChecklistItemStatus } from '@/types/guidedTour';
import type { SmartNextStep } from '@/types/hub';

interface GettingStartedChecklistProps {
  assessmentIncomplete?: boolean;
  onOpenAssessment?: () => void;
  /** When provided, renders the SmartNextStep card inline (left side on desktop) */
  smartStep?: SmartNextStep;
  onSmartStepAction?: () => void;
}

export function GettingStartedChecklist({ assessmentIncomplete = false, onOpenAssessment, smartStep, onSmartStepAction }: GettingStartedChecklistProps) {
  const navigate = useNavigate();
  const { data: tourState, isLoading: tourLoading } = useGuidedTourState();
  const { data: items, isLoading: itemsLoading } = useChecklistStatus();
  const updateTourState = useUpdateGuidedTourState();
  const confettiFiredRef = useRef(false);

  // Prepend "Finalize seu cadastro" when assessment is incomplete
  const allItems: ChecklistItemStatus[] = [];
  if (assessmentIncomplete) {
    allItems.push({
      key: 'complete_assessment' as ChecklistItemKey,
      label: 'Finalize seu cadastro',
      description: 'Complete seus dados para receber seu diagnóstico de carreira',
      href: '#open-assessment',
      completed: false,
    });
  }
  if (items) allItems.push(...items);

  const completedCount = allItems.filter((i) => i.completed).length;
  const totalCount = allItems.length || 4;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Fire confetti only once ever (persisted via confetti_shown flag), then auto-dismiss
  useEffect(() => {
    if (
      allCompleted &&
      !confettiFiredRef.current &&
      !tourState?.confetti_shown &&
      allItems.length > 0
    ) {
      confettiFiredRef.current = true;
      // Persist immediately so confetti never fires again, even if component unmounts
      updateTourState.mutate({ confetti_shown: true });

      const end = Date.now() + 2000;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#4f46e5', '#10b981', '#f59e0b'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#4f46e5', '#10b981', '#f59e0b'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // Auto-dismiss checklist after confetti finishes
      const timer = setTimeout(() => {
        updateTourState.mutate({ checklist_dismissed: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allCompleted, items, tourState?.confetti_shown]);

  if (tourLoading || itemsLoading) return null;
  if (tourState?.checklist_dismissed) return null;
  if (allItems.length === 0) return null;

  const handleDismiss = () => {
    updateTourState.mutate({ checklist_dismissed: true });
  };

  const handleItemClick = (item: ChecklistItemStatus) => {
    if (item.completed) return;
    // Special case: open assessment sheet instead of navigating
    if (item.key === 'complete_assessment' && onOpenAssessment) {
      onOpenAssessment();
      return;
    }
    // Mark step as completed immediately, then navigate
    const stepKey = `step_${item.key}` as keyof GuidedTourState;
    updateTourState.mutate({ [stepKey]: true } as Partial<GuidedTourState>);
    navigate(item.href);
  };

  const checklistCard = (
    <Card className="relative bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in-up">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
        aria-label="Fechar checklist"
      >
        <X className="w-4 h-4" />
      </button>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-foreground">
            {allCompleted ? 'Parabéns! Tudo completo!' : 'Primeiros Passos'}
          </CardTitle>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Progress value={progressPercent} className="h-2 flex-1" />
          <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
            {completedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {allItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              disabled={item.completed}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all group',
                item.completed
                  ? 'bg-green-50/50 cursor-default'
                  : 'hover:bg-gray-50 cursor-pointer'
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'text-sm font-medium block',
                    item.completed ? 'text-green-700 line-through' : 'text-gray-700 dark:text-foreground'
                  )}
                >
                  {item.label}
                </span>
                <span className="text-xs text-gray-400 dark:text-muted-foreground">{item.description}</span>
              </div>
              {!item.completed && (
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // When smartStep is provided, render side-by-side on desktop
  if (smartStep) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {checklistCard}
        </div>
        <SmartNextStepCard step={smartStep} onAction={onSmartStepAction} />
      </div>
    );
  }

  return checklistCard;
}
