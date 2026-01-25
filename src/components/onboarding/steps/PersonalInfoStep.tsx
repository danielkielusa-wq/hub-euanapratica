import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingProfile } from '@/types/onboarding';

interface PersonalInfoStepProps {
  data: Partial<OnboardingProfile>;
  onChange: (field: keyof OnboardingProfile, value: string) => void;
  errors: Record<string, string>;
}

export function PersonalInfoStep({ data, onChange, errors }: PersonalInfoStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Sobre você
        </h1>
        <p className="text-muted-foreground text-base">
          Essas informações ajudam a personalizar sua jornada.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm font-medium">
            Nome completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="full_name"
            type="text"
            value={data.full_name || ''}
            onChange={(e) => onChange('full_name', e.target.value)}
            placeholder="Seu nome completo"
            className={errors.full_name ? 'border-destructive' : ''}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name}</p>
          )}
        </div>

        {/* Preferred Name */}
        <div className="space-y-2">
          <Label htmlFor="preferred_name" className="text-sm font-medium">
            Como você gostaria de ser chamado(a)?
          </Label>
          <Input
            id="preferred_name"
            type="text"
            value={data.preferred_name || ''}
            onChange={(e) => onChange('preferred_name', e.target.value)}
            placeholder="Apelido ou nome preferido"
          />
          <p className="text-xs text-muted-foreground">
            Usaremos este nome em nossas comunicações.
          </p>
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <Label htmlFor="birth_date" className="text-sm font-medium">
            Data de nascimento
          </Label>
          <Input
            id="birth_date"
            type="date"
            value={data.birth_date || ''}
            onChange={(e) => onChange('birth_date', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
