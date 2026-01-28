import { ReactNode } from 'react';
import { OnboardingHorizontalStepper } from './OnboardingHorizontalStepper';
import { OnboardingStep } from '@/types/onboarding';
import { ArrowRight, Check, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnboardingLayoutProps {
  currentStep: OnboardingStep;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  nextLabel?: string;
}

export function OnboardingLayout({
  currentStep,
  children,
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  isLastStep,
  isSaving,
  lastSaved,
  nextLabel,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Horizontal Stepper Header */}
      <OnboardingHorizontalStepper currentStep={currentStep} />

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 lg:py-12">
        <div className="w-full max-w-2xl">
          {/* Card Container */}
          <div className="animate-fade-in rounded-[40px] bg-card p-8 shadow-[0_10px_40px_rgba(0,0,0,0.03)] lg:p-12">
            {children}
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 flex items-center justify-between px-2">
            {/* Back Button */}
            {canGoBack ? (
              <button
                onClick={onBack}
                className="px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Voltar
              </button>
            ) : (
              <div />
            )}

            {/* Save Status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3 w-3 text-accent" />
                  <span>Salvo às {format(lastSaved, 'HH:mm', { locale: ptBR })}</span>
                </>
              ) : null}
            </div>

            {/* Next Button */}
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {nextLabel || (isLastStep ? 'Ir para meu painel' : 'Próximo')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Security Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>SUA SEGURANÇA É NOSSA PRIORIDADE. DADOS PROTEGIDOS POR CRIPTOGRAFIA.</span>
          </div>
        </div>
      </main>
    </div>
  );
}
