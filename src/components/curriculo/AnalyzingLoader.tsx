import { useState, useEffect } from 'react';
import {
  Upload,
  FileSearch,
  ShieldCheck,
  Target,
  FileText,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';

interface AnalyzingStep {
  label: string;
  icon: React.ElementType;
  durationMs: number;
}

const STEPS: AnalyzingStep[] = [
  { label: 'Enviando currículo...', icon: Upload, durationMs: 0 },
  { label: 'Extraindo informações do documento...', icon: FileSearch, durationMs: 3000 },
  { label: 'Verificando regras EUA Na Prática...', icon: ShieldCheck, durationMs: 5000 },
  { label: 'Analisando compatibilidade com a vaga...', icon: Target, durationMs: 4000 },
  { label: 'Verificando formatação ATS...', icon: FileText, durationMs: 3500 },
  { label: 'Gerando relatório personalizado...', icon: Sparkles, durationMs: 4000 },
];

interface AnalyzingLoaderProps {
  status?: 'uploading' | 'analyzing';
}

export function AnalyzingLoader({ status = 'analyzing' }: AnalyzingLoaderProps) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // When status changes to analyzing, move to step 1 if still on step 0
    if (status === 'analyzing' && activeStep === 0) {
      setActiveStep(1);
    }
  }, [status, activeStep]);

  useEffect(() => {
    // Don't auto-advance step 0 (uploading) — it advances via status change
    if (activeStep === 0) return;
    // Don't advance past last step
    if (activeStep >= STEPS.length - 1) return;

    const timer = setTimeout(() => {
      setActiveStep(prev => prev + 1);
    }, STEPS[activeStep].durationMs);

    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Animated main icon */}
      <div className="relative">
        <div className="absolute inset-0 w-28 h-28 bg-primary/15 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 w-28 h-28 bg-primary/10 rounded-full animate-pulse" />
        <div className="relative flex items-center justify-center w-28 h-28 bg-white rounded-full shadow-lg border border-gray-100">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-900">
          Analisando seu Currículo
        </h2>
        <p className="text-sm text-gray-400">
          Isso pode levar alguns segundos
        </p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-md space-y-3 px-4">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;

          return (
            <div
              key={index}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500
                ${isActive ? 'bg-primary/5 border border-primary/20 shadow-sm' : ''}
                ${isCompleted ? 'opacity-60' : ''}
                ${!isActive && !isCompleted ? 'opacity-30' : ''}
              `}
            >
              {/* Status indicator */}
              <div className={`
                flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500
                ${isCompleted ? 'bg-green-100' : ''}
                ${isActive ? 'bg-primary/10' : ''}
                ${!isActive && !isCompleted ? 'bg-gray-100' : ''}
              `}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : isActive ? (
                  <StepIcon className="w-4 h-4 text-primary animate-pulse" />
                ) : (
                  <StepIcon className="w-4 h-4 text-gray-400" />
                )}
              </div>

              {/* Label */}
              <span className={`
                text-sm font-medium transition-colors duration-500
                ${isCompleted ? 'text-green-700 line-through decoration-green-300' : ''}
                ${isActive ? 'text-gray-900' : ''}
                ${!isActive && !isCompleted ? 'text-gray-400' : ''}
              `}>
                {step.label}
              </span>

              {/* Active spinner */}
              {isActive && (
                <Loader2 className="w-4 h-4 text-primary animate-spin ml-auto flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
