import { useNavigate } from 'react-router-dom';
import * as icons from 'lucide-react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { SmartNextStep } from '@/types/hub';

interface SmartNextStepCardProps {
  step: SmartNextStep | null;
}

const URGENCY_STYLES: Record<string, string> = {
  high: 'border-amber-200 bg-amber-50/50',
  medium: 'border-indigo-200 bg-indigo-50/30',
  low: 'border-gray-100 bg-white',
};

const URGENCY_ICON_BG: Record<string, string> = {
  high: 'bg-amber-100 text-amber-600',
  medium: 'bg-indigo-100 text-indigo-600',
  low: 'bg-gray-100 text-gray-600',
};

const URGENCY_CTA: Record<string, string> = {
  high: 'text-amber-600',
  medium: 'text-indigo-600',
  low: 'text-gray-700',
};

export function SmartNextStepCard({ step }: SmartNextStepCardProps) {
  const navigate = useNavigate();

  if (!step) return null;

  const Icon = (icons as Record<string, LucideIcon>)[step.icon] || icons.Zap;
  const borderClass = URGENCY_STYLES[step.urgencyLevel] ?? URGENCY_STYLES.low;
  const iconBg = URGENCY_ICON_BG[step.urgencyLevel] ?? URGENCY_ICON_BG.low;
  const ctaColor = URGENCY_CTA[step.urgencyLevel] ?? URGENCY_CTA.low;

  return (
    <div className="mb-8">
      <button
        onClick={() => navigate(step.actionHref)}
        className={`w-full text-left rounded-[24px] border p-5 md:p-6 shadow-sm hover:shadow-md transition-all group ${borderClass}`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Próximo Passo</p>
            <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{step.description}</p>
          </div>

          <div className={`flex items-center gap-1 text-sm font-bold flex-shrink-0 ${ctaColor} group-hover:gap-2 transition-all`}>
            {step.actionLabel} <ArrowRight size={16} />
          </div>
        </div>
      </button>
    </div>
  );
}
