import { useState } from 'react';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'dunning_banner_dismissed_at';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function isDismissed(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  return Date.now() - Number(dismissed) < DISMISS_DURATION_MS;
}

const STAGE_CONFIG = {
  1: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-800',
    text: 'text-amber-700',
    message: 'Houve um problema com seu pagamento. Atualize seus dados para manter seu acesso.',
  },
  2: {
    bg: 'bg-orange-50 border-orange-200',
    icon: 'text-orange-600',
    title: 'text-orange-800',
    text: 'text-orange-700',
    message: 'Segunda tentativa de cobrança falhou. Atualize seu cartão para evitar a suspensão do seu plano.',
  },
  3: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    text: 'text-red-700',
    message: 'Último aviso: seu acesso será suspenso em breve. Atualize seu cartão agora para não perder seus benefícios.',
  },
} as const;

export function DunningBanner() {
  const { subscriptionStatus, dunningStage, tictoChangeCardUrl, gracePeriodEndsAt } = usePlanAccess();
  const [dismissed, setDismissed] = useState(isDismissed);

  const shouldShow =
    !dismissed &&
    (subscriptionStatus === 'past_due' || subscriptionStatus === 'grace_period') &&
    dunningStage > 0;

  if (!shouldShow) return null;

  const stage = Math.min(Math.max(dunningStage, 1), 3) as 1 | 2 | 3;
  const config = STAGE_CONFIG[stage];

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const graceEndFormatted = gracePeriodEndsAt
    ? new Date(gracePeriodEndsAt).toLocaleDateString('pt-BR')
    : null;

  return (
    <div className={cn('rounded-2xl border p-4 mb-4 animate-fade-in', config.bg)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn('w-5 h-5 mt-0.5 shrink-0', config.icon)} />
        <div className="flex-1 min-w-0">
          <p className={cn('font-bold text-sm', config.title)}>
            Problema com pagamento
          </p>
          <p className={cn('text-sm mt-1', config.text)}>
            {config.message}
          </p>
          {graceEndFormatted && (
            <p className={cn('text-xs mt-1 font-bold', config.text)}>
              Acesso garantido até: {graceEndFormatted}
            </p>
          )}
          {tictoChangeCardUrl && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 gap-2"
              onClick={() => window.open(tictoChangeCardUrl, '_blank')}
            >
              <CreditCard className="w-4 h-4" />
              Atualizar Cartão
            </Button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className={cn('p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0', config.text)}
          title="Dispensar por 24h"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
