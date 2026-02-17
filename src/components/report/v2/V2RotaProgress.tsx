import { cn } from '@/lib/utils';
import type { V2RotaFrameworkProgress } from '@/types/leads';

interface V2RotaProgressProps {
  progress: V2RotaFrameworkProgress;
}

function PhaseRing({ percentage, size = 56, strokeWidth = 4, active = false }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  active?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 transform -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={active ? 'rgba(37, 99, 235, 0.3)' : 'rgba(255, 255, 255, 0.1)'}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={active ? '#2563EB' : 'rgba(37, 99, 235, 0.6)'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export function V2RotaProgress({ progress }: V2RotaProgressProps) {
  const phases = progress.phases;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        🧭 Metodo ROTA EUA™
      </h3>

      <div className="rounded-[32px] bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] p-6 md:p-8 shadow-xl">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {phases.map((phase, index) => {
            const isActive = phase.letter === progress.current_phase;
            const isPast = phases.findIndex(p => p.letter === progress.current_phase) > index;

            return (
              <div key={phase.letter} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div className={cn(
                      "flex-1 h-1 rounded-full",
                      isPast ? "bg-[#2563EB]" : "bg-white/20"
                    )} />
                  )}

                  {/* Circle with progress ring */}
                  <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
                    <PhaseRing
                      percentage={phase.completion_percentage}
                      active={isActive}
                    />
                    <div className={cn(
                      "absolute inset-1 rounded-full flex items-center justify-center font-bold text-lg transition-all",
                      isActive
                        ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30"
                        : isPast
                          ? "bg-[#2563EB]/60 text-white"
                          : "bg-white/10 text-white/50"
                    )}>
                      {phase.letter}
                    </div>
                  </div>

                  {index < phases.length - 1 && (
                    <div className={cn(
                      "flex-1 h-1 rounded-full",
                      isPast || isActive ? "bg-[#2563EB]" : "bg-white/20"
                    )} />
                  )}
                </div>

                {/* Label + percentage */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    isActive ? "text-white" : "text-white/60"
                  )}>
                    {phase.name}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {phase.completion_percentage}%
                  </p>
                  <p className="text-[10px] text-white/30 hidden sm:block capitalize">
                    {phase.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
