import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Rocket, GraduationCap } from 'lucide-react';

interface MilestoneCelebrationProps {
  milestone: number | null;
  onClose: () => void;
}

const MILESTONE_CONFIG: Record<number, { icon: React.ElementType; title: string; message: string; color: string }> = {
  25: {
    icon: Star,
    title: 'Excelente começo!',
    message: 'Você completou 25% do curso. Continue assim!',
    color: 'text-blue-400',
  },
  50: {
    icon: Rocket,
    title: 'Metade do caminho!',
    message: 'Você completou 50% do curso. A dedicação está valendo a pena!',
    color: 'text-purple-400',
  },
  75: {
    icon: Trophy,
    title: 'Quase lá!',
    message: 'Você completou 75% do curso. A reta final começou!',
    color: 'text-amber-400',
  },
  100: {
    icon: GraduationCap,
    title: 'Parabéns! Curso concluído!',
    message: 'Você completou 100% do curso. Seu certificado está disponível!',
    color: 'text-emerald-400',
  },
};

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      // Fire from both sides
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      confetti({ ...defaults, particleCount: 50, origin: { x: 0.2, y: 0.6 } });
      confetti({ ...defaults, particleCount: 50, origin: { x: 0.8, y: 0.6 } });
      // Second burst
      setTimeout(() => {
        confetti({ ...defaults, particleCount: 30, origin: { x: 0.5, y: 0.4 } });
      }, 250);
    } catch {
      // canvas-confetti not available — skip
    }
  }, []);

  useEffect(() => {
    if (milestone) {
      fireConfetti();
    }
  }, [milestone, fireConfetti]);

  if (!milestone) return null;

  const config = MILESTONE_CONFIG[milestone];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Dialog open={!!milestone} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ${config.color}`}>
            <Icon className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{config.title}</h2>
            <p className="text-muted-foreground">{config.message}</p>
            <p className="text-4xl font-black text-primary">{milestone}%</p>
          </div>
          <Button onClick={onClose} className="mt-2 rounded-full px-8">
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
