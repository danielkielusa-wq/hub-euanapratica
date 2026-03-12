import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { TrendingUp, AlertTriangle } from "lucide-react";

const opportunities = [
  {
    priority: "high",
    title: "Converter zero agendamentos em vendas",
    desc: "Esta semana: 35 leads geraram relatórios mas ZERO agendamentos criados (mesmo padrão na semana anterior). Gargalo entre visualização de relatório e marcação de mentorias. Daniel Kiel e Daniel Perfil estão dispostos — precisam de toque de fechamento direto.",
    action: "Assistente: envie mensagem WhatsApp personalizada para Daniel Kiel (daniel.kiel@sap.com) este fim de semana oferecendo slot de 30min para 'análise rápida de reposicionamento de currículo SAP'. Mesmo script para Daniel Perfil Mentoria (daniel@perfilmentorado.com) pela noite. Meça conversão em 48h."
  },
  {
    priority: "high",
    title: "Reengajar 15 leads com acesso recente ao relatório",
    desc: "15 leads acessaram relatório entre 06-11/03 (sinais de interesse ativo). Rogério Soares visualizou 3x, Frédney 3x — demonstram persistência. Nenhum agendou. Oportunidade de reengajamento de baixo custo com follow-up contextualizado.",
    action: "Enviar fluxo WhatsApp para top 5 por frequência de acesso (Rogério, Frédney, etc) com: 'Vi que você voltou ao relatório 3x — quer conversar sobre qual caminho faz mais sentido pra sua carreira?' Teste conversão via mentoria em grupo (mais acessível que individual)."
  },
  {
    priority: "medium",
    title: "Capturar demanda VIP de Gestão/Executivos",
    desc: "Fernanda Costa (teste-vip@euanapratica.com) é lead VIP em Gestão (score 98, nenhuma barreira) criada há 9 dias sem interação. Categoria diferente do pipeline IT-pesado — oportunidade de diversificar receita.",
    action: "Abordagem executiva: proposta de Mentoria Executiva ENP VIP com case de impacto em posicionamento internacional para gestores. Contato por email profissional ou LinkedIn antes de WhatsApp."
  },
  {
    priority: "high",
    title: "Limpar backlog de 17 tarefas vencidas",
    desc: "11 tarefas high-priority vencidas travando pipeline operacional. Vitor Domingos tem 2 tarefas vencidas (lead novo, 0 dias). Impossível acelerar vendas com tarefas pendentes.",
    action: "Dona: revisar fila de tarefas vencidas hoje. Redistribuir ou cancelar não-essenciais. Implementar daily standup de 15min focado em high-priority. Desbloquear assistente para vendas, não operacional."
  },
  {
    priority: "medium",
    title: "Analisar queda de 25% em pipeline semanal",
    desc: "Leads novos: 35 esta semana vs 47 anterior (-12 leads, -25%). Instagram Reels continua top source (16 leads) mas volume geral caiu. Pode indicar redução em investimento de ads, sazonalidade ou problema de direcionamento.",
    action: "Dona: revisar gasto em Instagram/Facebook da última semana. Se reduziu, realinhar orçamento. Se manteve, testar novo criativo ou público. Comparar CPL com semanas anteriores para diagnosticar eficiência."
  }
];

const alerts = [
  {
    severity: "critical",
    title: "Zero conversões pipeline→agendamentos (2 semanas)",
    desc: "47 leads semana passada + 35 esta semana = 82 leads com relatórios. Agendamentos criados: 0. Fórmula quebrada. Com 3 assinaturas ativas mas zero novas, receita está em risco se não fechar deals."
  },
  {
    severity: "critical",
    title: "17 tarefas vencidas bloqueando operações",
    desc: "11 high-priority vencidas, 2 urgent. Vitor Domingos (novo lead hoje) já tem 2 tarefas vencidas. Sistema de CRM desorganizado está sabotando vendas. Assistente de vendas não consegue focar em fechar."
  },
  {
    severity: "warning",
    title: "Pipeline em queda: -25% em leads novos",
    desc: "47 leads semana passada para 35 esta semana. Tendência negativa. Instagram continua dominando (16 leads) mas volume geral reduzido. Requer análise de causa raiz em marketing."
  },
  {
    severity: "warning",
    title: "Dependência crítica em 3 assinaturas VIP/Pro",
    desc: "Base de receita muito pequena (2 VIP, 1 Pro). Zero novos pedidos estas 2 semanas. Sem agendamentos funcionando, próxima semana pode ter cancelamentos não planejados. Urgência em converter hot leads em vendas."
  },
  {
    severity: "info",
    title: "Barreiras financeiras/visto em 50% dos hot leads",
    desc: "Marcus Vinicius (marcus_engmec@outlook.com) com barreira financeira/visto. Vitor Domingos (vitorhugodomingos@gmail.com) com barreira inglês/visto. Precisam de posicionamento de valor claro: como mentoria resolve isso?"
  }
];

export function OpportunitiesAndAlerts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <CardTitle className="text-lg">Oportunidades</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {opportunities.map((opp, i) => (
            <div key={i} className="flex gap-4 items-start">
              <Badge variant={opp.priority} className="mt-1 flex-shrink-0">{opp.priority}</Badge>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">{opp.title}</h4>
                <p className="text-sm text-slate-600 mb-2 leading-relaxed">{opp.desc}</p>
                <p className="text-sm text-indigo-600 italic bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">{opp.action}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-lg">Alertas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {alerts.map((alert, i) => (
            <div key={i} className="flex gap-4 items-start">
              <Badge variant={alert.severity} className="mt-1 flex-shrink-0">{alert.severity}</Badge>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">{alert.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{alert.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
