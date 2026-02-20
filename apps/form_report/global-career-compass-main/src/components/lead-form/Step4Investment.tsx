import { LeadFormData } from "./types";
import SelectCard from "./SelectCard";
import { Lock } from "lucide-react";

interface Step4Props {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}

const investments = [
  "Até R$500",
  "De R$500 a R$2.000",
  "De R$2.000 a R$5.000",
  "Acima de R$5.000",
  "Prefiro não responder",
];

const Step4Investment = ({ data, onChange, errors }: Step4Props) => {
  return (
    <div className="space-y-6 fade-in-scale">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-primary">Quase lá!</p>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Investimento e Preparação</h2>
        <p className="text-muted-foreground text-sm">
          Essa informação nos ajuda a recomendar o melhor programa para você.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Qual faixa de investimento você estaria disposto(a) a fazer para acelerar sua carreira internacional?
        </p>
        <div className="grid grid-cols-1 gap-2">
          {investments.map((inv) => (
            <SelectCard
              key={inv}
              label={inv}
              selected={data.faixa_investimento === inv}
              onClick={() => onChange("faixa_investimento", inv)}
            />
          ))}
        </div>
        {errors.faixa_investimento && (
          <p className="text-xs text-destructive shake">{errors.faixa_investimento}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Suas informações são 100% confidenciais</span>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Incrível! Só mais 2 etapas para completar
      </p>
    </div>
  );
};

export default Step4Investment;
