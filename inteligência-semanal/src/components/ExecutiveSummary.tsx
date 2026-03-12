import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Info } from "lucide-react";

export function ExecutiveSummary() {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-lg">Resumo Executivo</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-xl leading-none">📉</span>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-semibold">Pipeline em queda:</strong> 35 novos leads esta semana vs 47 na anterior (-25%), mas qualidade mantida com 6 leads muito-quentes/quentes prontos para conversão.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl leading-none">🔥</span>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-semibold">6 leads quentes sem followup recente</strong> incluindo Daniel Kiel (daniel.kiel@sap.com) com score 100 — SAP/ERP muito-quente aguardando reposicionamento de currículo americano.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl leading-none">📊</span>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-semibold">Funil travado:</strong> zero agendamentos criados esta semana apesar de 35 leads gerando relatórios — gargalo entre relatório e marcação de mentorias.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl leading-none">⚠️</span>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-semibold">17 tarefas vencidas acumuladas</strong> (11 high-priority) bloqueando ações de vendas — revisão urgente de fluxo operacional.
            </p>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-xl leading-none">🔔</span>
            <p className="text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-semibold">3 assinaturas ativas</strong> (2 VIP, 1 Pro) mas sem novas conversões esta semana — dependência crítica em agendamentos parados.
            </p>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
