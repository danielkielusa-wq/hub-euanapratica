import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Globe,
  BookOpen,
  BarChart3,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface TranslationProgressProps {
  titleBr: string;
}

const PHASES = [
  {
    icon: Search,
    label: 'Analisando seu titulo brasileiro...',
    detail: 'Identificando nivel hierarquico, senioridade e contexto do cargo',
    duration: 2400,
  },
  {
    icon: Globe,
    label: 'Pesquisando equivalencias no mercado americano...',
    detail: 'Cruzando com vagas reais postadas nos EUA',
    duration: 3200,
  },
  {
    icon: BookOpen,
    label: 'Aplicando regras EUA Na Pratica...',
    detail: 'Titulos que recrutadores americanos realmente buscam',
    duration: 2800,
  },
  {
    icon: BarChart3,
    label: 'Mapeando faixas salariais e empresas...',
    detail: 'Dados de mercado para cada sugestao de titulo',
    duration: 2600,
  },
  {
    icon: Sparkles,
    label: 'Gerando sugestoes personalizadas...',
    detail: 'Selecionando as 3 melhores opcoes para o seu perfil',
    duration: 4000,
  },
];

export function TranslationProgress({ titleBr }: TranslationProgressProps) {
  const [activePhase, setActivePhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let elapsed = 0;

    PHASES.forEach((phase, index) => {
      const activateTimer = setTimeout(() => {
        setActivePhase(index);
      }, elapsed);
      timersRef.current.push(activateTimer);

      const completeDelay = elapsed + phase.duration - 400;
      const completeTimer = setTimeout(() => {
        setCompletedPhases(prev => [...prev, index]);
      }, completeDelay);
      timersRef.current.push(completeTimer);

      elapsed += phase.duration;
    });

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-sm max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-100 mb-4">
          <Sparkles size={14} className="animate-pulse" /> Processando
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-1">
          Traduzindo seu titulo
        </h2>
        <p className="text-sm text-gray-400">
          <span className="font-semibold text-gray-600">"{titleBr}"</span>
        </p>
      </div>

      {/* Phases */}
      <div className="space-y-1">
        {PHASES.map((phase, index) => {
          const isCompleted = completedPhases.includes(index);
          const isActive = activePhase === index && !isCompleted;
          const isPending = index > activePhase;
          const Icon = phase.icon;

          return (
            <div
              key={index}
              className={`
                flex items-start gap-4 p-4 rounded-2xl transition-all duration-500
                ${isActive ? 'bg-brand-50/60 border border-brand-100' : 'border border-transparent'}
                ${isPending ? 'opacity-30' : ''}
                ${isCompleted ? 'opacity-60' : ''}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500
                  ${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 scale-110' : ''}
                  ${isCompleted ? 'bg-green-100 text-green-600' : ''}
                  ${isPending ? 'bg-gray-100 text-gray-300' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <p
                  className={`
                    text-sm font-bold transition-colors duration-500
                    ${isActive ? 'text-gray-900' : ''}
                    ${isCompleted ? 'text-gray-500' : ''}
                    ${isPending ? 'text-gray-300' : ''}
                  `}
                >
                  {phase.label}
                </p>
                {(isActive || isCompleted) && (
                  <p className="text-xs text-gray-400 mt-0.5 animate-fade-in">
                    {phase.detail}
                  </p>
                )}

                {isActive && (
                  <div className="mt-3 h-1 bg-brand-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{
                        animation: `progress-fill ${phase.duration}ms ease-out forwards`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-gray-300 mt-8 font-medium">
        Isso geralmente leva de 5 a 15 segundos
      </p>

      <style>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
