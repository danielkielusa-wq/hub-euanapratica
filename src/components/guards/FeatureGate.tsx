import { ReactNode } from 'react';
import { Lock, Crown, Sparkles } from 'lucide-react';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { PlanFeatureKey } from '@/types/plans';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
  feature: PlanFeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showLocked?: boolean;
  className?: string;
}

interface UpgradePromptProps {
  feature: PlanFeatureKey;
  className?: string;
}

const FEATURE_NAMES: Record<PlanFeatureKey, string> = {
  hotseats: 'Hotseats Mensais',
  hotseat_priority: 'Prioridade nos Hotseats',
  hotseat_guaranteed: 'Vaga Garantida',
  community: 'Comunidade Exclusiva',
  library: 'Biblioteca de Materiais',
  masterclass: 'Masterclass Mensal',
  job_concierge: 'Prime Jobs',
  prime_jobs: 'Prime Jobs',
  show_improvements: 'Melhorias de Impacto',
  show_power_verbs: 'Power Verbs',
  show_cheat_sheet: 'Guia de Entrevistas',
  allow_pdf: 'Exportar PDF',
};

const FEATURE_PLANS: Record<PlanFeatureKey, string> = {
  hotseats: 'PRO',
  hotseat_priority: 'VIP',
  hotseat_guaranteed: 'VIP',
  community: 'Básico',
  library: 'PRO',
  masterclass: 'PRO',
  job_concierge: 'VIP',
  prime_jobs: 'PRO',
  show_improvements: 'PRO',
  show_power_verbs: 'PRO',
  show_cheat_sheet: 'VIP',
  allow_pdf: 'PRO',
};

export function UpgradePrompt({ feature, className }: UpgradePromptProps) {
  const featureName = FEATURE_NAMES[feature];
  const requiredPlan = FEATURE_PLANS[feature];

  const handleUpgrade = () => {
    // Navigate to pricing/upgrade page or open modal
    window.open('https://chat.whatsapp.com/I7Drkh80c1b9ULOmnwPOwg', '_blank');
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-2xl border border-border",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Crown className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">
        Recurso Exclusivo
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        <strong>{featureName}</strong> está disponível a partir do plano <strong>{requiredPlan}</strong>.
      </p>
      <Button onClick={handleUpgrade} className="gap-2">
        <Sparkles className="w-4 h-4" />
        Fazer Upgrade
      </Button>
    </div>
  );
}

interface LockedOverlayProps {
  feature: PlanFeatureKey;
  children: ReactNode;
  className?: string;
}

export function LockedOverlay({ feature, children, className }: LockedOverlayProps) {
  const requiredPlan = FEATURE_PLANS[feature];

  const handleUpgrade = () => {
    window.open('https://chat.whatsapp.com/I7Drkh80c1b9ULOmnwPOwg', '_blank');
  };

  return (
    <div className={cn("relative", className)}>
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Disponível no {requiredPlan}
          </p>
          <Button 
            variant="link" 
            size="sm" 
            onClick={handleUpgrade}
            className="text-primary"
          >
            Fazer Upgrade →
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showLocked = false,
  className 
}: FeatureGateProps) {
  const { hasFeature } = usePlanAccess();

  if (!hasFeature(feature)) {
    if (showLocked) {
      return (
        <LockedOverlay feature={feature} className={className}>
          {children}
        </LockedOverlay>
      );
    }
    return <>{fallback || <UpgradePrompt feature={feature} className={className} />}</>;
  }

  return <>{children}</>;
}
