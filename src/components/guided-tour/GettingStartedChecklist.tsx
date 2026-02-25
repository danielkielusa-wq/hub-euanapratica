import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ArrowRight, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import {
  useGuidedTourState,
  useUpdateGuidedTourState,
  useChecklistStatus,
} from '@/hooks/useGuidedTour';

export function GettingStartedChecklist() {
  const navigate = useNavigate();
  const { data: tourState, isLoading: tourLoading } = useGuidedTourState();
  const { data: items, isLoading: itemsLoading } = useChecklistStatus();
  const updateTourState = useUpdateGuidedTourState();
  const confettiFiredRef = useRef(false);

  const completedCount = items?.filter((i) => i.completed).length || 0;
  const totalCount = items?.length || 4;
  const allCompleted = completedCount === totalCount && totalCount > 0;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Fire confetti when all items completed
  useEffect(() => {
    if (allCompleted && !confettiFiredRef.current && items && items.length > 0) {
      confettiFiredRef.current = true;
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
    }
  }, [allCompleted, items]);

  if (tourLoading || itemsLoading) return null;
  if (tourState?.checklist_dismissed) return null;
  if (!items) return null;

  const handleDismiss = () => {
    updateTourState.mutate({ checklist_dismissed: true });
  };

  return (
    <Card className="relative bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
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
          <CardTitle className="text-lg font-bold text-gray-900">
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

      <CardContent className="space-y-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => !item.completed && navigate(item.href)}
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
                  item.completed ? 'text-green-700 line-through' : 'text-gray-700'
                )}
              >
                {item.label}
              </span>
              <span className="text-xs text-gray-400">{item.description}</span>
            </div>
            {!item.completed && (
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
            )}
          </button>
        ))}

        {allCompleted && (
          <div className="pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="w-full text-gray-500 rounded-xl"
            >
              Fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
