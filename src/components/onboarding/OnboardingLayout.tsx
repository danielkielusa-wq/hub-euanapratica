import { ReactNode } from 'react';
import { OnboardingSidebar } from './OnboardingSidebar';
import { OnboardingHeader } from './OnboardingHeader';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingStep } from '@/types/onboarding';

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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <OnboardingSidebar currentStep={currentStep} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <OnboardingHeader
          currentStep={currentStep}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer with Navigation */}
        <footer className="border-t border-border bg-background px-4 sm:px-6 lg:px-12 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            {canGoBack ? (
              <button
                onClick={onBack}
                className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="px-8 py-2.5 text-sm font-medium text-primary-foreground bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nextLabel || (isLastStep ? 'Ir para meu painel' : 'Próximo')}
            </button>
          </div>

          {/* Progress Bar */}
          <OnboardingProgress currentStep={currentStep} />
        </footer>
      </div>
    </div>
  );
}
