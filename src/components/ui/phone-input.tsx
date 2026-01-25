import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  mask: string;
}

const countries: Country[] = [
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷', mask: '(00) 00000-0000' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸', mask: '(000) 000-0000' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', mask: '000 000 000' },
  { code: 'ES', name: 'Espanha', dialCode: '+34', flag: '🇪🇸', mask: '000 00 00 00' },
  { code: 'FR', name: 'França', dialCode: '+33', flag: '🇫🇷', mask: '0 00 00 00 00' },
  { code: 'DE', name: 'Alemanha', dialCode: '+49', flag: '🇩🇪', mask: '0000 0000000' },
  { code: 'IT', name: 'Itália', dialCode: '+39', flag: '🇮🇹', mask: '000 000 0000' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧', mask: '0000 000000' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦', mask: '(000) 000-0000' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽', mask: '00 0000 0000' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', mask: '00 0000-0000' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', mask: '0 0000 0000' },
  { code: 'CO', name: 'Colômbia', dialCode: '+57', flag: '🇨🇴', mask: '000 000 0000' },
];

function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, '');
  let result = '';
  let digitIndex = 0;

  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '0') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += mask[i];
    }
  }

  return result;
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

interface PhoneInputProps {
  value: string;
  countryCode: string;
  isWhatsApp: boolean;
  onValueChange: (phone: string) => void;
  onCountryCodeChange: (code: string) => void;
  onWhatsAppChange: (isWhatsApp: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  countryCode,
  isWhatsApp,
  onValueChange,
  onCountryCodeChange,
  onWhatsAppChange,
  className,
  disabled,
}: PhoneInputProps) {
  const selectedCountry = countries.find(c => c.dialCode === countryCode) || countries[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const digits = extractDigits(rawValue);
    const masked = applyMask(digits, selectedCountry.mask);
    onValueChange(masked);
  };

  const handleCountryChange = (dialCode: string) => {
    onCountryCodeChange(dialCode);
    // Reset phone when country changes
    onValueChange('');
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <Select value={countryCode} onValueChange={handleCountryChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span>{selectedCountry.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.dialCode}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                  <span className="text-muted-foreground">{country.dialCode}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="tel"
          value={value}
          onChange={handlePhoneChange}
          placeholder={selectedCountry.mask.replace(/0/g, '_')}
          className="flex-1"
          disabled={disabled}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-whatsapp"
          checked={isWhatsApp}
          onCheckedChange={(checked) => onWhatsAppChange(checked === true)}
          disabled={disabled}
        />
        <Label 
          htmlFor="is-whatsapp" 
          className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-500" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Este número é WhatsApp
        </Label>
      </div>
    </div>
  );
}

export { countries };
