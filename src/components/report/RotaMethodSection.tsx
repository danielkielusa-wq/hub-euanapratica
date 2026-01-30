import { cn } from '@/lib/utils';

interface RotaMethodSectionProps {
  rotaMethod: {
    current_phase: 'R' | 'O' | 'T' | 'A';
    phase_analysis: string;
  };
}

const phases = [
  { letter: 'R', name: 'Reconhecimento', description: 'Autoconhecimento' },
  { letter: 'O', name: 'Organização', description: 'Preparação' },
  { letter: 'T', name: 'Transição', description: 'Busca ativa' },
  { letter: 'A', name: 'Ação', description: 'Entrevistas' },
];

export function RotaMethodSection({ rotaMethod }: RotaMethodSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        🧭 Método ROTA EUA™
      </h3>
      
      <div className="rounded-[32px] bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] p-6 md:p-8 shadow-xl">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {phases.map((phase, index) => {
            const isActive = phase.letter === rotaMethod.current_phase;
            const isPast = phases.findIndex(p => p.letter === rotaMethod.current_phase) > index;
            
            return (
              <div key={phase.letter} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {/* Connector line before */}
                  {index > 0 && (
                    <div className={cn(
                      "flex-1 h-1 rounded-full",
                      isPast ? "bg-[#2563EB]" : "bg-white/20"
                    )} />
                  )}
                  
                  {/* Circle */}
                  <div className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-lg md:text-xl transition-all shrink-0",
                    isActive 
                      ? "bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-400/30 scale-110" 
                      : isPast 
                        ? "bg-[#2563EB]/60 text-white"
                        : "bg-white/10 text-white/50"
                  )}>
                    {phase.letter}
                  </div>
                  
                  {/* Connector line after */}
                  {index < phases.length - 1 && (
                    <div className={cn(
                      "flex-1 h-1 rounded-full",
                      isPast || isActive ? "bg-[#2563EB]" : "bg-white/20"
                    )} />
                  )}
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    isActive ? "text-white" : "text-white/60"
                  )}>
                    {phase.name}
                  </p>
                  <p className="text-[10px] text-white/40 hidden sm:block">
                    {phase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Phase Analysis Box */}
        <div className="mt-6 p-5 rounded-[20px] bg-white/10 backdrop-blur-sm border border-white/10">
          <p className="text-white/90 text-sm leading-relaxed">
            {rotaMethod.phase_analysis}
          </p>
        </div>
      </div>
    </div>
  );
}
