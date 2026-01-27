import { AlertTriangle } from 'lucide-react';

interface CriticalAlertProps {
  message?: string;
}

export function CriticalAlert({ message }: CriticalAlertProps) {
  return (
    <div className="bg-destructive/10 border-2 border-destructive/30 rounded-[24px] p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-destructive/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-destructive">
            Alerta Crítico: Formato ATS
          </h3>
          <p className="text-sm text-destructive/80">
            {message || "O formato do seu currículo parece corrompido ou inválido, o que resultará em falha em 100% dos sistemas ATS."}
          </p>
          <p className="text-sm font-medium text-destructive/90">
            Recomendação: Salve seu currículo como PDF simples e tente novamente.
          </p>
        </div>
      </div>
    </div>
  );
}
