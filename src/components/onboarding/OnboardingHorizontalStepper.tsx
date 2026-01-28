import { Check, HelpCircle } from 'lucide-react';
import { OnboardingStep, ONBOARDING_STEPS } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import logoHorizontal from '@/assets/logo-horizontal.png';
import { Link } from 'react-router-dom';

interface OnboardingHorizontalStepperProps {
  currentStep: OnboardingStep;
}

const stepLabels = ['INÍCIO', 'PERFIL', 'CONTATO', 'CARREIRA', 'DESTINO', 'FINAL'];

export function OnboardingHorizontalStepper({ currentStep }: OnboardingHorizontalStepperProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoHorizontal} alt="EUA Na Prática" className="h-8" />
        </Link>

        {/* Horizontal Stepper - Desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {ONBOARDING_STEPS.map((step, index) => {
            const isCompleted = step.step < currentStep;
            const isCurrent = step.step === currentStep;
            const isLast = index === ONBOARDING_STEPS.length - 1;

            return (
              <div key={step.step} className="flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all',
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : step.step}
                  </div>
                  <span
                    className={cn(
                      'mt-1 text-[10px] font-bold tracking-wider',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {stepLabels[index]}
                  </span>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'mx-2 h-0.5 w-8 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile Stepper */}
        <div className="flex items-center gap-1.5 md:hidden">
          {ONBOARDING_STEPS.map((step) => {
            const isCompleted = step.step < currentStep;
            const isCurrent = step.step === currentStep;

            return (
              <div
                key={step.step}
                className={cn(
                  'h-2 rounded-full transition-all',
                  isCurrent
                    ? 'w-6 bg-primary'
                    : isCompleted
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-muted'
                )}
              />
            );
          })}
        </div>

        {/* Help Link */}
        <a
          href="mailto:suporte@euanapratica.com"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Ajuda</span>
        </a>
      </div>
    </header>
  );
}
