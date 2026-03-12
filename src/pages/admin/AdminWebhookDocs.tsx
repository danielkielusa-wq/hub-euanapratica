import { useState, useMemo } from 'react';
import {
  Search, Webhook, Copy, CheckCircle2, ChevronDown, ChevronRight,
  Zap, CreditCard, FileText, MessageSquare, ShoppingCart, BarChart3,
  Brain, Users, ExternalLink, CalendarCheck, Video, Package,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';

// ── Webhook Event Catalog ────────────────────────────────────────────

interface WebhookField {
  name: string;
  type: string;
  description: string;
  nullable?: boolean;
}

interface WebhookEvent {
  event: string;
  category: 'report' | 'subscription' | 'lead' | 'notification' | 'campaign' | 'analytics' | 'intelligence' | 'booking' | 'live' | 'order';
  origin: string;
  trigger: string;
  description: string;
  fields: WebhookField[];
  example: Record<string, unknown>;
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  {
    event: 'report.generated',
    category: 'report',
    origin: 'dispatch-report-webhook',
    trigger: 'PG trigger quando career_evaluations.processing_status = "completed"',
    description: 'Disparado quando um relatorio de diagnostico de carreira e gerado com sucesso. Contem todos os dados do lead, respostas do formulario, score, temperatura e recomendacao de produto.',
    fields: [
      { name: 'lead_id', type: 'uuid', description: 'ID do career_evaluation (nao e o user_id)' },
      { name: 'lead_name', type: 'string', description: 'Nome do lead' },
      { name: 'lead_email', type: 'string', description: 'Email do lead' },
      { name: 'lead_phone', type: 'string', description: 'WhatsApp do lead', nullable: true },
      { name: 'access_token', type: 'string', description: 'Token unico para acessar o relatorio' },
      { name: 'report_link', type: 'string', description: 'URL completa do relatorio publico' },
      { name: 'area', type: 'string', description: 'Area de atuacao', nullable: true },
      { name: 'atuacao', type: 'string', description: 'Tipo de atuacao profissional', nullable: true },
      { name: 'experiencia', type: 'string', description: 'Nivel de experiencia', nullable: true },
      { name: 'english_level', type: 'string', description: 'Nivel de ingles', nullable: true },
      { name: 'objetivo', type: 'string', description: 'Objetivo principal', nullable: true },
      { name: 'visa_status', type: 'string', description: 'Status do visto', nullable: true },
      { name: 'timeline', type: 'string', description: 'Prazo desejado para mudanca', nullable: true },
      { name: 'family_status', type: 'string', description: 'Situacao familiar', nullable: true },
      { name: 'income_range', type: 'string', description: 'Faixa de renda', nullable: true },
      { name: 'investment_range', type: 'string', description: 'Faixa de investimento disponivel', nullable: true },
      { name: 'impediment', type: 'string', description: 'Principal impedimento', nullable: true },
      { name: 'main_concern', type: 'string', description: 'Principal preocupacao', nullable: true },
      { name: 'readiness_score', type: 'number', description: 'Score de prontidao (0-100)', nullable: true },
      { name: 'lead_temperature', type: 'string', description: 'Temperatura: frio, morno, quente, muito-quente' },
      { name: 'lead_priority_score', type: 'number', description: 'Score de prioridade do lead', nullable: true },
      { name: 'phase_id', type: 'string', description: 'ID da fase na Rota 6.0', nullable: true },
      { name: 'phase_name', type: 'string', description: 'Nome da fase (ex: Exploracao)', nullable: true },
      { name: 'full_diagnosis', type: 'string', description: 'Texto completo do diagnostico', nullable: true },
      { name: 'recommended_product_tier', type: 'string', description: 'Tier recomendado: basic, pro, vip', nullable: true },
      { name: 'is_tech_professional', type: 'boolean', description: 'Se e profissional de tecnologia' },
      { name: 'is_senior_level', type: 'boolean', description: 'Se tem nivel senior+' },
      { name: 'is_high_income', type: 'boolean', description: 'Se tem renda alta' },
      { name: 'primary_product', type: 'string', description: 'Nome do produto primario recomendado', nullable: true },
      { name: 'barriers', type: 'array', description: 'Lista de bloqueadores criticos identificados' },
    ],
    example: {
      event: 'report.generated',
      timestamp: '2026-03-10T14:30:00.000Z',
      source: 'enp_hub_supabase',
      lead_id: 'a1b2c3d4-...',
      lead_name: 'Maria Silva',
      lead_email: 'maria@example.com',
      lead_phone: '+5511999887766',
      access_token: 'abc123xyz',
      report_link: 'https://hub.euanapratica.com/relatorio/abc123xyz',
      area: 'Tecnologia',
      experiencia: '10+ anos',
      english_level: 'Avancado',
      objetivo: 'Trabalhar nos EUA',
      readiness_score: 78,
      lead_temperature: 'quente',
      lead_priority_score: 85,
      phase_id: 'phase_3',
      phase_name: 'Preparacao',
      recommended_product_tier: 'pro',
      is_tech_professional: true,
      is_senior_level: true,
      is_high_income: true,
      primary_product: 'Rota 6.0 Pro',
      barriers: ['visto', 'ingles_tecnico'],
    },
  },
  {
    event: 'report.accessed',
    category: 'report',
    origin: 'handle-report-accessed',
    trigger: 'Lead abre o relatorio pela primeira vez (first_accessed_at era null)',
    description: 'Disparado quando um lead acessa seu relatorio pela primeira vez. Cria automaticamente uma tarefa de follow-up no sistema.',
    fields: [
      { name: 'lead_id', type: 'uuid', description: 'ID do career_evaluation' },
      { name: 'lead_name', type: 'string', description: 'Nome do lead' },
      { name: 'lead_email', type: 'string', description: 'Email do lead' },
      { name: 'lead_phone', type: 'string', description: 'WhatsApp do lead', nullable: true },
      { name: 'access_token', type: 'string', description: 'Token do relatorio' },
      { name: 'report_link', type: 'string', description: 'URL do relatorio' },
      { name: 'first_accessed_at', type: 'timestamptz', description: 'Timestamp do primeiro acesso' },
      { name: 'lead_temperature', type: 'string', description: 'Temperatura do lead' },
      { name: 'lead_priority_score', type: 'number', description: 'Score de prioridade', nullable: true },
      { name: 'task_priority', type: 'string', description: 'Prioridade da tarefa criada: high, medium, low' },
      { name: 'task_due_date', type: 'string', description: 'Data de vencimento da tarefa (ISO date)' },
    ],
    example: {
      event: 'report.accessed',
      timestamp: '2026-03-10T15:00:00.000Z',
      source: 'enp_hub_supabase',
      lead_id: 'a1b2c3d4-...',
      lead_name: 'Maria Silva',
      lead_email: 'maria@example.com',
      lead_phone: '+5511999887766',
      access_token: 'abc123xyz',
      report_link: 'https://hub.euanapratica.com/relatorio/abc123xyz',
      first_accessed_at: '2026-03-10T15:00:00.000Z',
      lead_temperature: 'quente',
      lead_priority_score: 85,
      task_priority: 'high',
      task_due_date: '2026-03-10',
    },
  },
  {
    event: 'subscription.activated',
    category: 'subscription',
    origin: 'ticto-webhook',
    trigger: 'Pagamento confirmado via webhook do Ticto (status=activated)',
    description: 'Disparado quando uma assinatura e ativada com sucesso apos pagamento.',
    fields: [
      { name: 'action', type: 'string', description: 'Acao: "activated"' },
      { name: 'customer_email', type: 'string', description: 'Email do cliente', nullable: true },
      { name: 'customer_name', type: 'string', description: 'Nome do cliente', nullable: true },
      { name: 'user_id', type: 'uuid', description: 'ID do usuario no sistema', nullable: true },
      { name: 'plan_id', type: 'uuid', description: 'ID do plano ativado', nullable: true },
      { name: 'plan_name', type: 'string', description: 'Nome do plano (Basic, Pro, VIP)', nullable: true },
      { name: 'offer_id', type: 'string', description: 'ID da oferta/produto no Ticto' },
      { name: 'ticto_status', type: 'string', description: 'Status original do Ticto' },
      { name: 'product_name', type: 'string', description: 'Nome do produto no Ticto', nullable: true },
      { name: 'paid_amount', type: 'number', description: 'Valor pago em centavos', nullable: true },
    ],
    example: {
      event: 'subscription.activated',
      timestamp: '2026-03-10T12:00:00.000Z',
      source: 'enp_hub_supabase',
      action: 'activated',
      customer_email: 'joao@example.com',
      customer_name: 'Joao Santos',
      user_id: 'u1d2e3f4-...',
      plan_id: 'p1a2b3c4-...',
      plan_name: 'Pro',
      offer_id: 'ticto_offer_123',
      ticto_status: 'activated',
      product_name: 'Rota 6.0 Pro - Mensal',
      paid_amount: 29700,
    },
  },
  {
    event: 'subscription.cancelled',
    category: 'subscription',
    origin: 'ticto-webhook / cancel-subscription',
    trigger: 'Cancelamento via Ticto ou pelo usuario na plataforma',
    description: 'Disparado quando uma assinatura e cancelada. Pode vir do webhook do Ticto ou do botao de cancelamento do usuario.',
    fields: [
      { name: 'user_id', type: 'uuid', description: 'ID do usuario' },
      { name: 'email', type: 'string', description: 'Email do usuario' },
      { name: 'subscription_id', type: 'uuid', description: 'ID da assinatura cancelada' },
      { name: 'plan_id', type: 'uuid', description: 'ID do plano' },
      { name: 'reason', type: 'string', description: 'Motivo do cancelamento' },
      { name: 'feedback', type: 'string', description: 'Feedback opcional do usuario', nullable: true },
      { name: 'was_active', type: 'boolean', description: 'Se a assinatura estava ativa no momento do cancelamento' },
      { name: 'expires_at', type: 'timestamptz', description: 'Data de expiracao (se ainda ativa)', nullable: true },
    ],
    example: {
      event: 'subscription.cancelled',
      timestamp: '2026-03-10T18:00:00.000Z',
      source: 'enp_hub_supabase',
      user_id: 'u1d2e3f4-...',
      email: 'joao@example.com',
      subscription_id: 's1a2b3c4-...',
      plan_id: 'p1a2b3c4-...',
      reason: 'Nao estou usando',
      feedback: 'Vou voltar depois',
      was_active: true,
      expires_at: '2026-04-10T12:00:00.000Z',
    },
  },
  {
    event: 'subscription.dunning_updated',
    category: 'subscription',
    origin: 'ticto-webhook',
    trigger: 'Falha de pagamento ou tentativa de cobranca via Ticto',
    description: 'Disparado quando ha uma atualizacao no status de cobranca (dunning) -- falha de pagamento, tentativa de retry, etc.',
    fields: [
      { name: 'action', type: 'string', description: 'Acao: "dunning_updated"' },
      { name: 'customer_email', type: 'string', description: 'Email do cliente', nullable: true },
      { name: 'customer_name', type: 'string', description: 'Nome do cliente', nullable: true },
      { name: 'user_id', type: 'uuid', description: 'ID do usuario', nullable: true },
      { name: 'plan_id', type: 'uuid', description: 'ID do plano', nullable: true },
      { name: 'plan_name', type: 'string', description: 'Nome do plano', nullable: true },
      { name: 'offer_id', type: 'string', description: 'ID da oferta no Ticto' },
      { name: 'ticto_status', type: 'string', description: 'Status original do Ticto' },
      { name: 'product_name', type: 'string', description: 'Nome do produto', nullable: true },
      { name: 'paid_amount', type: 'number', description: 'Valor em centavos', nullable: true },
    ],
    example: {
      event: 'subscription.dunning_updated',
      timestamp: '2026-03-10T10:00:00.000Z',
      source: 'enp_hub_supabase',
      action: 'dunning_updated',
      customer_email: 'joao@example.com',
      customer_name: 'Joao Santos',
      user_id: 'u1d2e3f4-...',
      plan_name: 'Pro',
      ticto_status: 'dunning',
      product_name: 'Rota 6.0 Pro - Mensal',
      paid_amount: 29700,
    },
  },
  {
    event: 'subscription.renewed',
    category: 'subscription',
    origin: 'ticto-webhook',
    trigger: 'Pagamento recorrente processado com sucesso via Ticto',
    description: 'Disparado quando um pagamento recorrente e processado com sucesso (renovacao mensal).',
    fields: [
      { name: 'action', type: 'string', description: 'Acao: "renewed"' },
      { name: 'customer_email', type: 'string', description: 'Email do cliente', nullable: true },
      { name: 'customer_name', type: 'string', description: 'Nome do cliente', nullable: true },
      { name: 'user_id', type: 'uuid', description: 'ID do usuario', nullable: true },
      { name: 'plan_id', type: 'uuid', description: 'ID do plano', nullable: true },
      { name: 'plan_name', type: 'string', description: 'Nome do plano', nullable: true },
      { name: 'offer_id', type: 'string', description: 'ID da oferta no Ticto' },
      { name: 'ticto_status', type: 'string', description: 'Status original do Ticto' },
      { name: 'product_name', type: 'string', description: 'Nome do produto', nullable: true },
      { name: 'paid_amount', type: 'number', description: 'Valor pago em centavos', nullable: true },
    ],
    example: {
      event: 'subscription.renewed',
      timestamp: '2026-03-10T06:00:00.000Z',
      source: 'enp_hub_supabase',
      action: 'renewed',
      customer_email: 'joao@example.com',
      plan_name: 'Pro',
      paid_amount: 29700,
    },
  },
  {
    event: 'subscription.refunded',
    category: 'subscription',
    origin: 'ticto-webhook',
    trigger: 'Reembolso processado via Ticto',
    description: 'Disparado quando um reembolso e processado para uma assinatura.',
    fields: [
      { name: 'action', type: 'string', description: 'Acao: "refunded"' },
      { name: 'customer_email', type: 'string', description: 'Email do cliente', nullable: true },
      { name: 'customer_name', type: 'string', description: 'Nome do cliente', nullable: true },
      { name: 'user_id', type: 'uuid', description: 'ID do usuario', nullable: true },
      { name: 'plan_id', type: 'uuid', description: 'ID do plano', nullable: true },
      { name: 'plan_name', type: 'string', description: 'Nome do plano', nullable: true },
      { name: 'offer_id', type: 'string', description: 'ID da oferta no Ticto' },
      { name: 'ticto_status', type: 'string', description: 'Status original do Ticto' },
      { name: 'product_name', type: 'string', description: 'Nome do produto', nullable: true },
      { name: 'paid_amount', type: 'number', description: 'Valor do reembolso em centavos', nullable: true },
    ],
    example: {
      event: 'subscription.refunded',
      timestamp: '2026-03-10T09:00:00.000Z',
      source: 'enp_hub_supabase',
      action: 'refunded',
      customer_email: 'joao@example.com',
      plan_name: 'Pro',
      paid_amount: 29700,
    },
  },
  {
    event: 'whatsapp.inbound',
    category: 'lead',
    origin: 'receive-whatsapp-webhook',
    trigger: 'Mensagem WhatsApp recebida de um contato conhecido (lead com telefone cadastrado)',
    description: 'Disparado quando o sistema recebe uma mensagem WhatsApp de um lead ja registrado. Util para scoring, CRM e routing.',
    fields: [
      { name: 'lead_id', type: 'uuid', description: 'ID do lead que enviou a mensagem' },
      { name: 'lead_name', type: 'string', description: 'Nome do lead' },
      { name: 'lead_phone', type: 'string', description: 'Telefone do lead' },
      { name: 'message_text', type: 'string', description: 'Conteudo da mensagem' },
      { name: 'message_type', type: 'string', description: 'Tipo: text, image, audio, etc.' },
    ],
    example: {
      event: 'whatsapp.inbound',
      timestamp: '2026-03-10T16:45:00.000Z',
      source: 'enp_hub_supabase',
      lead_id: 'a1b2c3d4-...',
      lead_name: 'Maria Silva',
      lead_phone: '+5511999887766',
      message_text: 'Oi, quero saber mais sobre o programa',
      message_type: 'text',
    },
  },
  {
    event: 'mentoria.interest',
    category: 'lead',
    origin: 'receive-mentoria-waitlist',
    trigger: 'Lead preenche formulario da lista de espera de mentoria em grupo',
    description: 'Disparado quando um lead demonstra interesse na mentoria em grupo e entra na lista de espera.',
    fields: [
      { name: 'waitlist_id', type: 'uuid', description: 'ID do registro na waitlist' },
      { name: 'is_new', type: 'boolean', description: 'Se e um lead novo no sistema (nao existia antes)' },
      { name: 'name', type: 'string', description: 'Nome do lead' },
      { name: 'email', type: 'string', description: 'Email do lead' },
      { name: 'whatsapp', type: 'string', description: 'WhatsApp do lead' },
      { name: 'utm_source', type: 'string', description: 'Origem do trafego', nullable: true },
      { name: 'utm_campaign', type: 'string', description: 'Campanha de origem', nullable: true },
      { name: 'enrichment', type: 'object', description: 'Dados de enriquecimento do lead (quando disponivel)' },
    ],
    example: {
      event: 'mentoria.interest',
      timestamp: '2026-03-10T11:00:00.000Z',
      source: 'enp_hub_supabase',
      waitlist_id: 'w1a2b3c4-...',
      is_new: true,
      name: 'Carlos Mendes',
      email: 'carlos@example.com',
      whatsapp: '+5521988776655',
      utm_source: 'instagram',
      utm_campaign: 'mentoria_lancamento',
      enrichment: {},
    },
  },
  {
    event: 'cart.abandoned',
    category: 'campaign',
    origin: 'check-abandoned-carts',
    trigger: 'Cron detecta servico visualizado sem compra apos periodo configurado',
    description: 'Disparado quando o cron de carrinho abandonado detecta que um usuario visualizou um servico mas nao concluiu a compra.',
    fields: [
      { name: 'user_id', type: 'uuid', description: 'ID do usuario' },
      { name: 'email', type: 'string', description: 'Email do usuario' },
      { name: 'name', type: 'string', description: 'Nome do usuario' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico visualizado' },
      { name: 'service_name', type: 'string', description: 'Nome do servico' },
      { name: 'service_price', type: 'number', description: 'Preco do servico em centavos' },
      { name: 'checkout_url', type: 'string', description: 'URL do checkout para retomar compra' },
      { name: 'viewed_at', type: 'timestamptz', description: 'Quando o servico foi visualizado' },
      { name: 'utm_source', type: 'string', description: 'Origem do trafego', nullable: true },
      { name: 'utm_medium', type: 'string', description: 'Midia', nullable: true },
      { name: 'utm_campaign', type: 'string', description: 'Campanha', nullable: true },
    ],
    example: {
      event: 'cart.abandoned',
      timestamp: '2026-03-10T20:00:00.000Z',
      source: 'enp_hub_supabase',
      user_id: 'u1d2e3f4-...',
      email: 'ana@example.com',
      name: 'Ana Costa',
      service_id: 'svc1a2b3c4-...',
      service_name: 'Sessao de Consultoria Individual',
      service_price: 49700,
      checkout_url: 'https://hub.euanapratica.com/checkout/svc1a2b3c4',
      viewed_at: '2026-03-09T14:30:00.000Z',
      utm_source: 'google',
    },
  },
  {
    event: 'manychat.trigger_flow',
    category: 'notification',
    origin: 'trigger-manychat-flow',
    trigger: 'Disparo manual ou automatico de fluxo ManyChat/WhatsApp via Edge Function',
    description: 'Disparado quando um fluxo ManyChat e acionado para um lead. Inclui template HSM e variaveis resolvidas.',
    fields: [
      { name: 'lead_id', type: 'uuid', description: 'ID do lead' },
      { name: 'lead_name', type: 'string', description: 'Primeiro nome do lead' },
      { name: 'lead_email', type: 'string', description: 'Email do lead' },
      { name: 'lead_phone', type: 'string', description: 'Telefone do lead' },
      { name: 'flow_name', type: 'string', description: 'Nome interno do fluxo' },
      { name: 'flow_display_name', type: 'string', description: 'Nome de exibicao do fluxo' },
      { name: 'mc_flow_ns', type: 'string', description: 'Namespace do fluxo ManyChat' },
      { name: 'hsm_template_name', type: 'string', description: 'Nome do template HSM' },
      { name: 'hsm_template_language', type: 'string', description: 'Idioma do template (ex: pt_BR)' },
      { name: 'hsm_template_params', type: 'array', description: 'Parametros resolvidos do template HSM' },
      { name: 'variables', type: 'object', description: 'Variaveis do fluxo resolvidas' },
      { name: 'trigger_source', type: 'string', description: 'Origem do disparo: manual, cron, event' },
    ],
    example: {
      event: 'manychat.trigger_flow',
      timestamp: '2026-03-10T13:00:00.000Z',
      source: 'enp_hub_supabase',
      lead_id: 'a1b2c3d4-...',
      lead_name: 'Maria',
      lead_phone: '+5511999887766',
      flow_name: 'report_ready_teaser',
      flow_display_name: 'Teaser Relatorio Pronto',
      trigger_source: 'event',
    },
  },
  {
    event: 'sdr.send_whatsapp',
    category: 'notification',
    origin: 'sdr-execute-outreach',
    trigger: 'SDR envia mensagem WhatsApp para um prospect via outreach automatizado',
    description: 'Disparado quando o sistema de SDR automatizado envia uma mensagem WhatsApp para um prospect.',
    fields: [
      { name: 'phone', type: 'string', description: 'Telefone do prospect' },
      { name: 'message', type: 'string', description: 'Conteudo da mensagem enviada' },
      { name: 'prospect_id', type: 'uuid', description: 'ID do prospect' },
      { name: 'prospect_name', type: 'string', description: 'Nome do prospect' },
    ],
    example: {
      event: 'sdr.send_whatsapp',
      timestamp: '2026-03-10T09:30:00.000Z',
      source: 'enp_hub_supabase',
      phone: '+5511999887766',
      message: 'Ola Maria! Vi que voce tem experiencia em...',
      prospect_id: 'pr1a2b3c4-...',
      prospect_name: 'Maria Silva',
    },
  },
  {
    event: 'sdr.send_linkedin',
    category: 'notification',
    origin: 'sdr-execute-outreach',
    trigger: 'SDR envia mensagem LinkedIn para um prospect via outreach automatizado',
    description: 'Disparado quando o sistema de SDR automatizado envia uma mensagem LinkedIn para um prospect.',
    fields: [
      { name: 'linkedin_url', type: 'string', description: 'URL do perfil LinkedIn do prospect' },
      { name: 'message', type: 'string', description: 'Conteudo da mensagem enviada' },
      { name: 'prospect_id', type: 'uuid', description: 'ID do prospect' },
      { name: 'prospect_name', type: 'string', description: 'Nome do prospect' },
    ],
    example: {
      event: 'sdr.send_linkedin',
      timestamp: '2026-03-10T09:35:00.000Z',
      source: 'enp_hub_supabase',
      linkedin_url: 'https://linkedin.com/in/mariasilva',
      message: 'Ola Maria! Vi que voce tem experiencia em...',
      prospect_id: 'pr1a2b3c4-...',
      prospect_name: 'Maria Silva',
    },
  },
  {
    event: 'analytics.daily',
    category: 'analytics',
    origin: 'generate-daily-analytics',
    trigger: 'Cron diario (configuravel em /admin/automacoes)',
    description: 'Resumo diario com todas as metricas da plataforma, analise IA e link do dashboard. Ideal para notificacoes Telegram/Slack.',
    fields: [
      { name: 'snapshot_date', type: 'string', description: 'Data do snapshot (YYYY-MM-DD)' },
      { name: 'ai_summary', type: 'string', description: 'Analise em texto gerada por IA' },
      { name: 'dashboard_url', type: 'string', description: 'Link para o dashboard de analytics' },
      { name: 'metrics.new_leads', type: 'number', description: 'Novos leads hoje' },
      { name: 'metrics.new_leads_yesterday', type: 'number', description: 'Novos leads ontem (comparacao)' },
      { name: 'metrics.new_signups', type: 'number', description: 'Novos cadastros hoje' },
      { name: 'metrics.active_subscriptions', type: 'number', description: 'Total de assinaturas ativas' },
      { name: 'metrics.mrr_estimate', type: 'number', description: 'MRR estimado em centavos' },
      { name: 'metrics.new_subs_today', type: 'number', description: 'Novas assinaturas hoje' },
      { name: 'metrics.churn_count_30d', type: 'number', description: 'Churns nos ultimos 30 dias' },
      { name: 'metrics.churn_percent_30d', type: 'number', description: 'Taxa de churn 30d (%)' },
      { name: 'metrics.revenue_today_brl', type: 'number', description: 'Receita do dia em centavos (BRL)' },
      { name: 'metrics.total_credits_used', type: 'number', description: 'Creditos usados hoje' },
      { name: 'metrics.bookings_today', type: 'number', description: 'Agendamentos hoje' },
      { name: 'metrics.no_show_rate_30d', type: 'number', description: 'Taxa de no-show 30d (%)' },
      { name: 'metrics.community_posts', type: 'number', description: 'Posts na comunidade hoje' },
      { name: 'metrics.community_comments', type: 'number', description: 'Comentarios na comunidade hoje' },
      { name: 'metrics.whatsapp_outbound', type: 'number', description: 'Mensagens WhatsApp enviadas hoje' },
      { name: 'metrics.whatsapp_inbound', type: 'number', description: 'Mensagens WhatsApp recebidas hoje' },
      { name: 'metrics.email_sent', type: 'number', description: 'Emails enviados hoje' },
      { name: 'metrics.email_success_rate', type: 'number', description: 'Taxa de sucesso de emails (%)' },
      { name: 'metrics.page_views', type: 'number', description: 'Visualizacoes de pagina hoje' },
      { name: 'metrics.api_cost_usd', type: 'number', description: 'Custo de API hoje (USD)' },
    ],
    example: {
      event: 'analytics.daily',
      timestamp: '2026-03-10T23:00:00.000Z',
      source: 'enp_hub_supabase',
      snapshot_date: '2026-03-10',
      ai_summary: 'Dia forte em captacao: 15 novos leads (+50% vs ontem). MRR estavel em R$8.400. Destaque: 3 leads quentes aguardando follow-up.',
      dashboard_url: 'https://hub.euanapratica.com/admin/analytics',
      metrics: {
        new_leads: 15,
        new_leads_yesterday: 10,
        new_signups: 3,
        active_subscriptions: 42,
        mrr_estimate: 840000,
        churn_percent_30d: 2.5,
        bookings_today: 5,
        whatsapp_outbound: 120,
        email_sent: 45,
        api_cost_usd: 1.23,
      },
    },
  },
  {
    event: 'intelligence.weekly_report',
    category: 'intelligence',
    origin: 'generate-weekly-report',
    trigger: 'Cron semanal (configuravel em /admin/automacoes)',
    description: 'Relatorio semanal de inteligencia de vendas com analise IA, leads quentes, oportunidades e alertas.',
    fields: [
      { name: 'report_id', type: 'uuid', description: 'ID do relatorio semanal gerado' },
      { name: 'period.start', type: 'string', description: 'Inicio do periodo (YYYY-MM-DD)' },
      { name: 'period.end', type: 'string', description: 'Fim do periodo (YYYY-MM-DD)' },
      { name: 'executive_summary', type: 'string', description: 'Resumo executivo gerado por IA' },
      { name: 'hot_leads_count', type: 'number', description: 'Quantidade de leads quentes na semana' },
      { name: 'new_leads_count', type: 'number', description: 'Novos leads na semana' },
      { name: 'bookings_this_week', type: 'number', description: 'Agendamentos na semana' },
      { name: 'revenue_this_week_brl', type: 'number', description: 'Receita da semana em centavos (BRL)' },
      { name: 'alerts_count', type: 'number', description: 'Numero de alertas identificados pela IA' },
      { name: 'opportunities_count', type: 'number', description: 'Numero de oportunidades identificadas' },
      { name: 'ai_analysis', type: 'object', description: 'Objeto completo com analise IA (summary, alerts, opportunities, etc.)' },
      { name: 'report_url', type: 'string', description: 'Link para o relatorio no admin' },
    ],
    example: {
      event: 'intelligence.weekly_report',
      timestamp: '2026-03-10T00:00:00.000Z',
      source: 'enp_hub_supabase',
      report_id: 'r1a2b3c4-...',
      period: { start: '2026-03-03', end: '2026-03-09' },
      executive_summary: 'Semana com crescimento de 20% em leads. 5 leads quentes aguardam follow-up prioritario...',
      hot_leads_count: 5,
      new_leads_count: 45,
      bookings_this_week: 12,
      revenue_this_week_brl: 594000,
      alerts_count: 2,
      opportunities_count: 3,
      report_url: 'https://hub.euanapratica.com/admin/inteligencia-semanal',
    },
  },
  // ── Booking Events ───────────────────────────────────────────────
  {
    event: 'booking.created',
    category: 'booking',
    origin: 'send-booking-confirmation',
    trigger: 'Aluno cria um novo agendamento de sessao/consultoria',
    description: 'Disparado quando um agendamento e criado com sucesso. Contem dados do aluno, mentor, servico e horario.',
    fields: [
      { name: 'booking_id', type: 'uuid', description: 'ID do agendamento' },
      { name: 'student_id', type: 'uuid', description: 'ID do aluno' },
      { name: 'student_name', type: 'string', description: 'Nome do aluno' },
      { name: 'student_email', type: 'string', description: 'Email do aluno' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'scheduled_start', type: 'timestamptz', description: 'Inicio agendado' },
      { name: 'scheduled_end', type: 'timestamptz', description: 'Fim agendado' },
      { name: 'duration_minutes', type: 'number', description: 'Duracao em minutos' },
      { name: 'meeting_link', type: 'string', description: 'Link da reuniao (Google Meet, Zoom)', nullable: true },
      { name: 'student_notes', type: 'string', description: 'Notas do aluno', nullable: true },
    ],
    example: {
      event: 'booking.created',
      timestamp: '2026-03-10T14:00:00.000Z',
      source: 'enp_hub_supabase',
      booking_id: 'b1a2b3c4-...',
      student_id: 'u1d2e3f4-...',
      student_name: 'Maria Silva',
      student_email: 'maria@example.com',
      mentor_id: 'm1a2b3c4-...',
      mentor_name: 'Euan Semple',
      service_id: 'svc1a2b3c4-...',
      service_name: 'Sessao de Consultoria Individual',
      scheduled_start: '2026-03-15T14:00:00.000Z',
      scheduled_end: '2026-03-15T15:00:00.000Z',
      duration_minutes: 60,
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      student_notes: 'Quero discutir meu curriculo',
    },
  },
  {
    event: 'booking.completed',
    category: 'booking',
    origin: 'send-booking-completed',
    trigger: 'Mentor ou admin marca sessao como concluida',
    description: 'Disparado quando uma sessao e marcada como concluida. Util para disparar pesquisa de satisfacao, registrar progresso ou trigger upsell.',
    fields: [
      { name: 'booking_id', type: 'uuid', description: 'ID do agendamento' },
      { name: 'student_id', type: 'uuid', description: 'ID do aluno' },
      { name: 'student_name', type: 'string', description: 'Nome do aluno' },
      { name: 'student_email', type: 'string', description: 'Email do aluno' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'scheduled_start', type: 'timestamptz', description: 'Inicio agendado' },
      { name: 'scheduled_end', type: 'timestamptz', description: 'Fim agendado' },
      { name: 'duration_minutes', type: 'number', description: 'Duracao em minutos' },
      { name: 'mentor_notes', type: 'string', description: 'Notas do mentor sobre a sessao', nullable: true },
      { name: 'completed_at', type: 'timestamptz', description: 'Timestamp da conclusao' },
    ],
    example: {
      event: 'booking.completed',
      timestamp: '2026-03-15T15:05:00.000Z',
      source: 'enp_hub_supabase',
      booking_id: 'b1a2b3c4-...',
      student_name: 'Maria Silva',
      mentor_name: 'Euan Semple',
      service_name: 'Sessao de Consultoria Individual',
      scheduled_start: '2026-03-15T14:00:00.000Z',
      duration_minutes: 60,
      mentor_notes: 'Aluna muito engajada, recomendei o curso Pro',
      completed_at: '2026-03-15T15:05:00.000Z',
    },
  },
  {
    event: 'booking.cancelled',
    category: 'booking',
    origin: 'send-booking-cancelled',
    trigger: 'Aluno, mentor ou admin cancela um agendamento',
    description: 'Disparado quando um agendamento e cancelado. Inclui motivo quando disponivel.',
    fields: [
      { name: 'booking_id', type: 'uuid', description: 'ID do agendamento' },
      { name: 'student_id', type: 'uuid', description: 'ID do aluno' },
      { name: 'student_name', type: 'string', description: 'Nome do aluno' },
      { name: 'student_email', type: 'string', description: 'Email do aluno' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'scheduled_start', type: 'timestamptz', description: 'Inicio que estava agendado' },
      { name: 'status', type: 'string', description: 'Status: cancelled' },
      { name: 'cancellation_reason', type: 'string', description: 'Motivo do cancelamento', nullable: true },
    ],
    example: {
      event: 'booking.cancelled',
      timestamp: '2026-03-14T10:00:00.000Z',
      source: 'enp_hub_supabase',
      booking_id: 'b1a2b3c4-...',
      student_name: 'Maria Silva',
      mentor_name: 'Euan Semple',
      service_name: 'Sessao de Consultoria Individual',
      scheduled_start: '2026-03-15T14:00:00.000Z',
      status: 'cancelled',
      cancellation_reason: 'Conflito de agenda',
    },
  },
  {
    event: 'booking.rescheduled',
    category: 'booking',
    origin: 'send-booking-rescheduled',
    trigger: 'Aluno ou mentor reagenda uma sessao para novo horario',
    description: 'Disparado quando um agendamento e movido para outro horario. Inclui data/hora antiga e nova.',
    fields: [
      { name: 'booking_id', type: 'uuid', description: 'ID do agendamento' },
      { name: 'student_id', type: 'uuid', description: 'ID do aluno' },
      { name: 'student_name', type: 'string', description: 'Nome do aluno' },
      { name: 'student_email', type: 'string', description: 'Email do aluno' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'old_scheduled_start', type: 'timestamptz', description: 'Horario anterior' },
      { name: 'new_scheduled_start', type: 'timestamptz', description: 'Novo horario' },
      { name: 'new_scheduled_end', type: 'timestamptz', description: 'Novo fim' },
    ],
    example: {
      event: 'booking.rescheduled',
      timestamp: '2026-03-14T09:00:00.000Z',
      source: 'enp_hub_supabase',
      booking_id: 'b1a2b3c4-...',
      student_name: 'Maria Silva',
      mentor_name: 'Euan Semple',
      service_name: 'Sessao de Consultoria Individual',
      old_scheduled_start: '2026-03-15T14:00:00.000Z',
      new_scheduled_start: '2026-03-16T10:00:00.000Z',
      new_scheduled_end: '2026-03-16T11:00:00.000Z',
    },
  },
  {
    event: 'booking.no_show',
    category: 'booking',
    origin: 'send-booking-cancelled',
    trigger: 'Admin marca sessao como no-show (aluno nao compareceu)',
    description: 'Disparado quando o admin marca que o aluno nao compareceu a sessao. Util para detectar padroes e enviar email de re-agendamento.',
    fields: [
      { name: 'booking_id', type: 'uuid', description: 'ID do agendamento' },
      { name: 'student_id', type: 'uuid', description: 'ID do aluno' },
      { name: 'student_name', type: 'string', description: 'Nome do aluno' },
      { name: 'student_email', type: 'string', description: 'Email do aluno' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'scheduled_start', type: 'timestamptz', description: 'Horario da sessao perdida' },
      { name: 'status', type: 'string', description: 'Status: no_show' },
    ],
    example: {
      event: 'booking.no_show',
      timestamp: '2026-03-15T15:30:00.000Z',
      source: 'enp_hub_supabase',
      booking_id: 'b1a2b3c4-...',
      student_name: 'Joao Santos',
      mentor_name: 'Euan Semple',
      service_name: 'Sessao de Consultoria Individual',
      scheduled_start: '2026-03-15T14:00:00.000Z',
      status: 'no_show',
    },
  },
  // ── Live Events ──────────────────────────────────────────────────
  {
    event: 'live.created',
    category: 'live',
    origin: 'send-live-notification',
    trigger: 'Mentor cria uma nova live/webinar',
    description: 'Disparado quando uma nova live e criada. Util para postar automaticamente em redes sociais ou criar evento em calendario compartilhado.',
    fields: [
      { name: 'live_id', type: 'uuid', description: 'ID da live' },
      { name: 'title', type: 'string', description: 'Titulo da live' },
      { name: 'slug', type: 'string', description: 'Slug unico da live' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'scheduled_at', type: 'timestamptz', description: 'Data/hora agendada' },
      { name: 'duration_minutes', type: 'number', description: 'Duracao em minutos' },
      { name: 'meeting_link', type: 'string', description: 'Link da reuniao' },
    ],
    example: {
      event: 'live.created',
      timestamp: '2026-03-10T10:00:00.000Z',
      source: 'enp_hub_supabase',
      live_id: 'l1a2b3c4-...',
      title: 'Como Montar seu Curriculo para os EUA',
      slug: 'curriculo-eua-marco',
      mentor_id: 'm1a2b3c4-...',
      mentor_name: 'Euan Semple',
      scheduled_at: '2026-03-20T19:00:00.000Z',
      duration_minutes: 90,
      meeting_link: 'https://meet.google.com/abc-defg-hij',
    },
  },
  {
    event: 'live.registration',
    category: 'live',
    origin: 'send-live-notification',
    trigger: 'Usuario se inscreve em uma live',
    description: 'Disparado quando um usuario se inscreve em uma live. Util para lead scoring, segmentacao por interesse e lembrete automatico.',
    fields: [
      { name: 'live_id', type: 'uuid', description: 'ID da live' },
      { name: 'title', type: 'string', description: 'Titulo da live' },
      { name: 'slug', type: 'string', description: 'Slug da live' },
      { name: 'user_id', type: 'uuid', description: 'ID do usuario que se inscreveu' },
      { name: 'user_name', type: 'string', description: 'Nome do usuario' },
      { name: 'user_email', type: 'string', description: 'Email do usuario' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'scheduled_at', type: 'timestamptz', description: 'Data/hora da live' },
      { name: 'duration_minutes', type: 'number', description: 'Duracao em minutos' },
    ],
    example: {
      event: 'live.registration',
      timestamp: '2026-03-12T16:00:00.000Z',
      source: 'enp_hub_supabase',
      live_id: 'l1a2b3c4-...',
      title: 'Como Montar seu Curriculo para os EUA',
      slug: 'curriculo-eua-marco',
      user_id: 'u1d2e3f4-...',
      user_name: 'Maria Silva',
      user_email: 'maria@example.com',
      mentor_id: 'm1a2b3c4-...',
      mentor_name: 'Euan Semple',
      scheduled_at: '2026-03-20T19:00:00.000Z',
      duration_minutes: 90,
    },
  },
  {
    event: 'live.started',
    category: 'live',
    origin: 'send-live-notification',
    trigger: 'Mentor clica em "Iniciar Live" (status muda para "live")',
    description: 'Disparado quando o mentor inicia a live. Ideal para enviar notificacao WhatsApp "estamos ao vivo!" ou push notification.',
    fields: [
      { name: 'live_id', type: 'uuid', description: 'ID da live' },
      { name: 'title', type: 'string', description: 'Titulo da live' },
      { name: 'slug', type: 'string', description: 'Slug da live' },
      { name: 'meeting_link', type: 'string', description: 'Link para assistir' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'registration_count', type: 'number', description: 'Numero de inscritos' },
      { name: 'scheduled_at', type: 'timestamptz', description: 'Horario originalmente agendado' },
    ],
    example: {
      event: 'live.started',
      timestamp: '2026-03-20T19:02:00.000Z',
      source: 'enp_hub_supabase',
      live_id: 'l1a2b3c4-...',
      title: 'Como Montar seu Curriculo para os EUA',
      slug: 'curriculo-eua-marco',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      mentor_id: 'm1a2b3c4-...',
      registration_count: 45,
      scheduled_at: '2026-03-20T19:00:00.000Z',
    },
  },
  {
    event: 'live.completed',
    category: 'live',
    origin: 'send-live-thankyou',
    trigger: 'Mentor encerra a live (status muda para "completed")',
    description: 'Disparado quando a live e encerrada. Inclui link da gravacao quando disponivel. Util para distribuir gravacao, atualizar lead scoring de quem assistiu.',
    fields: [
      { name: 'live_id', type: 'uuid', description: 'ID da live' },
      { name: 'title', type: 'string', description: 'Titulo da live' },
      { name: 'slug', type: 'string', description: 'Slug da live' },
      { name: 'recording_url', type: 'string', description: 'URL da gravacao', nullable: true },
      { name: 'total_participants', type: 'number', description: 'Total de participantes (inscritos + convidados)' },
      { name: 'emails_sent', type: 'number', description: 'Emails de agradecimento enviados com sucesso' },
    ],
    example: {
      event: 'live.completed',
      timestamp: '2026-03-20T20:35:00.000Z',
      source: 'enp_hub_supabase',
      live_id: 'l1a2b3c4-...',
      title: 'Como Montar seu Curriculo para os EUA',
      slug: 'curriculo-eua-marco',
      recording_url: 'https://youtu.be/abc123',
      total_participants: 38,
      emails_sent: 36,
    },
  },
  {
    event: 'live.cancelled',
    category: 'live',
    origin: 'send-live-cancelled',
    trigger: 'Mentor cancela uma live agendada',
    description: 'Disparado quando uma live e cancelada. Inclui motivo e numero de inscritos afetados.',
    fields: [
      { name: 'live_id', type: 'uuid', description: 'ID da live' },
      { name: 'title', type: 'string', description: 'Titulo da live' },
      { name: 'slug', type: 'string', description: 'Slug da live' },
      { name: 'mentor_id', type: 'uuid', description: 'ID do mentor' },
      { name: 'mentor_name', type: 'string', description: 'Nome do mentor' },
      { name: 'scheduled_at', type: 'timestamptz', description: 'Data/hora que estava agendada' },
      { name: 'cancellation_reason', type: 'string', description: 'Motivo do cancelamento', nullable: true },
      { name: 'registration_count', type: 'number', description: 'Numero de inscritos afetados' },
    ],
    example: {
      event: 'live.cancelled',
      timestamp: '2026-03-19T12:00:00.000Z',
      source: 'enp_hub_supabase',
      live_id: 'l1a2b3c4-...',
      title: 'Como Montar seu Curriculo para os EUA',
      slug: 'curriculo-eua-marco',
      mentor_id: 'm1a2b3c4-...',
      mentor_name: 'Euan Semple',
      scheduled_at: '2026-03-20T19:00:00.000Z',
      cancellation_reason: 'Problema de saude',
      registration_count: 45,
    },
  },
  // ── Order Events ─────────────────────────────────────────────────
  {
    event: 'order.paid',
    category: 'order',
    origin: 'ticto-webhook',
    trigger: 'Pagamento confirmado via Ticto para compra avulsa (servico ou live)',
    description: 'Disparado quando um pagamento e confirmado para uma compra avulsa (nao assinatura). Pode ser um servico do hub ou uma live paga.',
    fields: [
      { name: 'user_id', type: 'uuid', description: 'ID do usuario comprador' },
      { name: 'email', type: 'string', description: 'Email do comprador' },
      { name: 'product_name', type: 'string', description: 'Nome do produto comprado' },
      { name: 'product_type', type: 'string', description: 'Tipo: "one_time_service" ou "live"' },
      { name: 'amount', type: 'number', description: 'Valor pago (BRL, em reais)' },
      { name: 'currency', type: 'string', description: 'Moeda (BRL)' },
      { name: 'ticto_order_id', type: 'string', description: 'ID da transacao no Ticto' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico (se compra de servico)', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'live_id', type: 'uuid', description: 'ID da live (se compra de live)', nullable: true },
      { name: 'live_title', type: 'string', description: 'Titulo da live', nullable: true },
    ],
    example: {
      event: 'order.paid',
      timestamp: '2026-03-10T11:00:00.000Z',
      source: 'enp_hub_supabase',
      user_id: 'u1d2e3f4-...',
      email: 'maria@example.com',
      product_name: 'Sessao de Consultoria Individual',
      product_type: 'one_time_service',
      amount: 497.00,
      currency: 'BRL',
      ticto_order_id: 'tx_abc123',
      service_id: 'svc1a2b3c4-...',
      service_name: 'Sessao de Consultoria Individual',
    },
  },
  {
    event: 'order.refunded',
    category: 'order',
    origin: 'ticto-webhook',
    trigger: 'Reembolso, chargeback ou disputa processado via Ticto para compra avulsa',
    description: 'Disparado quando um reembolso e processado para uma compra avulsa. O acesso ao servico/live e revogado automaticamente.',
    fields: [
      { name: 'user_id', type: 'uuid', description: 'ID do usuario' },
      { name: 'email', type: 'string', description: 'Email do usuario' },
      { name: 'product_type', type: 'string', description: 'Tipo: "one_time_service" ou "live"' },
      { name: 'ticto_order_id', type: 'string', description: 'ID da transacao no Ticto' },
      { name: 'service_id', type: 'uuid', description: 'ID do servico (se reembolso de servico)', nullable: true },
      { name: 'service_name', type: 'string', description: 'Nome do servico', nullable: true },
      { name: 'live_id', type: 'uuid', description: 'ID da live (se reembolso de live)', nullable: true },
      { name: 'refund_event', type: 'string', description: 'Tipo do evento Ticto: refunded, chargedback, disputed' },
    ],
    example: {
      event: 'order.refunded',
      timestamp: '2026-03-12T09:00:00.000Z',
      source: 'enp_hub_supabase',
      user_id: 'u1d2e3f4-...',
      email: 'maria@example.com',
      product_type: 'one_time_service',
      ticto_order_id: 'tx_abc123',
      service_id: 'svc1a2b3c4-...',
      service_name: 'Sessao de Consultoria Individual',
      refund_event: 'refunded',
    },
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  report: { label: 'Relatorio', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FileText className="w-3.5 h-3.5" /> },
  subscription: { label: 'Assinatura', color: 'bg-green-50 text-green-700 border-green-200', icon: <CreditCard className="w-3.5 h-3.5" /> },
  lead: { label: 'Lead', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Users className="w-3.5 h-3.5" /> },
  notification: { label: 'Notificacao', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  campaign: { label: 'Campanha', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  analytics: { label: 'Analytics', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  intelligence: { label: 'Inteligencia', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: <Brain className="w-3.5 h-3.5" /> },
  booking: { label: 'Agendamento', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: <CalendarCheck className="w-3.5 h-3.5" /> },
  live: { label: 'Live', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: <Video className="w-3.5 h-3.5" /> },
  order: { label: 'Pedido', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Package className="w-3.5 h-3.5" /> },
};

// ── Event Card Component ─────────────────────────────────────────────

function EventCard({ event }: { event: WebhookEvent }) {
  const [expanded, setExpanded] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const { toast } = useToast();
  const cat = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.lead;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (label === 'payload') {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
    toast({ title: 'Copiado!', description: `${label} copiado para a area de transferencia.` });
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none pb-3 hover:bg-gray-50/50 rounded-t-lg transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {expanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  <code className="text-sm font-bold font-mono text-gray-900">{event.event}</code>
                </div>
                <div className="flex flex-wrap gap-1.5 ml-6">
                  <Badge variant="outline" className={`${cat.color} gap-1`}>
                    {cat.icon} {cat.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono bg-gray-50 text-gray-600 border-gray-200">
                    {event.origin}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 ml-6 line-clamp-2">{event.description}</p>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs bg-gray-50">
                {event.fields.length} campos
              </Badge>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Trigger */}
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">Quando dispara</span>
              </div>
              <p className="text-xs text-amber-700">{event.trigger}</p>
            </div>

            {/* Wildcard note for subscription events */}
            {event.event.startsWith('subscription.') && (
              <div className="p-2 bg-green-50/50 rounded border border-green-100">
                <p className="text-[11px] text-green-700">
                  <strong>Dica:</strong> Use <code className="font-mono bg-green-100 px-1 rounded">subscription.*</code> no trigger_event da automacao para capturar todos os eventos de assinatura com um unico webhook.
                </p>
              </div>
            )}
            {event.event.startsWith('booking.') && (
              <div className="p-2 bg-teal-50/50 rounded border border-teal-100">
                <p className="text-[11px] text-teal-700">
                  <strong>Dica:</strong> Use <code className="font-mono bg-teal-100 px-1 rounded">booking.*</code> para capturar todos os eventos de agendamento (created, completed, cancelled, rescheduled, no_show).
                </p>
              </div>
            )}
            {event.event.startsWith('live.') && (
              <div className="p-2 bg-rose-50/50 rounded border border-rose-100">
                <p className="text-[11px] text-rose-700">
                  <strong>Dica:</strong> Use <code className="font-mono bg-rose-100 px-1 rounded">live.*</code> para capturar todos os eventos de live (created, registration, started, completed, cancelled).
                </p>
              </div>
            )}
            {event.event.startsWith('order.') && (
              <div className="p-2 bg-orange-50/50 rounded border border-orange-100">
                <p className="text-[11px] text-orange-700">
                  <strong>Dica:</strong> Use <code className="font-mono bg-orange-100 px-1 rounded">order.*</code> para capturar todos os eventos de pedido (paid, refunded).
                </p>
              </div>
            )}

            {/* Fields Table */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Campos do Payload</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs w-[180px]">Campo</TableHead>
                      <TableHead className="text-xs w-[100px]">Tipo</TableHead>
                      <TableHead className="text-xs">Descricao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Common envelope fields */}
                    <TableRow className="bg-blue-50/30">
                      <TableCell className="font-mono text-xs text-blue-700">event</TableCell>
                      <TableCell className="text-xs text-blue-600">string</TableCell>
                      <TableCell className="text-xs text-blue-600">Nome do evento (sempre presente)</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50/30">
                      <TableCell className="font-mono text-xs text-blue-700">timestamp</TableCell>
                      <TableCell className="text-xs text-blue-600">ISO 8601</TableCell>
                      <TableCell className="text-xs text-blue-600">Timestamp do disparo (sempre presente)</TableCell>
                    </TableRow>
                    <TableRow className="bg-blue-50/30">
                      <TableCell className="font-mono text-xs text-blue-700">source</TableCell>
                      <TableCell className="text-xs text-blue-600">string</TableCell>
                      <TableCell className="text-xs text-blue-600">Sempre "enp_hub_supabase"</TableCell>
                    </TableRow>
                    {/* Event-specific fields */}
                    {event.fields.map((field) => (
                      <TableRow key={field.name}>
                        <TableCell className="font-mono text-xs">
                          {field.name}
                          {field.nullable && <span className="text-gray-400 ml-1">?</span>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{field.type}</TableCell>
                        <TableCell className="text-xs text-gray-600">{field.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Example Payload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-700">Exemplo de Payload</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(JSON.stringify(event.example, null, 2), 'payload');
                  }}
                >
                  {copiedPayload
                    ? <><CheckCircle2 className="w-3 h-3 text-green-600" /> Copiado</>
                    : <><Copy className="w-3 h-3" /> Copiar JSON</>
                  }
                </Button>
              </div>
              <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-auto max-h-64 font-mono leading-relaxed">
                {JSON.stringify(event.example, null, 2)}
              </pre>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function AdminWebhookDocs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(WEBHOOK_EVENTS.map(e => e.category));
    return Array.from(cats).sort();
  }, []);

  const filteredEvents = useMemo(() => {
    return WEBHOOK_EVENTS.filter((evt) => {
      if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          evt.event.toLowerCase().includes(q) ||
          evt.origin.toLowerCase().includes(q) ||
          evt.description.toLowerCase().includes(q) ||
          evt.fields.some(f => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [searchQuery, categoryFilter]);

  const eventsByCategory = useMemo(() => {
    const groups: Record<string, WebhookEvent[]> = {};
    for (const evt of filteredEvents) {
      if (!groups[evt.category]) groups[evt.category] = [];
      groups[evt.category].push(evt);
    }
    return groups;
  }, [filteredEvents]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-blue-500" />
            Webhooks & Eventos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {WEBHOOK_EVENTS.length} eventos disponiveis para integracao via N8N ou APIs externas
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-700">{WEBHOOK_EVENTS.length}</div>
              <div className="text-xs text-blue-600">Eventos disponiveis</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-700">{categories.length}</div>
              <div className="text-xs text-green-600">Categorias</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-700">JSON</div>
              <div className="text-xs text-purple-600">Formato do payload</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-700">POST</div>
              <div className="text-xs text-amber-600">Metodo HTTP</div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Como funciona</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-700 mb-1">1. Evento ocorre</div>
                <p className="text-[11px] text-gray-500">Uma acao na plataforma (ex: relatorio gerado, assinatura ativada) dispara um evento interno.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-700 mb-1">2. Webhook enviado</div>
                <p className="text-[11px] text-gray-500">O sistema busca automacoes ativas com trigger_event correspondente e envia HTTP POST com o payload JSON.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-700 mb-1">3. N8N processa</div>
                <p className="text-[11px] text-gray-500">O fluxo N8N recebe os dados e executa a logica (enviar mensagem, criar tarefa, notificar, etc.).</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[11px] text-blue-700">
                <strong>Wildcards:</strong> No campo <code className="font-mono bg-blue-100 px-1 rounded">trigger_event</code> da automacao, use <code className="font-mono bg-blue-100 px-1 rounded">prefixo.*</code> para capturar todos os eventos de uma familia.
                Exemplo: <code className="font-mono bg-blue-100 px-1 rounded">subscription.*</code> captura activated, cancelled, renewed, etc.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-[11px] text-amber-700">
                <strong>Envelope padrao:</strong> Todo payload inclui os campos <code className="font-mono bg-amber-100 px-1 rounded">event</code>, <code className="font-mono bg-amber-100 px-1 rounded">timestamp</code> (ISO 8601) e <code className="font-mono bg-amber-100 px-1 rounded">source</code> ("enp_hub_supabase"), alem dos campos especificos do evento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por evento, origem, campo..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_CONFIG[cat]?.label || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || categoryFilter !== 'all') && (
            <span className="text-xs text-gray-500">
              {filteredEvents.length} de {WEBHOOK_EVENTS.length} eventos
            </span>
          )}
        </div>

        {/* Events grouped by category */}
        {Object.entries(eventsByCategory).map(([category, events]) => {
          const cat = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.lead;
          return (
            <div key={category} className="space-y-3">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                {cat.icon}
                {cat.label}
                <span className="text-xs font-normal text-gray-400">({events.length})</span>
              </h2>
              <div className="space-y-3">
                {events.map((evt) => (
                  <EventCard key={evt.event} event={evt} />
                ))}
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhum evento encontrado para os filtros selecionados.
            </CardContent>
          </Card>
        )}

        {/* Authentication Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-gray-500" />
              Autenticacao: N8N chamando Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-gray-600">
              Quando o N8N precisa chamar Edge Functions de volta (send-whatsapp, send-lead-email, etc.),
              envie o header abaixo para autenticar como chamada interna:
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono">
{`POST https://<project-id>.supabase.co/functions/v1/<function-name>
Content-Type: application/json
x-internal-secret: <INTERNAL_FUNCTION_SECRET>`}
            </pre>
            <p className="text-xs text-gray-600 mt-2">
              Para acessar a API REST do Supabase diretamente (inserir dados, consultar tabelas):
            </p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono">
{`GET/POST https://<project-id>.supabase.co/rest/v1/<table>
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
