import { Check, Rocket, User, Phone, Briefcase, MapPin, PartyPopper } from 'lucide-react';
import { OnboardingStep, ONBOARDING_STEPS } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface OnboardingSidebarProps {
  currentStep: OnboardingStep;
}

const stepIcons = {
  1: Rocket,
  2: User,
  3: Phone,
  4: Briefcase,
  5: MapPin,
  6: PartyPopper,
};

export function OnboardingSidebar({ currentStep }: OnboardingSidebarProps) {
  const currentConfig = ONBOARDING_STEPS.find(s => s.step === currentStep);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-sm">EP</span>
            </div>
            <span className="text-white font-semibold">EUA Na Prática</span>
          </div>
        </div>

        {/* Mobile Stepper */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {ONBOARDING_STEPS.map((step) => (
            <div
              key={step.step}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                step.step === currentStep
                  ? 'w-8 bg-white'
                  : step.step < currentStep
                  ? 'w-2 bg-white/80'
                  : 'w-2 bg-white/30'
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[420px] bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 flex-col p-8 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <span className="text-white font-semibold text-lg">EUA Na Prática</span>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1">
          <div className="mb-8">
            {(() => {
              const Icon = stepIcons[currentStep];
              return (
                <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6">
                  <Icon className="h-8 w-8 text-white" />
                </div>
              );
            })()}
            <h2 className="text-2xl font-bold mb-2">
              {currentConfig?.sidebarTitle}
            </h2>
            <p className="text-blue-100 text-base">
              {currentConfig?.sidebarSubtitle}
            </p>
          </div>

          {/* Stepper */}
          <div className="space-y-4">
            {ONBOARDING_STEPS.map((step, index) => {
              const isCompleted = step.step < currentStep;
              const isCurrent = step.step === currentStep;
              const Icon = stepIcons[step.step];

              return (
                <div
                  key={step.step}
                  className={cn(
                    'flex items-center gap-4 py-2 transition-opacity duration-300',
                    isCurrent ? 'opacity-100' : isCompleted ? 'opacity-80' : 'opacity-40'
                  )}
                >
                  <div
                    className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300',
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Icon className={cn('h-5 w-5', isCurrent ? 'text-blue-600' : 'text-white')} />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors duration-300',
                      isCurrent ? 'text-white' : 'text-blue-100'
                    )}
                  >
                    {step.title.length > 30 ? step.sidebarTitle : step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Message */}
        <div className="mt-auto pt-8 border-t border-white/10">
          <p className="text-blue-100 text-sm">
            Sua carreira internacional está a poucos passos de distância.
          </p>
        </div>
      </aside>
    </>
  );
}
