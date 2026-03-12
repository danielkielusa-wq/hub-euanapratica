import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { LineChart, Database, CheckCircle2 } from "lucide-react";

export function BottomSections() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">Comparativo Semanal</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Pipeline sofreu contração significativa: 35 novos leads esta semana vs 47 anterior (-26%). Qualidade mantém-se em 6 leads quentes/muito-quentes, mesma base anterior, mas conversão pipeline→agendamentos permanece ZERO em ambas semanas — indicador crítico. Fonte Instagram Reels permanece dominante (16 leads vs 13 anterior) mas volume total caiu. Agendamentos: zero criados ambas semanas, zero no-shows, indicando gargalo de fechamento, não de qualificação. Receita: 0 novos pedidos e 0 cancelamentos esta semana vs 2 novas assinaturas semana anterior — queda abrupta sugere problema tático em vendas, não em produto.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-lg">Métricas Brutas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {["Saúde das Tarefas", "Métricas de Funil", "Pipeline de Leads", "Atividade de Agendamentos", "Sinais de Engajamento", "Assinaturas e Receita", "Leads Quentes sem Follow-up", "Oportunidades de Re-engajamento"].map((metric, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-slate-700">{metric}</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
            <CardTitle className="text-lg">Aprovação para Assistente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-slate-900">Aprovar este relatório para a assistente</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Diretivas para a assistente (opcional)</label>
            <textarea 
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24"
              placeholder="Ex: Foque nos leads quentes desta semana. Priorize follow-ups com Maria e João..."
            ></textarea>
          </div>
          <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Salvar Aprovação
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
