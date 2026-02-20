import { STEPS } from "./types";
import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const timeEstimates = ["2 minutos", "2 minutos", "1 minuto", "1 minuto", "30 segundos", ""];

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Etapa {currentStep + 1} de {totalSteps}
          </span>
          <span className="font-semibold text-primary">{progress}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
              background:
                progress < 40
                  ? `hsl(var(--warning))`
                  : progress < 70
                  ? `linear-gradient(90deg, hsl(var(--warning)), hsl(var(--primary)))`
                  : `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const StepIcon = step.Icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i < currentStep
                    ? "bg-success text-success-foreground"
                    : i === currentStep
                    ? "bg-primary text-primary-foreground scale-110 shadow-md"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? (
                  <Check className="w-4 h-4 check-pop" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  i === currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {currentStep < 5 && timeEstimates[currentStep] && (
        <p className="text-center text-xs text-muted-foreground">
          Tempo estimado: {timeEstimates[currentStep]}
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
