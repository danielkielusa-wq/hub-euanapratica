import { Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LockedFeatureProps {
  isLocked: boolean;
  featureName: string;
  onUpgrade: () => void;
  children: React.ReactNode;
}

export function LockedFeature({ isLocked, featureName, onUpgrade, children }: LockedFeatureProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="blur-sm pointer-events-none select-none opacity-60">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 text-center max-w-sm mx-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {featureName}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            Este recurso está disponível nos planos Pro e VIP. 
            Faça upgrade para desbloquear.
          </p>
          
          <Button 
            onClick={onUpgrade}
            variant="gradient"
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Ver Planos
          </Button>
        </div>
      </div>
    </div>
  );
}
