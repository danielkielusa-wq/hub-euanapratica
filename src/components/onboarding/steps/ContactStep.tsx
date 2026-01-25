import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { OnboardingProfile } from '@/types/onboarding';
import { Lock } from 'lucide-react';

interface ContactStepProps {
  data: Partial<OnboardingProfile>;
  onChange: (field: keyof OnboardingProfile, value: string | boolean) => void;
  errors: Record<string, string>;
}

export function ContactStep({ data, onChange, errors }: ContactStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Como podemos falar com você?
        </h1>
        <p className="text-muted-foreground text-base">
          Defina os melhores canais de comunicação.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Primary Email - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            Email principal
            <Lock className="h-3 w-3 text-muted-foreground" />
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Este é o email vinculado à sua conta.
          </p>
        </div>

        {/* Alternative Email */}
        <div className="space-y-2">
          <Label htmlFor="alternative_email" className="text-sm font-medium">
            Email alternativo
          </Label>
          <Input
            id="alternative_email"
            type="email"
            value={data.alternative_email || ''}
            onChange={(e) => onChange('alternative_email', e.target.value)}
            placeholder="outro@email.com"
            className={errors.alternative_email ? 'border-destructive' : ''}
          />
          {errors.alternative_email && (
            <p className="text-xs text-destructive">{errors.alternative_email}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Telefone
          </Label>
          <PhoneInput
            value={data.phone || ''}
            countryCode={data.phone_country_code || '+55'}
            isWhatsApp={data.is_whatsapp || false}
            onValueChange={(phone) => onChange('phone', phone)}
            onCountryCodeChange={(code) => onChange('phone_country_code', code)}
            onWhatsAppChange={(isWhatsApp) => onChange('is_whatsapp', isWhatsApp)}
          />
        </div>
      </div>
    </div>
  );
}
