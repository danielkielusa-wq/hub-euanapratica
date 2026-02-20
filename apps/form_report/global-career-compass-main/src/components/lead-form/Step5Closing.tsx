import { LeadFormData } from "./types";
import SelectCard from "./SelectCard";

interface Step5Props {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}

const obstacles = [
  "Nenhum – estou pronto(a)",
  "Financeiro",
  "Tempo / rotina",
  "Inglês",
  "Medo de tomar uma decisão errada",
  "Falta de apoio do cônjuge / família",
  "Outro",
];

const Step5Closing = ({ data, onChange, errors }: Step5Props) => {
  return (
    <div className="space-y-6 fade-in-scale">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-primary">Última etapa!</p>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Quase terminando!</h2>
        <p className="text-muted-foreground text-sm">Só precisamos entender melhor seus desafios.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">
          Se você for selecionado para algum programa, qual seria hoje seu principal obstáculo para começar?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {obstacles.map((o) => (
            <SelectCard
              key={o}
              label={o}
              selected={data.principal_obstaculo === o}
              onClick={() => onChange("principal_obstaculo", o)}
            />
          ))}
        </div>
        {errors.principal_obstaculo && (
          <p className="text-xs text-destructive shake">{errors.principal_obstaculo}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Conte em uma frase qual é sua maior dúvida ou preocupação hoje
          <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
        </label>
        <textarea
          value={data.maior_duvida}
          onChange={(e) => onChange("maior_duvida", e.target.value)}
          placeholder="Ex: Tenho receio de não conseguir validar meu diploma..."
          rows={3}
          maxLength={500}
          className="input-field resize-none"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Você chegou até aqui! Clique abaixo para finalizar sua análise
      </p>
    </div>
  );
};

export default Step5Closing;
