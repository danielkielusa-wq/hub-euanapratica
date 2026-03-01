import { useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { SmartNextStep } from '@/types/hub';

interface SmartNextStepCardProps {
  step: SmartNextStep | null;
}

const URGENCY_ICON_BG: Record<string, string> = {
  high: 'bg-[#fff3e8] text-[#ff9f43]',
  medium: 'bg-[#eae8fd] text-[#7367f0]',
  low: 'bg-muted text-muted-foreground',
};

export function SmartNextStepCard({ step }: SmartNextStepCardProps) {
  const navigate = useNavigate();

  if (!step) return null;

  const Icon = (icons as Record<string, LucideIcon>)[step.icon] || icons.Zap;
  const iconBg = URGENCY_ICON_BG[step.urgencyLevel] ?? URGENCY_ICON_BG.low;

  return (
    <button
      onClick={() => navigate(step.actionHref)}
      className="w-full text-left rounded-md border-0 bg-card p-5 shadow-md hover:shadow-lg transition-all duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Próximo Passo</p>
          <h3 className="text-sm font-medium text-foreground mb-1">{step.title}</h3>
          <p className="text-[13px] text-muted-foreground line-clamp-2">{step.description}</p>

          <span className="inline-flex items-center gap-1 mt-3 text-[13px] font-medium text-[#7367f0] group-hover:gap-2 transition-all">
            {step.actionLabel} <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </button>
  );
}
