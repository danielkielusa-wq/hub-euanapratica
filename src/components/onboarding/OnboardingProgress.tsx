import { OnboardingStep, ONBOARDING_STEPS } from '@/types/onboarding';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mt-4 -mx-4 sm:-mx-6 lg:-mx-12">
      <div className="h-1 bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
