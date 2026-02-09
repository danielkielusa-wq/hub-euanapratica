import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingProfile, useUpdateOnboarding, useCompleteOnboarding } from '@/hooks/useOnboarding';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep';
import { PersonalInfoStep } from '@/components/onboarding/steps/PersonalInfoStep';
import { ContactStep } from '@/components/onboarding/steps/ContactStep';
import { LinkedInResumeStep } from '@/components/onboarding/steps/LinkedInResumeStep';
import { LocationStep } from '@/components/onboarding/steps/LocationStep';
import { ConfirmationStep } from '@/components/onboarding/steps/ConfirmationStep';
import { OnboardingStep, OnboardingProfile } from '@/types/onboarding';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type FormData = Partial<OnboardingProfile>;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { data: profile, isLoading } = useOnboardingProfile();
  const updateOnboarding = useUpdateOnboarding();
  const completeOnboarding = useCompleteOnboarding();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        preferred_name: profile.preferred_name,
        birth_date: profile.birth_date,
        email: profile.email,
        alternative_email: profile.alternative_email,
        phone_country_code: profile.phone_country_code || '+55',
        phone: profile.phone,
        is_whatsapp: profile.is_whatsapp || false,
        linkedin_url: profile.linkedin_url,
        resume_url: profile.resume_url,
        current_country: profile.current_country || 'BR',
        current_state: profile.current_state,
        current_city: profile.current_city,
        target_country: profile.target_country || 'US',
        timezone: profile.timezone,
      });
    }
  }, [profile]);

  const getDashboardPath = useCallback(() => {
    // Check if there's a pending espaco_id from invitation flow
    const pendingEspacoId = localStorage.getItem('pending_espaco_id');
    if (pendingEspacoId) {
      localStorage.removeItem('pending_espaco_id');
      return `/dashboard/espacos/${pendingEspacoId}`;
    }
    
    switch (user?.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'mentor':
        return '/mentor/dashboard';
      default:
        return '/dashboard/hub';
    }
  }, [user?.role]);

  // Redirect if already completed onboarding
  useEffect(() => {
    if (user?.has_completed_onboarding) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, [user?.has_completed_onboarding, navigate, getDashboardPath]);

  const handleChange = useCallback((field: keyof OnboardingProfile, value: string | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validateStep = useCallback(async (step: OnboardingStep): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (step === 2) {
      if (!formData.full_name?.trim() || formData.full_name.trim().length < 3) {
        newErrors.full_name = 'Nome completo é obrigatório (mínimo 3 caracteres)';
      }
      if (!formData.birth_date) {
        newErrors.birth_date = 'Data de nascimento é obrigatória';
      }
    }

    if (step === 3) {
      if (!formData.phone?.trim() || formData.phone.trim().length < 8) {
        newErrors.phone = 'Telefone é obrigatório (mínimo 8 dígitos)';
      } else {
        // Check for duplicate phone number
        const { data: isAvailable, error } = await supabase.rpc('is_phone_available', {
          p_country_code: formData.phone_country_code || '+55',
          p_phone: formData.phone,
          p_user_id: user?.id
        });
        
        if (error) {
        } else if (!isAvailable) {
          newErrors.phone = 'Este número de telefone já está cadastrado no sistema.';
        }
      }
      if (formData.alternative_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.alternative_email)) {
        newErrors.alternative_email = 'Email inválido';
      }
    }

    if (step === 4) {
      if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com')) {
        newErrors.linkedin_url = 'URL do LinkedIn inválida';
      }
    }

    if (step === 5) {
      if (!formData.current_country) {
        newErrors.current_country = 'Selecione o país atual';
      }
      if (!formData.target_country) {
        newErrors.target_country = 'Selecione o país de destino';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, user?.id]);

  const saveProgress = useCallback(async () => {
    if (currentStep === 1 || currentStep === 6) return;

    setIsSaving(true);
    try {
      const dataToSave: Partial<OnboardingProfile> = { ...formData };
      delete dataToSave.id;
      delete dataToSave.email;
      delete dataToSave.has_completed_onboarding;

      await updateOnboarding.mutateAsync(dataToSave);
      setLastSaved(new Date());
    } catch (error) {
      toast.error('Erro ao salvar. Tentando novamente...');
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, formData, updateOnboarding]);

  const handleNext = useCallback(async () => {
    // Step 1 is just welcome, no validation needed
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    // Validate current step (async for phone validation)
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      return;
    }

    // Save progress before moving to next step
    await saveProgress();

    // Move to next step or complete
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  }, [currentStep, validateStep, saveProgress]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    try {
      await saveProgress();
      await completeOnboarding.mutateAsync();
      if (refreshUser) {
        await refreshUser();
      }
      toast.success('Perfil configurado com sucesso!');
      navigate(getDashboardPath(), { replace: true });
    } catch (error) {
      toast.error('Erro ao finalizar. Tente novamente.');
    }
  }, [saveProgress, completeOnboarding, navigate, getDashboardPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onStart={handleNext} />;
      case 2:
        return (
          <PersonalInfoStep
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <ContactStep
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <LinkedInResumeStep
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 5:
        return (
          <LocationStep
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 6:
        return (
          <ConfirmationStep
            onComplete={handleComplete}
            isCompleting={completeOnboarding.isPending}
          />
        );
      default:
        return null;
    }
  };

  // For step 1 and 6, we use custom layouts
  if (currentStep === 1 || currentStep === 6) {
    return (
      <OnboardingLayout
        currentStep={currentStep}
        onNext={handleNext}
        canGoBack={false}
        canGoNext={true}
        isLastStep={currentStep === 6}
        isSaving={isSaving}
        lastSaved={lastSaved}
        nextLabel={currentStep === 1 ? 'Começar' : undefined}
      >
        {renderStep()}
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      canGoBack={currentStep > 1}
      canGoNext={true}
      isLastStep={false}
      isSaving={isSaving}
      lastSaved={lastSaved}
    >
      {renderStep()}
    </OnboardingLayout>
  );
}
