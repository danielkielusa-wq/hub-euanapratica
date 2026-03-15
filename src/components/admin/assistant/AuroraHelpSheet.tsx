import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Sparkles, Database, Shield, Bell, BarChart3, MessageSquare, Search, Zap, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ── Help Content ──────────────────────────────────────────────

interface HelpCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  sections: {
    title: string;
    content: string;
    examples?: string[];
    tip?: string;
  }[];
}

const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    icon: <Sparkles className="h-4 w-4 text-amber-500" />,
    title: 'Primeiros Passos',
    description: 'O que é a Aurora e como começar a usar',
    sections: [
      {
        title: 'O que é a Aurora?',
        content:
          'Aurora é a assistente IA administrativa do Hub. Ela tem acesso em tempo real a todos os dados da plataforma — leads, assinaturas, custos de API, agendamentos, créditos, WhatsApp e mais. Diferente de um chatbot genérico, a Aurora consulta os dados reais do banco de dados para responder suas perguntas.',
      },
      {
        title: 'Como iniciar uma conversa',
        content:
          'Clique no botão dourado flutuante no canto inferior direito de qualquer página admin. A Aurora abrirá em um painel lateral. Digite sua pergunta ou clique em uma das sugestões contextuais.',
        tip: 'As sugestões mudam conforme a página em que você está. Na página de custos, por exemplo, verá sugestões sobre custos de API.',
      },
      {
        title: 'Histórico de conversas',
        content:
          'Todas as conversas são salvas automaticamente. Clique em "Conversas" no cabeçalho do chat para ver o histórico e retomar conversas anteriores. Você também pode criar uma nova conversa ou deletar conversas antigas.',
      },
    ],
  },
  {
    id: 'data-queries',
    icon: <Database className="h-4 w-4 text-blue-500" />,
    title: 'Consultas de Dados',
    description: '15 ferramentas de consulta em tempo real',
    sections: [
      {
        title: 'Leads e Diagnósticos',
        content:
          'Consulte quantos leads entraram por período (hoje, 7 dias, 30 dias, 90 dias), com distribuição por status de processamento (pending, processing, completed, error).',
        examples: [
          'Quantos leads entraram hoje?',
          'Leads dos últimos 30 dias por status',
          'Quantos diagnósticos foram completados esta semana?',
        ],
      },
      {
        title: 'Custos de API',
        content:
          'Analise gastos com API (LLM) por período, agrupados por edge function e provider (OpenAI, Anthropic, OpenRouter). Inclui total em USD, contagem de requests e distribuição de tokens.',
        examples: [
          'Qual o custo total de API nos últimos 7 dias?',
          'Qual função está mais cara este mês?',
          'Compare custos de hoje com a semana passada',
        ],
      },
      {
        title: 'Assinaturas',
        content:
          'Veja estatísticas de assinaturas: contagem por status (active, inactive, cancelled) e por plano (basic, pro, vip). Não requer período — mostra sempre o estado atual.',
        examples: [
          'Quantos assinantes ativos por plano?',
          'Distribuição de assinaturas',
          'Quantos assinantes VIP temos?',
        ],
      },
      {
        title: 'Agendamentos',
        content:
          'Consulte bookings por período com distribuição por status: confirmed, completed, cancelled, no_show, rescheduled.',
        examples: [
          'Quantos agendamentos essa semana?',
          'Taxa de no-show nos últimos 30 dias',
          'Bookings cancelados ontem',
        ],
      },
      {
        title: 'Buscar Usuário',
        content:
          'Busque qualquer usuário por email (exato) ou nome (parcial). Retorna perfil completo, plano, assinatura, role e uso de créditos no mês.',
        examples: [
          'Buscar usuário joao@email.com',
          'Informações do assinante Maria Silva',
        ],
      },
      {
        title: 'Erros Recentes',
        content:
          'Liste erros de API recentes das Edge Functions. Pode filtrar por nome da função. Útil para diagnosticar problemas rapidamente.',
        examples: [
          'Quais erros recentes nas Edge Functions?',
          'Erros do format-lead-report',
          'Tem algum erro acontecendo agora?',
        ],
      },
      {
        title: 'Uso de Créditos',
        content:
          'Consulte o consumo de créditos unificados por período, agrupado por app (curriculo_usa, title_translator, prime_jobs).',
        examples: [
          'Uso de créditos este mês',
          'Qual app consome mais créditos?',
        ],
      },
      {
        title: 'WhatsApp',
        content:
          'Estatísticas dos fluxos de WhatsApp: sessões por status, total de mensagens enviadas e recebidas.',
        examples: [
          'Quantas sessões WhatsApp ativas?',
          'Mensagens enviadas vs recebidas',
        ],
      },
      {
        title: 'Campanhas de Email',
        content:
          'Estatísticas de campanhas: contagem por status, total enviado, taxa de falha, e detalhes das campanhas recentes.',
        examples: [
          'Estatísticas de campanhas de email',
          'Qual a taxa de falha nos emails?',
        ],
      },
      {
        title: 'Visão Geral da Plataforma',
        content:
          'Panorama completo: total de usuários, assinantes ativos por plano, leads do dia/mês, bookings da semana, créditos e custos do mês. Use como ponto de partida.',
        examples: [
          'Visão geral da plataforma',
          'Como está o Hub hoje?',
          'Resumo geral do sistema',
        ],
      },
      {
        title: 'Detalhes de Lead',
        content:
          'Busque um lead por nome, email ou telefone e veja o perfil completo: dados demográficos, scores (readiness, fit, priority), barreiras, forças, rota/fase, produto recomendado, origem (UTM) e se tem conta vinculada.',
        examples: [
          'Buscar lead João Silva',
          'Detalhes do lead joao@email.com',
          'Dados do lead com telefone 11999998888',
        ],
      },
      {
        title: 'Interações do Lead',
        content:
          'Histórico completo de interações com um lead: WhatsApp, emails, ligações, notas e mudanças de status. Também mostra tasks pendentes, urgentes e concluídas.',
        examples: [
          'Quais interações tivemos com o João?',
          'Histórico de contato do lead Maria',
          'Tasks pendentes do lead fulano@email.com',
        ],
      },
      {
        title: 'Análise Qualitativa do Lead',
        content:
          'Análise cruzada profunda: combina diagnóstico, engajamento, WhatsApp, conversão e recomendações para explicar POR QUE um lead é quente ou frio. Inclui fatores de temperatura, ratio de resposta, dias sem contato e próximo passo ideal.',
        examples: [
          'Por que o João é quente?',
          'Qual o potencial da lead Maria?',
          'Por que esse lead está frio?',
          'Qual o próximo passo com o lead X?',
        ],
        tip: 'A Aurora combina dados de 7 tabelas para gerar os "fatores de temperatura" — a explicação concreta de por que o lead tem aquela classificação.',
      },
    ],
  },
  {
    id: 'ideas-kanban',
    icon: <Lightbulb className="h-4 w-4 text-yellow-500" />,
    title: 'Kanban de Ideias',
    description: 'Explore, discuta e priorize ideias de negócio',
    sections: [
      {
        title: 'Listar e Filtrar Ideias',
        content:
          'Liste ideias do kanban com filtros por status (spark, qualified, validated, designed, active, parked), tag (SaaS, AI/ML, B2B, etc.) ou busca por nome. Veja health% (completude) e distribuição por coluna.',
        examples: [
          'Quais ideias estão no kanban?',
          'Ideias com tag SaaS',
          'Quais ideias estão no spark?',
          'Ideias com maior interest score',
        ],
      },
      {
        title: 'Analisar uma Ideia',
        content:
          'Veja todos os campos de uma ideia: core (problema, persona), qualificação (mercado, competição, vantagem), validação (método, sinais, objeções) e design (pricing, MVP, métrica chave). Inclui lista de gaps — campos que deveriam estar preenchidos.',
        examples: [
          'Detalhe a ideia X',
          'O que falta preencher na ideia Y?',
          'Analise a ideia de marketplace',
        ],
      },
      {
        title: 'Priorização e Discussão',
        content:
          'Peça à Aurora para comparar ideias, sugerir priorização, identificar a mais promissora ou ajudar a qualificar/validar uma ideia preenchendo os gaps.',
        examples: [
          'Qual ideia devo priorizar?',
          'Compare as ideias SaaS vs LeadGen',
          'Ajude a qualificar essa ideia',
          'Quais ideias têm mais potencial de receita?',
        ],
        tip: 'A Aurora analisa interest_score, health%, market_size, competition e gaps para fundamentar recomendações de priorização.',
      },
    ],
  },
  {
    id: 'funnel-analysis',
    icon: <BarChart3 className="h-4 w-4 text-purple-500" />,
    title: 'Análise de Funil',
    description: 'Conversão, comparação de períodos e churn',
    sections: [
      {
        title: 'Funil de Conversão',
        content:
          'Analise o funil completo: diagnóstico → cadastro → assinatura ativa. Mostra taxas de conversão entre cada etapa por período (7d, 30d, 90d).',
        examples: [
          'Qual a taxa de conversão do funil?',
          'Funil de conversão dos últimos 30 dias',
          'Quantos leads viraram assinantes?',
        ],
      },
      {
        title: 'Comparação de Períodos',
        content:
          'Compare qualquer métrica entre dois períodos para identificar tendências. Métricas disponíveis: leads, api_costs, errors, bookings, signups, cancellations, credits. Períodos: last_7d vs 7d_ago, last_14d vs 14d_ago, last_30d vs 30d_ago.',
        examples: [
          'Compare leads desta semana com a anterior',
          'Custos de API: últimos 7 dias vs 7 dias anteriores',
          'Erros aumentaram ou diminuíram?',
        ],
      },
      {
        title: 'Análise de Churn',
        content:
          'Entenda os cancelamentos: total, taxa de churn, distribuição por plano e tendência diária. Útil para identificar padrões de cancelamento.',
        examples: [
          'Análise de churn dos últimos 30 dias',
          'Qual plano tem mais cancelamentos?',
          'Taxa de cancelamento está subindo?',
        ],
      },
      {
        title: 'Performance de Email',
        content:
          'Avalie a eficácia das comunicações: taxas de envio e falha por template, campanhas recentes, e status de automações de drip.',
        examples: [
          'Performance dos emails',
          'Qual template tem mais falha?',
          'Status das automações de drip',
        ],
      },
    ],
  },
  {
    id: 'actions',
    icon: <Zap className="h-4 w-4 text-orange-500" />,
    title: 'Ações (com confirmação)',
    description: '5 ações que a Aurora pode executar',
    sections: [
      {
        title: 'Como funcionam as ações',
        content:
          'A Aurora pode executar ações administrativas, mas SEMPRE pede confirmação antes. Quando ela identifica que uma ação é necessária, aparece um card amarelo com os detalhes. Clique "Confirmar" para executar ou "Cancelar" para abortar. Nenhuma ação é executada sem sua aprovação explícita.',
        tip: 'Todas as ações são auditáveis e registradas no histórico da conversa.',
      },
      {
        title: 'Enviar Email',
        content:
          'Envia um email usando um dos templates cadastrados. Especifique o template e o destinatário.',
        examples: [
          'Envie o email de boas-vindas para joao@email.com',
          'Mande o template drip_report_d0 para maria@email.com',
        ],
      },
      {
        title: 'Cancelar Assinatura',
        content:
          'Cancela a assinatura ativa de um usuário específico. Você precisa informar o email.',
        examples: [
          'Cancele a assinatura de fulano@email.com',
        ],
      },
      {
        title: 'Pausar Batch WhatsApp',
        content:
          'Pausa um batch job de envio de WhatsApp que esteja em andamento. Útil em emergências.',
        examples: [
          'Pause o batch de WhatsApp em andamento',
        ],
      },
      {
        title: 'Reenviar Welcome Email',
        content:
          'Reenvia o email de boas-vindas para um usuário que talvez não tenha recebido.',
        examples: [
          'Reenvie o email de boas-vindas para joao@email.com',
        ],
      },
      {
        title: 'Ligar/Desligar Automação N8N',
        content:
          'Ativa ou desativa uma automação N8N cadastrada.',
        examples: [
          'Desative a automação de lead scoring',
          'Ative a automação subscription_lifecycle',
        ],
      },
    ],
  },
  {
    id: 'alerts',
    icon: <Bell className="h-4 w-4 text-red-500" />,
    title: 'Alertas Proativos',
    description: 'Monitoramento automático a cada 15 minutos',
    sections: [
      {
        title: 'Como funcionam os alertas',
        content:
          'A cada 15 minutos, o sistema monitora 4 indicadores e gera alertas automáticos se detectar anomalias. Os alertas aparecem no topo do chat da Aurora e no badge vermelho do botão flutuante.',
      },
      {
        title: 'Tipos de alerta',
        content:
          '• Custo de API elevado — Custo dos últimos 15min > 3x a média dos 7 dias\n• Taxa de erros alta — Mais de 5 erros nos últimos 15min E acima de 2x a média\n• Zero leads (horário comercial) — Nenhum lead nas últimas 2h quando a média é > 2/h\n• Pico de cancelamentos — Cancelamentos do dia > 2x a média diária dos 7 dias',
      },
      {
        title: 'Reconhecer alertas',
        content:
          'Clique "Reconhecer" para marcar o alerta como visto. Isso remove o alerta do feed e reduz o contador no badge. Clique "Perguntar" para pedir à Aurora mais detalhes sobre o que está acontecendo.',
      },
      {
        title: 'Resumo Diário',
        content:
          'Todo dia às 8h (BRT), a Aurora gera um resumo completo do dia anterior e salva como conversa especial. Inclui: leads, conversões, custos, erros, agendamentos, créditos e alertas pendentes. Acesse pelo histórico de conversas.',
      },
    ],
  },
  {
    id: 'context',
    icon: <Search className="h-4 w-4 text-green-500" />,
    title: 'Contexto por Página',
    description: 'Sugestões inteligentes baseadas na sua localização',
    sections: [
      {
        title: 'Como funciona',
        content:
          'A Aurora sabe em qual página admin você está e adapta as sugestões de perguntas. Além disso, essa informação é enviada ao LLM para que as respostas sejam mais relevantes ao contexto.',
      },
      {
        title: 'Páginas com sugestões personalizadas',
        content:
          '• /admin/custos-api — Custos, funções mais caras, erros\n• /admin/leads-dashboard — Leads, diagnósticos, status\n• /admin/assinantes — Assinantes, planos, cancelamentos\n• /admin/agendamentos — Bookings, no-shows, cancelados\n• /admin/whatsapp-flows — Sessões, mensagens, erros\n• /admin/email-templates — Campanhas, taxas de envio\n• /admin/automacoes — N8N, webhooks, status\n• /admin/usuarios — Busca de usuários\n• /admin/planos — Distribuição de planos, créditos\n• /admin/relatorios — Diagnósticos, processamento\n• /admin/system-health — Erros, custos, status\n• /admin/analytics — Visão geral, funil, tendências',
      },
    ],
  },
  {
    id: 'tips',
    icon: <MessageSquare className="h-4 w-4 text-cyan-500" />,
    title: 'Dicas e Boas Práticas',
    description: 'Aproveite ao máximo a Aurora',
    sections: [
      {
        title: 'Seja específico',
        content:
          'Quanto mais específica a pergunta, melhor a resposta. Em vez de "como estão as coisas?", pergunte "quantos leads entraram nos últimos 7 dias comparado com a semana anterior?".',
      },
      {
        title: 'Use períodos',
        content:
          'A maioria das ferramentas aceita períodos: today (hoje), 7d (7 dias), 30d (30 dias), 90d (90 dias). Especifique o período para dados mais relevantes.',
      },
      {
        title: 'Combine perguntas',
        content:
          'Você pode fazer perguntas complexas. A Aurora vai usar múltiplas ferramentas se necessário. Exemplo: "Qual foi o custo de API nos últimos 7 dias e quantos erros tivemos?".',
      },
      {
        title: 'Streaming em tempo real',
        content:
          'As respostas aparecem em tempo real conforme o LLM gera o texto. Você verá blocos de "Consultando..." quando a Aurora está buscando dados, seguidos da resposta completa.',
      },
      {
        title: 'Botão de parar',
        content:
          'Se a Aurora estiver demorando ou a resposta já for suficiente, clique no botão vermelho (quadrado) para interromper a geração.',
      },
      {
        title: 'Perguntas de follow-up',
        content:
          'A Aurora mantém o contexto da conversa. Você pode fazer perguntas de follow-up sem repetir o contexto. Exemplo: "E por plano?" após perguntar sobre assinantes.',
      },
    ],
  },
];

