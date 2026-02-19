import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInView } from '@/hooks/useInView';
import type { V2RotaFrameworkProgress, V2RotaPhase } from '@/types/leads';

interface V2RotaProgressProps {
  progress: V2RotaFrameworkProgress;
}

const phaseDescriptions: Record<string, string> = {
  R: 'Entender onde você está e o que precisa mudar.',
  O: 'Estruturar inglês, finanças e rede de apoio.',
  T: 'Preparar portfólio, currículo e começar a aplicar.',
  A: 'Entrevistas, negociação e primeiros contratos.',
};

const phaseColors: Record<string, { bg: string; ring: string; text: string }> = {
  R: { bg: 'bg-blue-600', ring: '#3b82f6', text: 'text-white' },
  O: { bg: 'bg-amber-500', ring: '#f59e0b', text: 'text-white' },
  T: { bg: 'bg-gray-300 dark:bg-gray-700', ring: '#9ca3af', text: 'text-gray-500 dark:text-gray-400' },
  A: { bg: 'bg-gray-300 dark:bg-gray-700', ring: '#9ca3af', text: 'text-gray-500 dark:text-gray-400' },
};

function PhaseCircle({ phase, isActive, isPast, isInView }: {
  phase: V2RotaPhase;
  isActive: boolean;
  isPast: boolean;
  isInView: boolean;
}) {
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (phase.completion_percentage / 100) * circumference;
  const isLocked = !isActive && !isPast;
  const colors = (isActive || isPast) ? phaseColors[phase.letter] || phaseColors.T : phaseColors.T;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {(isActive || isPast) && (
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="transparent"
            stroke={colors.ring}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isInView ? targetOffset : circumference}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        )}
      </svg>
      <div className={cn(
        'absolute inset-1 rounded-full flex items-center justify-center font-bold text-lg',
        isActive ? `${colors.bg} ${colors.text} shadow-md` : isPast ? `${colors.bg} ${colors.text}` : 'bg-muted text-muted-foreground'
      )}>
        {isLocked ? <Lock className="w-4 h-4" /> : phase.letter}
      </div>
    </div>
  );
}

export function V2RotaProgress({ progress }: V2RotaProgressProps) {
  const { ref, isInView } = useInView();
  const phases = progress.phases;
  const currentIdx = phases.findIndex(p => p.letter === progress.current_phase);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold text-foreground">Jornada ROTA</h2>
        <p className="text-sm text-muted-foreground mt-1">Sua posição na metodologia 4 fases.</p>
      </div>

      <div ref={ref} className="space-y-0">
        {phases.map((phase, index) => {
          const isActive = index === currentIdx;
          const isPast = index < currentIdx;
          const isLocked = index > currentIdx;
          const description = phaseDescriptions[phase.letter] || '';

          return (
            <div key={phase.letter} className="flex gap-3 sm:gap-4">
              {/* Left: circle + vertical line */}
              <div className="flex flex-col items-center">
                <PhaseCircle phase={phase} isActive={isActive} isPast={isPast} isInView={isInView} />
                {index < phases.length - 1 && (
                  <div className={cn(
                    'w-0.5 flex-1 min-h-[32px]',
                    isPast ? 'bg-blue-400' : 'bg-border'
                  )} />
                )}
              </div>

              {/* Right: content */}
              <div className={cn('pb-8 pt-1 flex-1', index === phases.length - 1 && 'pb-0')}>
                <p className={cn(
                  'font-bold text-xs sm:text-sm',
                  isActive ? 'text-foreground' : isLocked ? 'text-muted-foreground' : 'text-foreground'
                )}>
                  {phase.letter} — {phase.name}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {description}
                </p>
                {isLocked ? (
                  <p className="text-xs text-muted-foreground/60 mt-1 italic">
                    Desbloqueando após completar os itens anteriores
                  </p>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden max-w-[120px]">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          isActive ? 'bg-blue-500' : 'bg-amber-400'
                        )}
                        style={{
                          width: isInView ? `${phase.completion_percentage}%` : '0%',
                          transition: 'width 1s ease-out',
                          transitionDelay: `${index * 150}ms`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {phase.completion_percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
