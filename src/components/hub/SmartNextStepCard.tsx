import { useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { SmartNextStep } from '@/types/hub';

interface SmartNextStepCardProps {
  step: SmartNextStep | null;
  onAction?: () => void;
}

const URGENCY_BADGE: Record<string, string> = {
  high: 'bg-orange-50 text-orange-600',
  medium: 'bg-green-50 text-green-600',
  low: 'bg-gray-50 text-gray-500',
};

const URGENCY_LABEL: Record<string, string> = {
  high: 'Urgente',
  medium: 'Próximo',
  low: 'Dica',
};

export function SmartNextStepCard({ step, onAction }: SmartNextStepCardProps) {
  const navigate = useNavigate();

  if (!step) return null;

  const Icon = (icons as Record<string, LucideIcon>)[step.icon] || icons.Zap;
  const badgeClasses = URGENCY_BADGE[step.urgencyLevel] ?? URGENCY_BADGE.low;
  const badgeLabel = URGENCY_LABEL[step.urgencyLevel] ?? 'Dica';

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else {
      navigate(step.actionHref);
    }
  };

  return (
    <div className="bg-white dark:bg-card rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-white/10 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <div>
            <h3 className="text-gray-500 dark:text-muted-foreground text-sm font-medium mb-1">Próximo Passo</h3>
            <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-foreground leading-tight">{step.title}</div>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${badgeClasses}`}>
            {badgeLabel}
          </span>
        </div>
        <p className="text-gray-400 dark:text-muted-foreground text-xs mb-4 line-clamp-3 sm:line-clamp-none">{step.description}</p>
      </div>
      <button
        onClick={handleClick}
        className="flex items-center text-xs font-bold text-[#7367F0] group"
      >
        {step.actionLabel} <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
