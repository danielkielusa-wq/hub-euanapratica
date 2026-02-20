import { LeadFormData } from "./types";
import SelectCard from "./SelectCard";

interface Step2Props {
  data: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  errors: Record<string, string>;
}

const areas = [
  "Tecnologia",
  "Engenharia",
  "Negócios / Administração",
  "Marketing / Comunicação",
  "Saúde",
  "Estudante",
  "Outro",
];

const experience = [
  "Menos de 2 anos",
  "2 a 5 anos",
  "5 a 10 anos",
  "Mais de 10 anos",
];

const english = [
  "Básico",
  "Intermediário",
  "Avançado",
  "Fluente",
];

const Step2Professional = ({ data, onChange, errors }: Step2Props) => {
  return (
    <div className="space-y-6 fade-in-scale">
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Perfil Profissional</h2>
        <p className="text-muted-foreground text-sm">Queremos entender melhor sua trajetória!</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Qual sua área atual de atuação?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {areas.map((a) => (
              <SelectCard
                key={a}
                label={a}
                selected={data.area_profissional === a}
                onClick={() => onChange("area_profissional", a)}
              />
            ))}
          </div>
          {errors.area_profissional && (
            <p className="text-xs text-destructive shake">{errors.area_profissional}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Quantos anos de experiência você tem?</p>
          <div className="grid grid-cols-2 gap-2">
            {experience.map((e) => (
              <SelectCard
                key={e}
                label={e}
                selected={data.anos_experiencia === e}
                onClick={() => onChange("anos_experiencia", e)}
              />
            ))}
          </div>
          {errors.anos_experiencia && (
            <p className="text-xs text-destructive shake">{errors.anos_experiencia}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Qual seu nível de inglês?</p>
          <div className="grid grid-cols-2 gap-2">
            {english.map((e) => (
              <SelectCard
                key={e}
                label={e}
                selected={data.nivel_ingles === e}
                onClick={() => onChange("nivel_ingles", e)}
              />
            ))}
          </div>
          {errors.nivel_ingles && (
            <p className="text-xs text-destructive shake">{errors.nivel_ingles}</p>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Ótimo começo! Continue para descobrir suas melhores oportunidades
      </p>
    </div>
  );
};

export default Step2Professional;
