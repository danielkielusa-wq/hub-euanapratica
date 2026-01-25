import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OnboardingProfile, COUNTRIES, TARGET_COUNTRIES } from '@/types/onboarding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

interface LocationStepProps {
  data: Partial<OnboardingProfile>;
  onChange: (field: keyof OnboardingProfile, value: string) => void;
  errors: Record<string, string>;
}

export function LocationStep({ data, onChange, errors }: LocationStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Localização e destino
        </h1>
        <p className="text-muted-foreground text-base">
          Essas informações ajudam a contextualizar sua rota internacional.
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {/* Current Location */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Localização atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="current_country" className="text-sm font-medium">
                País onde mora atualmente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.current_country || ''}
                onValueChange={(value) => onChange('current_country', value)}
              >
                <SelectTrigger className={errors.current_country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione um país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.current_country && (
                <p className="text-xs text-destructive">{errors.current_country}</p>
              )}
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="current_state" className="text-sm font-medium">
                Estado / Província
              </Label>
              <Input
                id="current_state"
                type="text"
                value={data.current_state || ''}
                onChange={(e) => onChange('current_state', e.target.value)}
                placeholder="Ex: São Paulo, California"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="current_city" className="text-sm font-medium">
                Cidade
              </Label>
              <Input
                id="current_city"
                type="text"
                value={data.current_city || ''}
                onChange={(e) => onChange('current_city', e.target.value)}
                placeholder="Ex: São Paulo, Los Angeles"
              />
            </div>
          </CardContent>
        </Card>

        {/* Target Destination */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Navigation className="h-4 w-4 text-blue-600" />
              Destino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="target_country" className="text-sm font-medium">
                País de interesse principal <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.target_country || ''}
                onValueChange={(value) => onChange('target_country', value)}
              >
                <SelectTrigger className={errors.target_country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione um país" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.target_country && (
                <p className="text-xs text-destructive">{errors.target_country}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
