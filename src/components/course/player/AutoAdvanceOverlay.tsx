import { useState, useEffect } from 'react';
import { X, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoAdvanceOverlayProps {
  nextLessonTitle: string;
  onAdvance: () => void;
  onCancel: () => void;
  visible: boolean;
}

export function AutoAdvanceOverlay({
  nextLessonTitle,
  onAdvance,
  onCancel,
  visible,
}: AutoAdvanceOverlayProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!visible) {
      setCountdown(5);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onAdvance]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 animate-in fade-in duration-300">
      <div className="text-center space-y-4 max-w-sm px-4">
        {/* Countdown ring */}
        <div className="relative w-16 h-16 mx-auto">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - countdown / 5)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold">
            {countdown}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-white/50 text-xs uppercase tracking-wider">
            Proxima aula
          </p>
          <p className="text-white font-medium text-sm line-clamp-2">
            {nextLessonTitle}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
            onClick={onAdvance}
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Ir agora
          </Button>
        </div>
      </div>
    </div>
  );
}
