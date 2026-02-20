import { LeadFormData } from "./types";
import SelectCard from "./SelectCard";

interface Step3Props {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}

const objectives = [
  "Emprego remoto em dólar",
  "Imigrar / Green Card trabalhando na minha área",
  "Estudar nos EUA como porta de entrada",
  "Ainda não tenho clareza, quero entender minhas opções",
];

const visaStatus = [
  "Já tenho visto de trabalho ou Green Card",
  "Processo de visto / imigração em andamento",
  "Tenho/tive apenas visto de turista",
  "Ainda não iniciei nada",
];

const timeline = [
  "Já estou em movimento / próximos 3 meses",
  "Entre 3 e 6 meses",
  "Entre 6 e 12 meses",
  "Ainda não tenho prazo definido",
];

const family = [
  "Sozinho(a)",
  "Com cônjuge / companheiro(a)",
  "Com família e filhos",
  "Ainda não pensei sobre isso",
];

const Step3Objectives = ({ data, onChange, errors }: Step3Props) => {
  return (
    <div className="space-y-6 fade-in-scale">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-primary">Você está na metade!</p>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Objetivos e Momento</h2>
        <p className="text-muted-foreground text-sm">Vamos identificar o melhor caminho para você!</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">O que você busca nos próximos 6–12 meses?</p>
          <div className="grid grid-cols-1 gap-2">
            {objectives.map((o) => (
              <SelectCard key={o} label={o} selected={data.objetivo === o} onClick={() => onChange("objetivo", o)} />
            ))}
          </div>
          {errors.objetivo && <p className="text-xs text-destructive shake">{errors.objetivo}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Sua situação em relação a vistos ou imigração?</p>
          <div className="grid grid-cols-1 gap-2">
            {visaStatus.map((v) => (
              <SelectCard key={v} label={v} selected={data.status_visto === v} onClick={() => onChange("status_visto", v)} />
            ))}
          </div>
          {errors.status_visto && <p className="text-xs text-destructive shake">{errors.status_visto}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Quando imagina começar movimentos concretos?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {timeline.map((t) => (
              <SelectCard key={t} label={t} selected={data.prazo_movimento === t} onClick={() => onChange("prazo_movimento", t)} />
            ))}
          </div>
          {errors.prazo_movimento && <p className="text-xs text-destructive shake">{errors.prazo_movimento}</p>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Você pensa em ir para os EUA:</p>
          <div className="grid grid-cols-2 gap-2">
            {family.map((f) => (
              <SelectCard key={f} label={f} selected={data.composicao_familiar === f} onClick={() => onChange("composicao_familiar", f)} />
            ))}
          </div>
          {errors.composicao_familiar && <p className="text-xs text-destructive shake">{errors.composicao_familiar}</p>}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Excelente! Faltam apenas 3 perguntas para sua análise completa
      </p>
    </div>
  );
};

export default Step3Objectives;
