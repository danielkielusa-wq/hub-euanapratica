import { User, Briefcase, Target, DollarSign, CheckCircle, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LeadFormData {
  nome: string;
  whatsapp: string;
  email: string;
  consentimento_marketing: boolean;
  area_profissional: string;
  anos_experiencia: string;
  nivel_ingles: string;
  objetivo: string;
  status_visto: string;
  prazo_movimento: string;
  composicao_familiar: string;
  faixa_investimento: string;
  principal_obstaculo: string;
  maior_duvida: string;
}

export const initialFormData: LeadFormData = {
  nome: "",
  whatsapp: "",
  email: "",
  consentimento_marketing: false,
  area_profissional: "",
  anos_experiencia: "",
  nivel_ingles: "",
  objetivo: "",
  status_visto: "",
  prazo_movimento: "",
  composicao_familiar: "",
  faixa_investimento: "",
  principal_obstaculo: "",
  maior_duvida: "",
};

export interface StepInfo {
  Icon: LucideIcon;
  label: string;
}

export const STEPS: StepInfo[] = [
  { Icon: User, label: "Dados" },
  { Icon: Briefcase, label: "Perfil" },
  { Icon: Target, label: "Objetivos" },
  { Icon: DollarSign, label: "Investimento" },
  { Icon: CheckCircle, label: "Fechamento" },
  { Icon: Play, label: "Resultado" },
];

export const MOTIVATIONAL_MESSAGES = [
  "Ótimo! Vamos conhecer sua trajetória",
  "Perfeito! Agora seus objetivos",
  "Quase lá! Você está a 2 passos",
  "Incrível! Última etapa",
  "Parabéns! Análise completa",
];

export interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  mask: string;
  minLocalDigits: number;
  maxLocalDigits: number;
}

export const COUNTRIES: Country[] = [
  { code: "BR", dial: "55", flag: "🇧🇷", name: "Brasil", mask: "(XX) XXXXX-XXXX", minLocalDigits: 10, maxLocalDigits: 11 },
  { code: "US", dial: "1", flag: "🇺🇸", name: "Estados Unidos", mask: "(XXX) XXX-XXXX", minLocalDigits: 10, maxLocalDigits: 10 },
  { code: "PT", dial: "351", flag: "🇵🇹", name: "Portugal", mask: "XXX XXX XXX", minLocalDigits: 9, maxLocalDigits: 9 },
  { code: "UK", dial: "44", flag: "🇬🇧", name: "Reino Unido", mask: "XXXX XXXXXX", minLocalDigits: 10, maxLocalDigits: 10 },
  { code: "CA", dial: "1", flag: "🇨🇦", name: "Canadá", mask: "(XXX) XXX-XXXX", minLocalDigits: 10, maxLocalDigits: 10 },
  { code: "DE", dial: "49", flag: "🇩🇪", name: "Alemanha", mask: "XXX XXXXXXXX", minLocalDigits: 10, maxLocalDigits: 11 },
  { code: "FR", dial: "33", flag: "🇫🇷", name: "França", mask: "X XX XX XX XX", minLocalDigits: 9, maxLocalDigits: 9 },
  { code: "ES", dial: "34", flag: "🇪🇸", name: "Espanha", mask: "XXX XXX XXX", minLocalDigits: 9, maxLocalDigits: 9 },
  { code: "IT", dial: "39", flag: "🇮🇹", name: "Itália", mask: "XXX XXX XXXX", minLocalDigits: 9, maxLocalDigits: 10 },
  { code: "AR", dial: "54", flag: "🇦🇷", name: "Argentina", mask: "XX XXXX-XXXX", minLocalDigits: 10, maxLocalDigits: 10 },
  { code: "MX", dial: "52", flag: "🇲🇽", name: "México", mask: "XX XXXX XXXX", minLocalDigits: 10, maxLocalDigits: 10 },
  { code: "JP", dial: "81", flag: "🇯🇵", name: "Japão", mask: "XX-XXXX-XXXX", minLocalDigits: 10, maxLocalDigits: 10 },
];
