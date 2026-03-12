import { OnboardingProfile } from '@/types/onboarding';
import { PhoneInput } from '@/components/ui/phone-input';
import { User } from 'lucide-react';

interface PersonalInfoStepProps {
  data: Partial<OnboardingProfile>;
  onChange: (field: keyof OnboardingProfile, value: string | boolean) => void;
  errors: Record<string, string>;
}

export function PersonalInfoStep({ data, onChange, errors }: PersonalInfoStepProps) {
  return (
    <div className="animate-in fade-in duration-300">
      {/* Icon & Title */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Sobre você
        </h1>
        <p className="text-muted-foreground">
          Essas informações ajudam a personalizar sua jornada.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            NOME COMPLETO <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={data.full_name || ''}
            onChange={(e) => onChange('full_name', e.target.value)}
            placeholder="Seu nome completo"
            className={`w-full rounded-xl border-0 bg-muted/50 px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.full_name ? 'ring-2 ring-destructive' : ''
            }`}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name}</p>
          )}
        </div>

        {/* Preferred Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            COMO GOSTARIA DE SER CHAMADO(A)?
          </label>
          <input
            type="text"
            value={data.preferred_name || ''}
            onChange={(e) => onChange('preferred_name', e.target.value)}
            placeholder="Apelido ou nome preferido"
            className="w-full rounded-xl border-0 bg-muted/50 px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <p className="text-xs text-muted-foreground">
            Usaremos este nome em nossas comunicações.
          </p>
        </div>

        {/* Birth Date */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            DATA DE NASCIMENTO <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={data.birth_date || ''}
            min="1920-01-01"
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              const val = e.target.value;
              const year = val.split('-')[0];
              if (year && year.length > 4) return;
              onChange('birth_date', val);
            }}
            className={`w-full rounded-xl border-0 bg-muted/50 px-4 py-3.5 text-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.birth_date ? 'ring-2 ring-destructive' : ''
            }`}
          />
          {errors.birth_date && (
            <p className="text-xs text-destructive">{errors.birth_date}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            TELEFONE <span className="text-destructive">*</span>
          </label>
          <PhoneInput
            value={data.phone || ''}
            countryCode={data.phone_country_code || '+55'}
            isWhatsApp={data.is_whatsapp || false}
            onValueChange={(phone) => onChange('phone', phone)}
            onCountryCodeChange={(code) => onChange('phone_country_code', code)}
            onWhatsAppChange={(isWhatsApp) => onChange('is_whatsapp', isWhatsApp)}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
}
