import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  User, Briefcase, Target, DollarSign, CheckCircle, Play,
  ArrowLeft, ArrowRight, Sparkles, Loader2, Check, X,
  ChevronDown, Lock, Mail, Clock, Globe, Instagram,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadFormData {
  nome: string;
  whatsapp: string;
  email: string;
  consentimento_marketing: boolean;
  cargo_atual: string;
  area_profissional: string;
  anos_experiencia: string;
  nivel_ingles: string;
  trabalha_internacional: string;
  objetivo: string;
  status_visto: string;
  prazo_movimento: string;
  composicao_familiar: string;
  faixa_renda: string;
  faixa_investimento: string;
  principal_obstaculo: string;
  maior_duvida: string;
}

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  mask: string;
  minLocalDigits: number;
  maxLocalDigits: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM_DATA: LeadFormData = {
  nome: '', whatsapp: '', email: '', consentimento_marketing: false,
  cargo_atual: '', area_profissional: '', anos_experiencia: '', nivel_ingles: '', trabalha_internacional: '',
  objetivo: '', status_visto: '', prazo_movimento: '', composicao_familiar: '',
  faixa_renda: '', faixa_investimento: '', principal_obstaculo: '', maior_duvida: '',
};

const COUNTRIES: Country[] = [
  { code: 'BR', dial: '55', flag: '\u{1F1E7}\u{1F1F7}', name: 'Brasil', mask: '(XX) XXXXX-XXXX', minLocalDigits: 10, maxLocalDigits: 11 },
  { code: 'US', dial: '1', flag: '\u{1F1FA}\u{1F1F8}', name: 'Estados Unidos', mask: '(XXX) XXX-XXXX', minLocalDigits: 10, maxLocalDigits: 10 },
  { code: 'PT', dial: '351', flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugal', mask: 'XXX XXX XXX', minLocalDigits: 9, maxLocalDigits: 9 },
  { code: 'UK', dial: '44', flag: '\u{1F1EC}\u{1F1E7}', name: 'Reino Unido', mask: 'XXXX XXXXXX', minLocalDigits: 10, maxLocalDigits: 10 },
  { code: 'CA', dial: '1', flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada', mask: '(XXX) XXX-XXXX', minLocalDigits: 10, maxLocalDigits: 10 },
  { code: 'DE', dial: '49', flag: '\u{1F1E9}\u{1F1EA}', name: 'Alemanha', mask: 'XXX XXXXXXXX', minLocalDigits: 10, maxLocalDigits: 11 },
  { code: 'FR', dial: '33', flag: '\u{1F1EB}\u{1F1F7}', name: 'Franca', mask: 'X XX XX XX XX', minLocalDigits: 9, maxLocalDigits: 9 },
  { code: 'ES', dial: '34', flag: '\u{1F1EA}\u{1F1F8}', name: 'Espanha', mask: 'XXX XXX XXX', minLocalDigits: 9, maxLocalDigits: 9 },
  { code: 'IT', dial: '39', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italia', mask: 'XXX XXX XXXX', minLocalDigits: 9, maxLocalDigits: 10 },
  { code: 'AR', dial: '54', flag: '\u{1F1E6}\u{1F1F7}', name: 'Argentina', mask: 'XX XXXX-XXXX', minLocalDigits: 10, maxLocalDigits: 10 },
  { code: 'MX', dial: '52', flag: '\u{1F1F2}\u{1F1FD}', name: 'Mexico', mask: 'XX XXXX XXXX', minLocalDigits: 10, maxLocalDigits: 10 },
  { code: 'JP', dial: '81', flag: '\u{1F1EF}\u{1F1F5}', name: 'Japao', mask: 'XX-XXXX-XXXX', minLocalDigits: 10, maxLocalDigits: 10 },
];

const STEPS: { Icon: LucideIcon; label: string }[] = [
  { Icon: User, label: 'Dados' },
  { Icon: Briefcase, label: 'Perfil' },
  { Icon: Target, label: 'Objetivos' },
  { Icon: DollarSign, label: 'Investimento' },
  { Icon: CheckCircle, label: 'Fechamento' },
  { Icon: Play, label: 'Resultado' },
];

const MOTIVATIONAL_MESSAGES = [
  'Otimo! Vamos conhecer sua trajetoria',
  'Perfeito! Agora seus objetivos',
  'Quase la! Voce esta a 2 passos',
  'Incrivel! Ultima etapa',
  'Parabens! Analise completa',
];

const AREAS = ['Tecnologia', 'Engenharia', 'Negocios / Administracao', 'Marketing / Comunicacao', 'Saude', 'Estudante', 'Outro'];
const EXPERIENCE = ['Menos de 2 anos', '2 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'];
const ENGLISH = ['Basico', 'Intermediario', 'Avancado', 'Fluente'];
const OBJECTIVES = ['Emprego remoto em dolar', 'Imigrar / Green Card trabalhando na minha area', 'Estudar nos EUA como porta de entrada', 'Ainda nao tenho clareza, quero entender minhas opcoes'];
const VISA_STATUS = ['Ja tenho visto de trabalho ou Green Card', 'Processo de visto / imigracao em andamento', 'Tenho/tive apenas visto de turista', 'Ainda nao iniciei nada'];
const TIMELINE = ['Ja estou em movimento / proximos 3 meses', 'Entre 3 e 6 meses', 'Entre 6 e 12 meses', 'Ainda nao tenho prazo definido'];
const FAMILY = ['Sozinho(a)', 'Com conjuge / companheiro(a)', 'Com familia e filhos', 'Ainda nao pensei sobre isso'];
const INCOME = ['Ate R$ 5 mil', 'De R$ 5 mil a R$ 10 mil', 'De R$ 10 mil a R$ 20 mil', 'Acima de R$ 20 mil', 'Prefiro nao responder'];
const INVESTMENTS = ['Ate R$500', 'De R$500 a R$2.000', 'De R$2.000 a R$5.000', 'Acima de R$5.000', 'Prefiro nao responder'];
const OBSTACLES = ['Nenhum - estou pronto(a)', 'Financeiro', 'Tempo / rotina', 'Ingles', 'Medo de tomar uma decisao errada', 'Falta de apoio do conjuge / familia', 'Outro'];

const WEBHOOK_URL = 'https://n8n.sapunplugged.com/webhook/lead_form';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLocalPhone(value: string, country: Country): string {
  const digits = value.replace(/\D/g, '');
  if (country.code === 'BR') {
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  if (country.code === 'US' || country.code === 'CA') {
    if (digits.length <= 3) return digits.length ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return digits;
}

// ─── Sub-components (inline) ──────────────────────────────────────────────────

function SelectCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`lf-select-card flex items-center gap-3 text-left w-full group ${selected ? 'selected' : ''}`}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          selected ? 'border-[hsl(217,91%,53%)] bg-[hsl(217,91%,53%)]' : 'border-[hsl(215,16%,47%)]/40'
        }`}
      >
        {selected && <Check className="w-2.5 h-2.5 text-white lf-check-pop" />}
      </div>
      <span className="font-medium text-xs sm:text-sm text-[hsl(220,25%,14%)] flex-1 leading-tight">{label}</span>
    </button>
  );
}

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  const timeEstimates = ['2 minutos', '2 minutos', '1 minuto', '1 minuto', '30 segundos', ''];

  const barBg = progress < 40
    ? 'hsl(38,92%,50%)'
    : progress < 70
    ? 'linear-gradient(90deg, hsl(38,92%,50%), hsl(217,91%,53%))'
    : 'linear-gradient(90deg, hsl(217,91%,53%), hsl(160,84%,39%))';

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[hsl(220,25%,14%)]">Etapa {currentStep + 1} de {totalSteps}</span>
          <span className="font-semibold text-[hsl(217,91%,53%)]">{progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden bg-[hsl(214,32%,94%)]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: barBg }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const StepIcon = step.Icon;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  i < currentStep
                    ? 'bg-[hsl(160,84%,39%)] text-white'
                    : i === currentStep
                    ? 'bg-[hsl(217,91%,53%)] text-white scale-110 shadow-md'
                    : 'bg-[hsl(214,32%,94%)] text-[hsl(215,16%,47%)]'
                }`}
              >
                {i < currentStep ? <Check className="w-4 h-4 lf-check-pop" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:block ${
                  i === currentStep ? 'text-[hsl(217,91%,53%)]' : 'text-[hsl(215,16%,47%)]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {currentStep < 5 && timeEstimates[currentStep] && (
        <p className="text-center text-xs text-[hsl(215,16%,47%)]">
          Tempo estimado: {timeEstimates[currentStep]}
        </p>
      )}
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function Step1Personal({
  data, onChange, errors,
}: {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string | boolean) => void;
  errors: Record<string, string>;
}) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [localPhone, setLocalPhone] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nameValid = data.nome.trim().length >= 3;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const localDigits = localPhone.replace(/\D/g, '');
  const whatsappValid = localDigits.length >= selectedCountry.minLocalDigits;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountries(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const digits = localPhone.replace(/\D/g, '');
    if (digits.length > 0) {
      onChange('whatsapp', `+${selectedCountry.dial}${digits}`);
    } else {
      onChange('whatsapp', '');
    }
  }, [localPhone, selectedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data.whatsapp) {
      const raw = data.whatsapp.replace(/\D/g, '');
      for (const c of COUNTRIES) {
        if (raw.startsWith(c.dial) && raw.length > c.dial.length) {
          setSelectedCountry(c);
          setLocalPhone(formatLocalPhone(raw.slice(c.dial.length), c));
          return;
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountries(false);
    setLocalPhone('');
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, selectedCountry.maxLocalDigits);
    setLocalPhone(formatLocalPhone(digits, selectedCountry));
  };

  const emailSuggestion = useMemo(() => {
    if (!data.email || emailValid) return null;
    const match = data.email.match(/@(\w+)\./);
    if (!match) return null;
    const domain = match[1].toLowerCase();
    const suggestions: Record<string, string> = {
      gmal: 'gmail', gmial: 'gmail', gmai: 'gmail',
      hotmal: 'hotmail', hotmai: 'hotmail',
      outlok: 'outlook', outloo: 'outlook',
    };
    if (suggestions[domain]) return data.email.replace(domain, suggestions[domain]);
    return null;
  }, [data.email, emailValid]);

  const renderValidation = (valid: boolean, touched: boolean) => {
    if (!touched) return null;
    return valid
      ? <Check className="w-4 h-4 text-[hsl(160,84%,39%)] lf-check-pop" />
      : <X className="w-4 h-4 text-[hsl(0,84%,60%)]" />;
  };

  return (
    <div className="space-y-6 lf-fade-in-scale">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[hsl(220,25%,14%)]">
          Descubra seu potencial para uma Carreira Internacional
        </h1>
        <p className="text-[hsl(215,16%,47%)] text-sm sm:text-base lg:text-lg">
          Preencha seus dados para iniciar a analise de perfil.
        </p>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(220,25%,14%)]">Nome completo *</label>
          <div className="relative">
            <input
              type="text"
              value={data.nome}
              onChange={(e) => onChange('nome', e.target.value)}
              placeholder="Seu nome completo"
              className={`lf-input pr-10 ${data.nome ? (nameValid ? 'valid' : 'error') : ''}`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderValidation(nameValid, data.nome.length > 0)}
            </div>
          </div>
          {errors.nome && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.nome}</p>}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(220,25%,14%)]">WhatsApp *</label>
          <div className="relative flex gap-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCountries(!showCountries)}
              className="flex items-center gap-1.5 px-3 py-3 rounded-l-xl border-2 border-r-0 border-[hsl(214,32%,91%)] bg-[hsl(214,47%,95%)]/50 hover:bg-[hsl(214,47%,95%)] transition-colors flex-shrink-0"
            >
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span className="text-xs font-medium text-[hsl(215,16%,47%)]">+{selectedCountry.dial}</span>
              <ChevronDown className="w-3 h-3 text-[hsl(215,16%,47%)]" />
            </button>

            {showCountries && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[hsl(214,32%,91%)] rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto lf-fade-in-scale">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[hsl(214,47%,95%)]/60 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      selectedCountry.code === country.code ? 'bg-[hsl(217,91%,53%)]/5' : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium text-[hsl(220,25%,14%)] flex-1">{country.name}</span>
                    <span className="text-xs text-[hsl(215,16%,47%)]">+{country.dial}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1">
              <input
                type="tel"
                value={localPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={selectedCountry.mask}
                className={`lf-input rounded-l-none pr-10 ${
                  localDigits.length > 0 ? (whatsappValid ? 'valid' : 'error') : ''
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidation(whatsappValid, localDigits.length > 0)}
              </div>
            </div>
          </div>
          {errors.whatsapp && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.whatsapp}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[hsl(220,25%,14%)]">E-mail profissional *</label>
          <div className="relative">
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="seu@email.com"
              className={`lf-input pr-10 ${data.email ? (emailValid ? 'valid' : 'error') : ''}`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderValidation(emailValid, data.email.length > 0)}
            </div>
          </div>
          {emailSuggestion && (
            <button type="button" onClick={() => onChange('email', emailSuggestion)} className="text-xs text-[hsl(217,91%,53%)] hover:underline">
              Voce quis dizer {emailSuggestion}?
            </button>
          )}
          {errors.email && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.email}</p>}
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-[hsl(214,32%,91%)] bg-[hsl(214,47%,95%)]/50 cursor-pointer hover:border-[hsl(217,91%,53%)]/30 transition-colors">
          <input
            type="checkbox"
            checked={data.consentimento_marketing}
            onChange={(e) => onChange('consentimento_marketing', e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-[hsl(214,32%,91%)] text-[hsl(217,91%,53%)] accent-[hsl(217,91%,53%)]"
          />
          <span className="text-xs text-[hsl(220,25%,14%)] leading-relaxed">
            Aceito receber comunicacoes de marketing, ofertas, eventos da EUA Na Pratica e promocoes por e-mail e WhatsApp.
          </span>
        </label>
        {errors.consentimento_marketing && (
          <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.consentimento_marketing}</p>
        )}
      </div>
    </div>
  );
}

function Step2Professional({
  data, onChange, errors,
}: {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6 lf-fade-in-scale">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[hsl(220,25%,14%)]">Perfil Profissional</h2>
        <p className="text-[hsl(215,16%,47%)] text-sm sm:text-base">Queremos entender melhor sua trajetoria!</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Qual sua area atual de atuacao?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AREAS.map((a) => (
              <SelectCard key={a} label={a} selected={data.area_profissional === a} onClick={() => onChange('area_profissional', a)} />
            ))}
          </div>
          {errors.area_profissional && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.area_profissional}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Qual seu cargo atual?</p>
          <input
            type="text"
            value={data.cargo_atual}
            onChange={(e) => onChange('cargo_atual', e.target.value)}
            placeholder="Desenvolvedor Senior, Gerente de Projeto, Suporte a Cliente..."
            className={`lf-input ${errors.cargo_atual ? 'error' : data.cargo_atual.trim() ? 'valid' : ''}`}
          />
          {errors.cargo_atual && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.cargo_atual}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Voce ja trabalha hoje para uma empresa internacional ou em modelo remoto para o exterior?</p>
          <div className="grid grid-cols-2 gap-2">
            <SelectCard label="Sim" selected={data.trabalha_internacional === 'true'} onClick={() => onChange('trabalha_internacional', 'true')} />
            <SelectCard label="Nao" selected={data.trabalha_internacional === 'false'} onClick={() => onChange('trabalha_internacional', 'false')} />
          </div>
          {errors.trabalha_internacional && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.trabalha_internacional}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Quantos anos de experiencia voce tem?</p>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCE.map((e) => (
              <SelectCard key={e} label={e} selected={data.anos_experiencia === e} onClick={() => onChange('anos_experiencia', e)} />
            ))}
          </div>
          {errors.anos_experiencia && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.anos_experiencia}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Qual seu nivel de ingles?</p>
          <div className="grid grid-cols-2 gap-2">
            {ENGLISH.map((e) => (
              <SelectCard key={e} label={e} selected={data.nivel_ingles === e} onClick={() => onChange('nivel_ingles', e)} />
            ))}
          </div>
          {errors.nivel_ingles && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.nivel_ingles}</p>}
        </div>
      </div>

      <p className="text-center text-sm text-[hsl(215,16%,47%)]">
        Otimo comeco! Continue para descobrir suas melhores oportunidades
      </p>
    </div>
  );
}

function Step3Objectives({
  data, onChange, errors,
}: {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6 lf-fade-in-scale">
      <div className="text-center space-y-1">
        <p className="text-xs sm:text-sm font-semibold text-[hsl(217,91%,53%)]">Voce esta na metade!</p>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[hsl(220,25%,14%)]">Objetivos e Momento</h2>
        <p className="text-[hsl(215,16%,47%)] text-sm sm:text-base">Vamos identificar o melhor caminho para voce!</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">O que voce busca nos proximos 6-12 meses?</p>
          <div className="grid grid-cols-1 gap-2">
            {OBJECTIVES.map((o) => (
              <SelectCard key={o} label={o} selected={data.objetivo === o} onClick={() => onChange('objetivo', o)} />
            ))}
          </div>
          {errors.objetivo && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.objetivo}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Sua situacao em relacao a vistos ou imigracao?</p>
          <div className="grid grid-cols-1 gap-2">
            {VISA_STATUS.map((v) => (
              <SelectCard key={v} label={v} selected={data.status_visto === v} onClick={() => onChange('status_visto', v)} />
            ))}
          </div>
          {errors.status_visto && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.status_visto}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Quando imagina comecar movimentos concretos?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIMELINE.map((t) => (
              <SelectCard key={t} label={t} selected={data.prazo_movimento === t} onClick={() => onChange('prazo_movimento', t)} />
            ))}
          </div>
          {errors.prazo_movimento && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.prazo_movimento}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">Voce pensa em ir para os EUA:</p>
          <div className="grid grid-cols-2 gap-2">
            {FAMILY.map((f) => (
              <SelectCard key={f} label={f} selected={data.composicao_familiar === f} onClick={() => onChange('composicao_familiar', f)} />
            ))}
          </div>
          {errors.composicao_familiar && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.composicao_familiar}</p>}
        </div>
      </div>

      <p className="text-center text-sm text-[hsl(215,16%,47%)]">
        Excelente! Faltam apenas 3 perguntas para sua analise completa
      </p>
    </div>
  );
}

function Step4Investment({
  data, onChange, errors,
}: {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6 lf-fade-in-scale">
      <div className="text-center space-y-1">
        <p className="text-xs sm:text-sm font-semibold text-[hsl(217,91%,53%)]">Quase la!</p>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[hsl(220,25%,14%)]">Investimento e Preparacao</h2>
        <p className="text-[hsl(215,16%,47%)] text-sm sm:text-base">
          Essa informacao nos ajuda a recomendar o melhor programa para voce.
        </p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">
            Faixa de renda mensal atual (em Reais ou convertido)?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INCOME.map((inc) => (
              <SelectCard key={inc} label={inc} selected={data.faixa_renda === inc} onClick={() => onChange('faixa_renda', inc)} />
            ))}
          </div>
          {errors.faixa_renda && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.faixa_renda}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">
            Qual faixa de investimento voce estaria disposto(a) a fazer para acelerar sua carreira internacional?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INVESTMENTS.map((inv) => (
              <SelectCard key={inv} label={inv} selected={data.faixa_investimento === inv} onClick={() => onChange('faixa_investimento', inv)} />
            ))}
          </div>
          {errors.faixa_investimento && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.faixa_investimento}</p>}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-[hsl(215,16%,47%)]">
        <Lock className="w-3 h-3" />
        <span>Suas informacoes sao 100% confidenciais</span>
      </div>

      <p className="text-center text-sm text-[hsl(215,16%,47%)]">
        Incrivel! So mais 2 etapas para completar
      </p>
    </div>
  );
}

function Step5Closing({
  data, onChange, errors,
}: {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-6 lf-fade-in-scale">
      <div className="text-center space-y-1">
        <p className="text-xs sm:text-sm font-semibold text-[hsl(217,91%,53%)]">Ultima etapa!</p>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[hsl(220,25%,14%)]">Quase terminando!</h2>
        <p className="text-[hsl(215,16%,47%)] text-sm sm:text-base">So precisamos entender melhor seus desafios.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-[hsl(220,25%,14%)]">
          Se voce for selecionado para algum programa, qual seria hoje seu principal obstaculo para comecar?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {OBSTACLES.map((o) => (
            <SelectCard key={o} label={o} selected={data.principal_obstaculo === o} onClick={() => onChange('principal_obstaculo', o)} />
          ))}
        </div>
        {errors.principal_obstaculo && <p className="text-xs text-[hsl(0,84%,60%)] lf-shake">{errors.principal_obstaculo}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[hsl(220,25%,14%)]">
          Conte em uma frase qual e sua maior duvida ou preocupacao hoje
          <span className="text-[hsl(215,16%,47%)] text-xs ml-1">(opcional)</span>
        </label>
        <textarea
          value={data.maior_duvida}
          onChange={(e) => onChange('maior_duvida', e.target.value)}
          placeholder="Ex: Tenho receio de nao conseguir validar meu diploma..."
          rows={3}
          maxLength={500}
          className="lf-input resize-none"
        />
      </div>

      <p className="text-center text-sm text-[hsl(215,16%,47%)]">
        Voce chegou ate aqui! Clique abaixo para finalizar sua analise
      </p>
    </div>
  );
}

function Step6Confirmation() {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#2563EB', '#10B981', '#F59E0B'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#2563EB', '#10B981', '#F59E0B'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="space-y-6 lf-fade-in-scale text-center">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,39%)] text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
          Parabens! Analise Completa
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(220,25%,14%)]">
          Sua aplicacao foi recebida com sucesso!
        </h2>
        <p className="text-[hsl(215,16%,47%)] text-sm sm:text-base max-w-md mx-auto">
          Assista ao video abaixo enquanto nossa equipe{' '}
          <strong>analisa suas respostas</strong> para identificar seu potencial de carreira internacional.
        </p>
      </div>

      <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <iframe
          src="https://www.youtube.com/embed/hsX8gWHrLRE?autoplay=1&mute=1&rel=0"
          title="EUA Na Pratica"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>

      <div className="space-y-3 text-sm text-[hsl(215,16%,47%)]">
        <p className="flex items-center justify-center gap-2">
          <Mail className="w-4 h-4" />
          Voce recebera o resultado via <strong>E-mail</strong> ou <strong>WhatsApp</strong>.
        </p>
        <p className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          <strong>Tempo medio de resposta: 24-48 horas</strong>
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <a
          href="https://euanapratica.com"
          target="_blank"
          rel="noopener noreferrer"
          className="lf-btn-primary inline-flex items-center justify-center gap-2 w-full py-4 text-base"
        >
          <Globe className="w-5 h-5" />
          Ir para o site principal
        </a>
        <a
          href="https://instagram.com/euanapratica"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 text-sm text-[hsl(217,91%,53%)] hover:underline"
        >
          <Instagram className="w-4 h-4" />
          Enquanto isso, siga-nos no Instagram
        </a>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadFormPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState('');
  const startTime = useRef(Date.now());

  const handleChange = useCallback(
    (field: keyof LeadFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 0) {
      if (formData.nome.trim().length < 3) errs.nome = 'Minimo 3 caracteres';
      if (formData.whatsapp.replace(/\D/g, '').length < 10) errs.whatsapp = 'Numero invalido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'E-mail invalido';
      if (!formData.consentimento_marketing) errs.consentimento_marketing = 'Consentimento obrigatorio';
    }
    if (currentStep === 1) {
      if (!formData.area_profissional) errs.area_profissional = 'Selecione uma opcao';
      if (formData.cargo_atual.trim().length < 2) errs.cargo_atual = 'Informe seu cargo atual';
      if (!formData.trabalha_internacional) errs.trabalha_internacional = 'Selecione uma opcao';
      if (!formData.anos_experiencia) errs.anos_experiencia = 'Selecione uma opcao';
      if (!formData.nivel_ingles) errs.nivel_ingles = 'Selecione uma opcao';
    }
    if (currentStep === 2) {
      if (!formData.objetivo) errs.objetivo = 'Selecione uma opcao';
      if (!formData.status_visto) errs.status_visto = 'Selecione uma opcao';
      if (!formData.prazo_movimento) errs.prazo_movimento = 'Selecione uma opcao';
      if (!formData.composicao_familiar) errs.composicao_familiar = 'Selecione uma opcao';
    }
    if (currentStep === 3) {
      if (!formData.faixa_renda) errs.faixa_renda = 'Selecione uma opcao';
      if (!formData.faixa_investimento) errs.faixa_investimento = 'Selecione uma opcao';
    }
    if (currentStep === 4) {
      if (!formData.principal_obstaculo) errs.principal_obstaculo = 'Selecione uma opcao';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const sendWebhook = async () => {
    try {
      const payload = {
        ...formData,
        submitted_at: new Date().toISOString(),
        completion_time_seconds: Math.round((Date.now() - startTime.current) / 1000),
        device: window.innerWidth < 768 ? 'mobile' : 'desktop',
      };
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        params.append(key, typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value));
      }
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: params,
      });
      console.log('Webhook sent successfully');
    } catch (err) {
      console.error('Webhook error (continuing anyway):', err);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    await sendWebhook();
    setSubmitting(false);
    setCurrentStep(5);
  };

  const next = () => {
    if (!validate()) return;

    if (currentStep === 4) {
      submit();
      return;
    }

    setMotivationalMsg(MOTIVATIONAL_MESSAGES[currentStep] || '');
    setTimeout(() => {
      setMotivationalMsg('');
      setCurrentStep((s) => s + 1);
    }, 800);
  };

  const back = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const isStep1Valid =
    formData.nome.trim().length >= 3 &&
    formData.whatsapp.replace(/\D/g, '').length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.consentimento_marketing;

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <Step1Personal data={formData} onChange={handleChange} errors={errors} />;
      case 1: return <Step2Professional data={formData} onChange={handleChange} errors={errors} />;
      case 2: return <Step3Objectives data={formData} onChange={handleChange} errors={errors} />;
      case 3: return <Step4Investment data={formData} onChange={handleChange} errors={errors} />;
      case 4: return <Step5Closing data={formData} onChange={handleChange} errors={errors} />;
      case 5: return <Step6Confirmation />;
      default: return null;
    }
  };

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-6 sm:py-10"
      style={{ background: 'linear-gradient(135deg, hsl(214 47% 97%) 0%, hsl(217 60% 95%) 50%, hsl(214 47% 97%) 100%)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div
          className="bg-white rounded-2xl border border-[hsl(214,32%,91%)] p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8"
          style={{ boxShadow: '0 4px 24px -4px hsl(217 91% 53% / 0.08), 0 1px 4px -1px hsl(217 91% 53% / 0.04)' }}
        >
          {/* Progress */}
          {currentStep < 5 && <ProgressBar currentStep={currentStep} totalSteps={6} />}

          {/* Motivational Toast */}
          {motivationalMsg && (
            <div className="text-center py-3 px-4 rounded-xl bg-[hsl(217,91%,53%)]/5 text-[hsl(217,91%,53%)] font-semibold text-sm lf-slide-up">
              {motivationalMsg}
            </div>
          )}

          {/* Step Content */}
          <div key={currentStep}>{renderStep()}</div>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="flex items-center gap-3 pt-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={back}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-[hsl(215,16%,47%)] hover:text-[hsl(220,25%,14%)] hover:bg-[hsl(214,47%,95%)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={next}
                disabled={submitting || (currentStep === 0 && !isStep1Valid)}
                className={`lf-btn-primary flex-1 flex items-center justify-center gap-2 py-3.5 text-sm ${
                  currentStep === 4 ? 'lf-btn-pulse' : ''
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === 4 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Finalizar analise
                  </>
                ) : currentStep === 0 ? (
                  isStep1Valid ? (
                    <>
                      Iniciar Analise
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    'Preencha os dados acima'
                  )
                ) : (
                  <>
                    Proximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[hsl(215,16%,47%)] mt-4">
          &copy; {new Date().getFullYear()} EUA Na Pratica - Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
