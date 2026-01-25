import { Check, Loader2, HelpCircle } from 'lucide-react';
import { OnboardingStep, ONBOARDING_STEPS } from '@/types/onboarding';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnboardingHeaderProps {
  currentStep: OnboardingStep;
  isSaving: boolean;
  lastSaved: Date | null;
}

export function OnboardingHeader({ currentStep, isSaving, lastSaved }: OnboardingHeaderProps) {
  const totalSteps = ONBOARDING_STEPS.length;

  return (
    <header className="border-b border-border bg-background px-4 sm:px-6 lg:px-12 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            Passo {currentStep} de {totalSteps}
          </span>

          {/* Save Status */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>
                  Salvo às {format(lastSaved, 'HH:mm', { locale: ptBR })}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Help Link */}
        <a
          href="mailto:suporte@euanapratica.com"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Precisa de ajuda?</span>
        </a>
      </div>
    </header>
  );
}