// ── Collapsible Category Component ───────────────────────────

function HelpCategorySection({ category }: { category: HelpCategory }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="shrink-0">{category.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{category.title}</p>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-4 border-t pt-3">
          {category.sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold mb-1">{section.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
              {section.examples && section.examples.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Exemplos:</p>
                  {section.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="text-xs bg-muted/60 rounded-md px-2.5 py-1.5 text-foreground/80 italic"
                    >
                      "{ex}"
                    </div>
                  ))}
                </div>
              )}
              {section.tip && (
                <p className="text-[10px] mt-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1">
                  💡 {section.tip}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

export function AuroraHelpSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7 px-2"
          title="Ajuda da Aurora"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <span className="block">Aurora — Guia de Uso</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Tudo que você pode fazer com a assistente IA
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {HELP_CATEGORIES.map((category) => (
              <HelpCategorySection key={category.id} category={category} />
            ))}

            {/* Quick reference footer */}
            <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-dashed">
              <p className="text-xs font-medium mb-2">Referência Rápida</p>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-muted-foreground">
                <span>📊 19 ferramentas de consulta</span>
                <span>⚡ 5 ações com confirmação</span>
                <span>🔔 4 tipos de alerta proativo</span>
                <span>📋 Resumo diário às 8h</span>
                <span>💬 Histórico persistente</span>
                <span>🎯 Sugestões por página</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
