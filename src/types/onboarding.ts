export interface OnboardingProfile {
  id: string;
  has_completed_onboarding: boolean;
  full_name: string;
  preferred_name?: string | null;
  birth_date?: string | null;
  email: string;
  alternative_email?: string | null;
  phone_country_code?: string | null;
  phone?: string | null;
  is_whatsapp?: boolean | null;
  linkedin_url?: string | null;
  resume_url?: string | null;
  current_country?: string | null;
  current_state?: string | null;
  current_city?: string | null;
  target_country?: string | null;
  timezone?: string | null;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface OnboardingState {
  currentStep: OnboardingStep;
  isSaving: boolean;
  lastSaved: Date | null;
}

export interface StepConfig {
  step: OnboardingStep;
  title: string;
  subtitle: string;
  sidebarTitle: string;
  sidebarSubtitle: string;
}

export const ONBOARDING_STEPS: StepConfig[] = [
  {
    step: 1,
    title: 'Bem-vindo(a) ao EUA Na Prática',
    subtitle: 'Em poucos passos vamos preparar seu perfil para acelerar sua carreira internacional.',
    sidebarTitle: 'Prepare-se para decolar',
    sidebarSubtitle: 'Sua jornada internacional começa agora',
  },
  {
    step: 2,
    title: 'Sobre você',
    subtitle: 'Essas informações ajudam a personalizar sua jornada.',
    sidebarTitle: 'Quem é você',
    sidebarSubtitle: 'Conte-nos mais sobre você',
  },
  {
    step: 3,
    title: 'Como podemos falar com você?',
    subtitle: 'Defina os melhores canais de comunicação.',
    sidebarTitle: 'Vamos manter contato',
    sidebarSubtitle: 'Configure seus canais de comunicação',
  },
  {
    step: 4,
    title: 'LinkedIn e currículo',
    subtitle: 'Esses dados ajudam nas mentorias e oportunidades.',
    sidebarTitle: 'Sua presença profissional',
    sidebarSubtitle: 'Compartilhe seu perfil profissional',
  },
  {
    step: 5,
    title: 'Localização e destino',
    subtitle: 'Essas informações ajudam a contextualizar sua rota internacional.',
    sidebarTitle: 'De onde para onde?',
    sidebarSubtitle: 'Sua jornada internacional',
  },
  {
    step: 6,
    title: 'Seu perfil está configurado com sucesso',
    subtitle: 'Agora você está pronto para avançar na sua jornada internacional.',
    sidebarTitle: 'Tudo pronto',
    sidebarSubtitle: 'Seu perfil está configurado',
  },
];

export const COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'ES', name: 'Espanha' },
  { code: 'IT', name: 'Itália' },
  { code: 'AU', name: 'Austrália' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'NL', name: 'Holanda' },
  { code: 'CH', name: 'Suíça' },
  { code: 'JP', name: 'Japão' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
];

export const TARGET_COUNTRIES = [
  { code: 'US', name: 'Estados Unidos' },
  { code: 'CA', name: 'Canadá' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'AU', name: 'Austrália' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Irlanda' },
  { code: 'NZ', name: 'Nova Zelândia' },
  { code: 'FR', name: 'França' },
  { code: 'ES', name: 'Espanha' },
  { code: 'NL', name: 'Holanda' },
  { code: 'CH', name: 'Suíça' },
];
