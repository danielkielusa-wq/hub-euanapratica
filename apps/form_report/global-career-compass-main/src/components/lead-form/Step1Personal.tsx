import { LeadFormData, COUNTRIES, Country } from "./types";
import { Check, X, ChevronDown } from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";

interface Step1Props {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string | boolean) => void;
  errors: Record<string, string>;
}

const formatLocalPhone = (value: string, country: Country) => {
  const digits = value.replace(/\D/g, "");

  if (country.code === "BR") {
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  if (country.code === "US" || country.code === "CA") {
    if (digits.length <= 3) return digits.length ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  return digits;
};

const getLocalDigits = (whatsapp: string, country: Country) => {
  // Strip the dial code prefix and return only local digits
  const full = whatsapp.replace(/\D/g, "");
  if (full.startsWith(country.dial)) {
    return full.slice(country.dial.length);
  }
  return full;
};

const Step1Personal = ({ data, onChange, errors }: Step1Props) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [localPhone, setLocalPhone] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nameValid = data.nome.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const localDigits = localPhone.replace(/\D/g, "");
  const whatsappValid = localDigits.length >= selectedCountry.minLocalDigits;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountries(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync full whatsapp value to parent whenever localPhone or country changes
  useEffect(() => {
    const digits = localPhone.replace(/\D/g, "");
    if (digits.length > 0) {
      onChange("whatsapp", `+${selectedCountry.dial}${digits}`);
    } else {
      onChange("whatsapp", "");
    }
  }, [localPhone, selectedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize localPhone from saved data
  useEffect(() => {
    if (data.whatsapp) {
      const raw = data.whatsapp.replace(/\D/g, "");
      // Try to detect country from saved data
      for (const c of COUNTRIES) {
        if (raw.startsWith(c.dial) && raw.length > c.dial.length) {
          setSelectedCountry(c);
          const local = raw.slice(c.dial.length);
          setLocalPhone(formatLocalPhone(local, c));
          return;
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountries(false);
    setLocalPhone("");
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, selectedCountry.maxLocalDigits);
    setLocalPhone(formatLocalPhone(digits, selectedCountry));
  };

  const emailSuggestion = useMemo(() => {
    if (!data.email || emailValid) return null;
    const match = data.email.match(/@(\w+)\./);
    if (!match) return null;
    const domain = match[1].toLowerCase();
    const suggestions: Record<string, string> = {
      gmal: "gmail", gmial: "gmail", gmai: "gmail",
      hotmal: "hotmail", hotmai: "hotmail",
      outlok: "outlook", outloo: "outlook",
    };
    if (suggestions[domain]) {
      return data.email.replace(domain, suggestions[domain]);
    }
    return null;
  }, [data.email, emailValid]);

  const renderValidation = (valid: boolean, touched: boolean) => {
    if (!touched) return null;
    return valid ? (
      <Check className="w-4 h-4 text-success check-pop" />
    ) : (
      <X className="w-4 h-4 text-destructive" />
    );
  };

  return (
    <div className="space-y-6 fade-in-scale">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Descubra seu potencial para uma Carreira Internacional
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Em apenas 2 minutos, você receberá uma análise personalizada do seu perfil. Vamos começar!
        </p>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Nome completo *</label>
          <div className="relative">
            <input
              type="text"
              value={data.nome}
              onChange={(e) => onChange("nome", e.target.value)}
              placeholder="Seu nome completo"
              className={`input-field pr-10 ${
                data.nome ? (nameValid ? "valid" : "error") : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderValidation(nameValid, data.nome.length > 0)}
            </div>
          </div>
          {errors.nome && (
            <p className="text-xs text-destructive shake">{errors.nome}</p>
          )}
        </div>

        {/* WhatsApp with country selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">WhatsApp *</label>
          <div className="relative flex gap-0" ref={dropdownRef}>
            {/* Country selector button */}
            <button
              type="button"
              onClick={() => setShowCountries(!showCountries)}
              className="flex items-center gap-1.5 px-3 py-3 rounded-l-xl border-2 border-r-0 border-border bg-secondary/50 hover:bg-secondary transition-colors flex-shrink-0"
            >
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span className="text-xs font-medium text-muted-foreground">+{selectedCountry.dial}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Country dropdown */}
            {showCountries && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto fade-in-scale">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      selectedCountry.code === country.code ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium text-foreground flex-1">{country.name}</span>
                    <span className="text-xs text-muted-foreground">+{country.dial}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Local phone input (no country code) */}
            <div className="relative flex-1">
              <input
                type="tel"
                value={localPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={selectedCountry.mask}
                className={`input-field rounded-l-none pr-10 ${
                  localDigits.length > 0 ? (whatsappValid ? "valid" : "error") : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidation(whatsappValid, localDigits.length > 0)}
              </div>
            </div>
          </div>
          {errors.whatsapp && (
            <p className="text-xs text-destructive shake">{errors.whatsapp}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">E-mail profissional *</label>
          <div className="relative">
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="seu@email.com"
              className={`input-field pr-10 ${
                data.email ? (emailValid ? "valid" : "error") : ""
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderValidation(emailValid, data.email.length > 0)}
            </div>
          </div>
          {emailSuggestion && (
            <button
              type="button"
              onClick={() => onChange("email", emailSuggestion)}
              className="text-xs text-primary hover:underline"
            >
              Você quis dizer {emailSuggestion}?
            </button>
          )}
          {errors.email && (
            <p className="text-xs text-destructive shake">{errors.email}</p>
          )}
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-border bg-secondary/50 cursor-pointer hover:border-primary/30 transition-colors">
          <input
            type="checkbox"
            checked={data.consentimento_marketing}
            onChange={(e) => onChange("consentimento_marketing", e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-border text-primary accent-primary"
          />
          <span className="text-xs text-foreground leading-relaxed">
            Aceito receber comunicações de marketing, ofertas, eventos da EUA Na Prática e promoções por e-mail e WhatsApp.
          </span>
        </label>
        {errors.consentimento_marketing && (
          <p className="text-xs text-destructive shake">{errors.consentimento_marketing}</p>
        )}
      </div>
    </div>
  );
};

export default Step1Personal;
