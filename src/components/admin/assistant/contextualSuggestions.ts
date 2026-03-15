/**
 * Contextual suggestions for Aurora based on the current admin page.
 * Falls back to generic suggestions if no specific mapping exists.
 */

const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  '/admin/custos-api': [
    'Qual função está mais cara este mês?',
    'Compare custos de hoje com a semana passada',
    'Quantos erros de API hoje?',
    'Qual o custo total do mês?',
  ],
  '/admin/leads-dashboard': [
    'Quantos leads entraram hoje?',
    'Qual a distribuição de leads por status?',
    'Por que o lead X é quente?',
    'Quais leads têm maior potencial?',
  ],
  '/admin/leads/': [
    'Por que esse lead é quente/frio?',
    'Quais interações tivemos com esse lead?',
    'Qual o próximo passo ideal com esse lead?',
    'Qual o potencial desse lead?',
  ],
  '/admin/assinantes': [
    'Quantos assinantes ativos por plano?',
    'Taxa de cancelamento nos últimos 30 dias',
    'Visão geral das assinaturas',
    'Buscar assinante por email',
  ],
  '/admin/subscriptions': [
    'Quantos assinantes ativos por plano?',
    'Qual o plano mais popular?',
    'Assinaturas canceladas no último mês',
  ],
  '/admin/agendamentos': [
    'Quantos agendamentos essa semana?',
    'Taxa de no-show nos últimos 30 dias',
    'Bookings por status essa semana',
    'Quantos foram cancelados?',
  ],
  '/admin/configuracoes-apis': [
    'Quais APIs estão configuradas?',
    'Qual API tem fallback?',
    'Erros recentes por provider',
  ],
  '/admin/email-templates': [
    'Quantas campanhas de email foram enviadas?',
    'Taxa de falha nas campanhas',
    'Estatísticas de campanhas recentes',
  ],
  '/admin/email-campaigns': [
    'Estatísticas de campanhas de email',
    'Quantos emails foram enviados no total?',
    'Qual a taxa de falha?',
  ],
  '/admin/automacoes': [
    'Quais automações N8N estão ativas?',
    'Erros recentes nas automações',
    'Estatísticas de WhatsApp flows',
  ],
  '/admin/whatsapp-flows': [
    'Estatísticas de fluxos WhatsApp',
    'Quantas sessões ativas agora?',
    'Taxa de erro nos fluxos',
    'Mensagens enviadas vs recebidas',
  ],
  '/admin/usuarios': [
    'Buscar usuário por email ou nome',
    'Quantos usuários na plataforma?',
    'Visão geral da plataforma',
  ],
  '/admin/planos': [
    'Distribuição de assinantes por plano',
    'Uso de créditos este mês por app',
    'Quantos créditos foram consumidos?',
  ],
  '/admin/prime-jobs': [
    'Uso de créditos do Prime Jobs',
    'Quantas aplicações esse mês?',
  ],
  '/admin/idea-kanban': [
    'Quais ideias estão no kanban?',
    'Qual ideia devo priorizar?',
    'O que falta preencher nas ideias qualified?',
    'Compare as ideias com maior potencial',
  ],
  '/admin/relatorios': [
    'Quantos diagnósticos hoje?',
    'Leads por status de processamento',
    'Taxa de relatórios completados',
  ],
  '/admin/system-health': [
    'Erros recentes nas Edge Functions',
    'Custos de API hoje',
    'Visão geral do sistema',
  ],
  '/admin/cron-jobs': [
    'Status dos cron jobs',
    'Erros recentes nos cron jobs',
  ],
  '/admin/analytics': [
    'Visão geral da plataforma',
    'Qual a taxa de conversão do funil?',
    'Compare leads desta semana com a anterior',
    'Análise de churn nos últimos 30 dias',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Qual a visão geral da plataforma hoje?',
  'Quantos leads entraram essa semana?',
  'Qual o custo de API nos últimos 7 dias?',
  'Quais erros recentes nas Edge Functions?',
];

export function getContextualSuggestions(pathname: string): string[] {
  // Try exact match first
  if (ROUTE_SUGGESTIONS[pathname]) {
    return ROUTE_SUGGESTIONS[pathname];
  }

  // Try partial match (e.g., /admin/leads-dashboard/123 → /admin/leads-dashboard)
  for (const [route, suggestions] of Object.entries(ROUTE_SUGGESTIONS)) {
    if (pathname.startsWith(route)) {
      return suggestions;
    }
  }

  return DEFAULT_SUGGESTIONS;
}
