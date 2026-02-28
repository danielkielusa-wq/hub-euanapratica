import { useState } from 'react';
import {
  Brain, RefreshCw, Loader2, AlertTriangle, TrendingUp,
  Phone, Copy, Check, Clock, Calendar, Users, DollarSign,
  ChevronDown, ChevronRight, Zap, Target, ScrollText, Settings, HelpCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useLatestReport,
  useReportHistory,
  useReportById,
  useGenerateWeeklyReport,
  useApproveWeeklyReport,
  type WeeklyReport,
  type WeeklyReportSummary,
  type HotLeadMetric,
} from '@/hooks/useAdminWeeklyReport';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { useAdminApis } from '@/hooks/useAdminApis';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const NON_LLM_SLUGS = ['resend_email', 'ticto_webhook'];

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEMP_BADGES: Record<string, string> = {
  'muito-quente': 'bg-red-100 text-red-700 border-red-200',
  'quente': 'bg-orange-100 text-orange-700 border-orange-200',
  'morno': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'frio': 'bg-blue-100 text-blue-700 border-blue-200',
};

const URGENCY_BADGES: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completo', color: 'bg-green-50 text-green-700 border-green-200' },
  generating: { label: 'Gerando...', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  error: { label: 'Erro', color: 'bg-red-50 text-red-700 border-red-200' },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), "dd MMM yyyy 'as' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), "dd/MM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Status Card ──────────────────────────────────────────────────────────────

function StatusCards({ report }: { report: WeeklyReport | null }) {
  const cards = [
    {
      label: 'Ultimo Relatorio',
      value: report ? formatDate(report.created_at) : 'Nenhum',
      icon: Calendar,
    },
    {
      label: 'Proximo Agendado',
      value: 'Seg 06:00 BRT',
      icon: Clock,
    },
    {
      label: 'Metodo',
      value: report?.generation_method === 'scheduled' ? 'Agendado (cron)' : report ? 'Manual' : '—',
      icon: Zap,
    },
    {
      label: 'Duracao / Custo',
      value: report ? `${formatDuration(report.duration_ms)}${report.cost_usd ? ` / $${report.cost_usd}` : ''}` : '—',
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <c.icon className="w-3.5 h-3.5" />
              {c.label}
            </div>
            <p className="text-sm font-medium">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Executive Summary ────────────────────────────────────────────────────────

function ExecutiveSummary({ text }: { text: string | string[] }) {
  // LLM may return a string with newlines OR an array of bullet points
  const lines = Array.isArray(text) ? text : (typeof text === 'string' ? text.split('\n').filter(Boolean) : [String(text)]);
  if (lines.length === 0) return null;
  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-600" />
          Resumo Executivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {lines.map((line, i) => (
            <li key={i} className="text-sm leading-relaxed">{String(line).replace(/^[-•]\s*/, '')}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Hot Leads Briefing ───────────────────────────────────────────────────────

function HotLeadsBriefing({
  briefing,
  leads,
}: {
  briefing: string;
  leads: HotLeadMetric[];
}) {
  return (
    <Card className="border-red-200 bg-red-50/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-red-600" />
          Leads Quentes sem Follow-up
          {leads.length > 0 && (
            <Badge variant="outline" className="ml-auto bg-red-100 text-red-700 border-red-200">
              {leads.length} leads
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {briefing && <p className="text-sm leading-relaxed text-gray-700">{String(briefing)}</p>}

        {leads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">Nome</th>
                  <th className="pb-2 pr-3">Email</th>
                  <th className="pb-2 pr-3">Telefone</th>
                  <th className="pb-2 pr-3">Temp.</th>
                  <th className="pb-2 pr-3">Area</th>
                  <th className="pb-2 pr-3">Ultimo Contato</th>
                  <th className="pb-2 pr-3">Acao Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 hover:bg-red-50/40">
                    <td className="py-2 pr-3">
                      <Link
                        to={`/admin/leads/${lead.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {lead.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-gray-600 text-xs break-all">
                      {lead.email || '—'}
                    </td>
                    <td className="py-2 pr-3">
                      {lead.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {lead.phone}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className={cn('text-xs', TEMP_BADGES[lead.temperature] || '')}>
                        {lead.temperature}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-gray-600 max-w-[120px] truncate">{lead.area || '—'}</td>
                    <td className="py-2 pr-3 text-gray-600">
                      {lead.last_interaction_date
                        ? formatShortDate(lead.last_interaction_date)
                        : <span className="text-red-500 font-medium">Nunca</span>}
                    </td>
                    <td className="py-2 pr-3 text-gray-600 max-w-[200px] truncate">
                      {lead.recommended_first_action || lead.recommended_product || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Opportunities ────────────────────────────────────────────────────────────

function OpportunitiesList({ items }: { items: WeeklyReport['ai_analysis']['opportunities'] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          Oportunidades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={cn('text-xs shrink-0 mt-0.5', URGENCY_BADGES[item.urgency] || '')}>
                  {item.urgency}
                </Badge>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <p className="text-xs text-gray-600 ml-[60px]">{item.description}</p>
              {item.suggested_action && (
                <p className="text-xs text-indigo-600 ml-[60px] italic">{item.suggested_action}</p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Alerts ───────────────────────────────────────────────────────────────────

function AlertsList({ items }: { items: WeeklyReport['ai_analysis']['alerts'] }) {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Alertas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="space-y-1">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className={cn('text-xs shrink-0 mt-0.5', SEVERITY_BADGES[item.severity] || '')}>
                  {item.severity}
                </Badge>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
              <p className="text-xs text-gray-600 ml-[70px]">{item.description}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Sales Talking Points ─────────────────────────────────────────────────────

function SalesTalkingPoints({ items }: { items: WeeklyReport['ai_analysis']['sales_talking_points'] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Phone className="w-4 h-4 text-purple-600" />
          Pontos de Conversa para Vendas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.lead_name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.opener}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 w-7 p-0"
                onClick={() => handleCopy(item.opener, i)}
              >
                {copiedIdx === i
                  ? <Check className="w-3.5 h-3.5 text-green-600" />
                  : <Copy className="w-3.5 h-3.5 text-gray-400" />}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Weekly Comparison ────────────────────────────────────────────────────────

function WeeklyComparison({ text }: { text: string | string[] }) {
  if (!text) return null;
  const content = Array.isArray(text) ? text.join('\n') : String(text);
  if (!content) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Comparativo Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-gray-700">{content}</p>
      </CardContent>
    </Card>
  );
}

// ── Raw Metrics Collapsible ──────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  leads_pipeline: 'Pipeline de Leads',
  hot_leads_without_followup: 'Leads Quentes sem Follow-up',
  reengagement_opportunities: 'Oportunidades de Re-engajamento',
  funnel_metrics: 'Metricas de Funil',
  booking_activity: 'Atividade de Agendamentos',
  subscription_revenue: 'Assinaturas e Receita',
  engagement_signals: 'Sinais de Engajamento',
  task_health: 'Saude das Tarefas',
};

function RawMetricsCollapsible({ metrics }: { metrics: WeeklyReport['raw_metrics'] }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sections = Object.entries(metrics || {}).filter(
    ([key]) => key !== 'period' && SECTION_LABELS[key]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-gray-600" />
          Metricas Brutas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {sections.map(([key, value]) => (
          <Collapsible key={key} open={openSections.has(key)} onOpenChange={() => toggle(key)}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded hover:bg-gray-50 text-sm">
              {openSections.has(key) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {SECTION_LABELS[key] || key}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto max-h-[300px] overflow-y-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Report History Sheet ─────────────────────────────────────────────────────

function ReportHistorySheet({
  reports,
  selectedId,
  onSelect,
}: {
  reports: WeeklyReportSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.error;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={cn(
              'w-full text-left p-3 rounded-md border transition-colors',
              selectedId === r.id ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">
                {formatShortDate(r.period_start)} — {formatShortDate(r.period_end)}
              </span>
              <Badge variant="outline" className={cn('text-xs', sc.color)}>
                {sc.label}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{r.generation_method === 'scheduled' ? 'Agendado' : 'Manual'}</span>
              <span>{formatDuration(r.duration_ms)}</span>
              {r.webhook_dispatched && <Zap className="w-3 h-3 text-amber-500" />}
              <span className="ml-auto">{formatDate(r.created_at)}</span>
            </div>
          </button>
        );
      })}
      {reports.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhum relatorio gerado ainda</p>
      )}
    </div>
  );
}

// ── Report Content ───────────────────────────────────────────────────────────

function ReportContent({ report }: { report: WeeklyReport }) {
  const ai = (typeof report.ai_analysis === 'object' && report.ai_analysis !== null)
    ? report.ai_analysis
    : {} as Partial<WeeklyReport['ai_analysis']>;
  const hotLeads = (report.raw_metrics?.hot_leads_without_followup || []) as HotLeadMetric[];

  return (
    <div className="space-y-4">
      {ai.executive_summary && <ExecutiveSummary text={ai.executive_summary} />}

      <HotLeadsBriefing
        briefing={typeof ai.hot_leads_briefing === 'string' ? ai.hot_leads_briefing : ''}
        leads={hotLeads}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OpportunitiesList items={Array.isArray(ai.opportunities) ? ai.opportunities : []} />
        <AlertsList items={Array.isArray(ai.alerts) ? ai.alerts : []} />
      </div>

      <SalesTalkingPoints items={Array.isArray(ai.sales_talking_points) ? ai.sales_talking_points : []} />

      <WeeklyComparison text={ai.weekly_comparison || ''} />

      <RawMetricsCollapsible metrics={report.raw_metrics || {}} />
    </div>
  );
}

// ── Help Sheet ───────────────────────────────────────────────────────────────

function HelpSheet() {
  const [openSection, setOpenSection] = useState<string | null>('visao-geral');
  const toggle = (s: string) => setOpenSection(prev => prev === s ? null : s);

  function Section({ id, title, icon: Icon, children }: {
    id: string; title: string; icon: React.ElementType; children: React.ReactNode;
  }) {
    const open = openSection === id;
    return (
      <Collapsible open={open} onOpenChange={() => toggle(id)}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-md hover:bg-gray-50">
          <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-sm font-medium flex-1">{title}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-4 pt-1 text-sm text-gray-700 space-y-2 border-l-2 border-indigo-100 ml-5">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          Como funciona a Inteligencia Semanal
        </SheetTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Guia de uso e referencia rapida para esta tela.
        </p>
      </SheetHeader>

      <div className="mt-5 space-y-1">

        <Section id="visao-geral" title="Visao Geral do Sistema" icon={Brain}>
          <p>
            Este relatorio agrega dados de toda a plataforma e usa IA para gerar insights acionaveis toda semana.
          </p>
          <div className="bg-indigo-50/70 rounded-md p-3 space-y-1 text-xs font-mono leading-relaxed mt-2">
            <p>1. Coleta 8 fontes de dados em paralelo (leads, funil, receita...)</p>
            <p className="text-indigo-400">↓</p>
            <p>2. Envia payload JSON para o LLM configurado</p>
            <p className="text-indigo-400">↓</p>
            <p>3. LLM retorna analise estruturada (JSON)</p>
            <p className="text-indigo-400">↓</p>
            <p>4. Relatorio salvo no banco + UI atualiza automaticamente</p>
            <p className="text-indigo-400">↓</p>
            <p>5. Webhook N8N disparado (email, Telegram, etc.)</p>
          </div>
          <p className="text-xs text-gray-500">
            Geracao automatica toda <strong>segunda-feira as 06:00 BRT</strong> via cron. Ou use "Gerar Agora" a qualquer momento.
          </p>
        </Section>

        <Section id="secoes" title="O que cada secao significa" icon={ScrollText}>
          <ul className="space-y-3">
            <li>
              <strong className="text-gray-900">Resumo Executivo</strong>
              <p className="text-xs mt-0.5">3–5 bullets com os achados mais importantes. Leitura rapida de 30 segundos para a dona do negocio.</p>
            </li>
            <li>
              <strong className="text-gray-900">Leads Quentes sem Follow-up</strong>
              <p className="text-xs mt-0.5">Leads temperatura quente/muito-quente sem contato nos ultimos 7 dias, ordenados por score de prioridade. Cada linha mostra email, telefone, ultima data de contato e a acao recomendada pelo diagnostico. Clique no nome para abrir o perfil completo do lead.</p>
            </li>
            <li>
              <strong className="text-gray-900">Oportunidades</strong>
              <p className="text-xs mt-0.5">Ate 5 oportunidades identificadas pela IA. Urgencia: <span className="text-red-600 font-medium">high</span> (acao imediata), <span className="text-amber-600 font-medium">medium</span> (esta semana), <span className="text-blue-600 font-medium">low</span> (planejamento).</p>
            </li>
            <li>
              <strong className="text-gray-900">Alertas</strong>
              <p className="text-xs mt-0.5">Tendencias negativas ou pontos de atencao. Severidade: <span className="text-red-600 font-medium">critical</span>, <span className="text-amber-600 font-medium">warning</span>, <span className="text-blue-600 font-medium">info</span>.</p>
            </li>
            <li>
              <strong className="text-gray-900">Pontos de Conversa para Vendas</strong>
              <p className="text-xs mt-0.5">Sugestoes de abertura personalizadas para cada lead quente, baseadas no perfil e barreiras. Use o botao de copia para colar direto no WhatsApp ou Telegram.</p>
            </li>
            <li>
              <strong className="text-gray-900">Comparativo Semanal</strong>
              <p className="text-xs mt-0.5">Analise numerica comparando esta semana com a anterior — crescimento, queda ou estabilidade.</p>
            </li>
            <li>
              <strong className="text-gray-900">Metricas Brutas</strong>
              <p className="text-xs mt-0.5">Dados crus de cada uma das 8 fontes. Util para auditar o que o LLM recebeu ou diagnosticar dados inesperados.</p>
            </li>
          </ul>
        </Section>

        <Section id="dados" title="Fontes de dados (8 blocos)" icon={Users}>
          <ul className="space-y-1.5 text-xs">
            <li><strong>Pipeline de Leads</strong> — Novos leads por temperatura, area, objetivo e UTM (semana atual vs anterior)</li>
            <li><strong>Leads Quentes sem Follow-up</strong> — Leads quentes sem contato em 7+ dias, por score de prioridade</li>
            <li><strong>Re-engajamento</strong> — Leads quentes antigos (30+ dias) sem agendamento + leads com acesso recente ao relatorio</li>
            <li><strong>Funil</strong> — Conversao em cada etapa: lead → relatorio → agendamento → assinatura/compra</li>
            <li><strong>Agendamentos</strong> — Sessoes desta semana vs anterior, proximos 7 dias, no-shows, cancelamentos</li>
            <li><strong>Receita</strong> — Assinaturas ativas, novas, cancelamentos com motivos, receita em BRL</li>
            <li><strong>Engajamento</strong> — Posts populares na comunidade, visualizacoes de relatorio, volume de WhatsApp</li>
            <li><strong>Tarefas</strong> — Tarefas vencidas, completadas e pendentes por prioridade</li>
          </ul>
        </Section>

        <Section id="aprovacao" title="Aprovacao para Assistente" icon={Users}>
          <p>Ao final do relatorio voce controla se a assistente de vendas tem acesso a ele.</p>
          <ul className="space-y-1.5 mt-1 text-xs">
            <li><strong>Toggle ON</strong> — Libera este relatorio para a assistente. So um relatorio fica ativo por vez (o mais recente aprovado).</li>
            <li><strong>Diretivas</strong> — Instrucoes extras para a assistente. Ex: "Foque em fechar consultoria esta semana. Priorize quem tem barreira financeira."</li>
            <li><strong>Toggle OFF</strong> — Revoga o acesso. A assistente para de ver este relatorio.</li>
          </ul>
        </Section>

        <Section id="configuracoes" title="Configuracoes (Prompt e LLM)" icon={Settings}>
          <p>Clique em <strong>"Configuracoes"</strong> (botao ao lado) para personalizar:</p>
          <ul className="space-y-1.5 mt-1 text-xs">
            <li>
              <strong>LLM / API de IA</strong> — Qual provedor e modelo sera usado. APIs configuradas em Admin → Configuracoes de APIs.
              Recomendado: <em>Gemini 2.0 Flash</em> (mais barato) ou <em>GPT-4o-mini</em> (mais confiavel em JSON).
            </li>
            <li>
              <strong>Prompt do Relatorio</strong> — Instrucoes enviadas ao LLM. Voce pode mudar o tom, o foco, ou adicionar regras especificas. As alteracoes valem a partir do proximo relatorio gerado.
            </li>
          </ul>
          <p className="text-xs text-gray-500">Armazenado em <code className="bg-gray-100 px-1 rounded text-xs">app_configs: weekly_report_prompt / weekly_report_api_key</code></p>
        </Section>

        <Section id="custo" title="Custo e Monitoramento" icon={DollarSign}>
          <p>Cada geracao registra o custo em <strong>Admin → Custos de API</strong>.</p>
          <ul className="space-y-1.5 mt-1 text-xs">
            <li>Custo tipico: <strong>$0.001 – $0.01 USD</strong> por relatorio (depende do modelo)</li>
            <li>Tokens de entrada: ~2.000 – 8.000 (varia com volume de dados da plataforma)</li>
            <li>Tokens de saida: ~500 – 2.000</li>
          </ul>
          <p className="text-xs text-gray-500 mt-1">
            Se custo = $0.00, o modelo pode nao estar na tabela de precificacao. Verifique <code className="bg-gray-100 px-1 rounded text-xs">app_configs → llm_model_pricing</code>.
          </p>
        </Section>

        <Section id="webhook" title="Webhook N8N" icon={Zap}>
          <p>Ao concluir, o relatorio dispara um webhook para o N8N com resumo de dados (sem dados pessoais). O N8N pode distribuir por email, Telegram, WhatsApp, etc.</p>
          <ul className="space-y-1.5 mt-1 text-xs">
            <li>Configure em <strong>Admin → Automacoes</strong>, automacao "weekly_intelligence_report"</li>
            <li>Se webhook_url estiver vazio, o disparo e ignorado sem erro</li>
            <li>O icone <Zap className="inline w-3 h-3 text-amber-500" /> na lista de historico indica que o webhook foi disparado com sucesso</li>
          </ul>
        </Section>

        <Section id="agendamento" title="Agendamento Automatico (Cron)" icon={Clock}>
          <p>Geracao automatica toda <strong>segunda-feira as 06:00 BRT (09:00 UTC)</strong> via pg_cron no Postgres.</p>
          <ul className="space-y-1.5 mt-1 text-xs">
            <li>Usa <code className="bg-gray-100 px-1 rounded">generation_method: 'scheduled'</code> sem usuario associado</li>
            <li>Para verificar execucoes: Supabase Dashboard → Database → pg_cron → Job Run Details → "generate-weekly-intelligence-report"</li>
            <li>A configuracao <code className="bg-gray-100 px-1 rounded">app_configs → weekly_report_cron_schedule</code> e apenas referencia visual — para alterar o horario edite o job no pg_cron diretamente</li>
          </ul>
        </Section>

      </div>
    </SheetContent>
  );
}

// ── Settings Sheet ───────────────────────────────────────────────────────────

function ReportSettingsSheet() {
  const { apis } = useAdminApis();
  const { getConfigValue, updateConfig, isSaving: isSavingConfig } = useAppConfigs();

  // LLM selector state
  const [llmKey, setLlmKey] = useState('');
  const configuredLlmKey = getConfigValue('weekly_report_api_key');
  if (configuredLlmKey && llmKey === '') {
    setLlmKey(configuredLlmKey);
  }

  // Prompt editor state
  const [prompt, setPrompt] = useState('');
  const [promptInited, setPromptInited] = useState(false);
  const configuredPrompt = getConfigValue('weekly_report_prompt');
  if (configuredPrompt && !promptInited) {
    setPrompt(configuredPrompt);
    setPromptInited(true);
  }

  const llmChanged = llmKey && llmKey !== configuredLlmKey;
  const promptChanged = promptInited && prompt !== configuredPrompt;

  return (
    <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Configuracoes do Relatorio
        </SheetTitle>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        {/* LLM Selector */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">LLM / API de IA</CardTitle>
            <CardDescription className="text-xs">
              Escolha qual API sera usada para gerar a analise de inteligencia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={llmKey || '_none'}
              onValueChange={v => setLlmKey(v === '_none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar API..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">
                  <span className="text-muted-foreground">Selecionar API...</span>
                </SelectItem>
                {apis
                  .filter(a => a.is_active && !NON_LLM_SLUGS.includes(a.api_key))
                  .map(api => (
                    <SelectItem key={api.api_key} value={api.api_key}>
                      {api.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              className="w-full"
              disabled={!llmChanged || isSavingConfig}
              onClick={() => updateConfig('weekly_report_api_key', llmKey)}
            >
              {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {llmChanged ? 'Salvar LLM' : 'LLM salvo'}
            </Button>
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Prompt do Relatorio</CardTitle>
            <CardDescription className="text-xs">
              Instrucoes enviadas ao LLM. Defina o tom, formato de saida, e o que priorizar na analise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={16}
              className="text-xs font-mono leading-relaxed"
              placeholder="Carregando prompt..."
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={!promptChanged || isSavingConfig}
                onClick={() => updateConfig('weekly_report_prompt', prompt)}
              >
                {isSavingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                {promptChanged ? 'Salvar Prompt' : 'Prompt salvo'}
              </Button>
              {promptChanged && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setPrompt(configuredPrompt); }}
                >
                  Desfazer
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              O prompt e lido em tempo real pelo Edge Function. Alteracoes aplicam no proximo relatorio gerado.
            </p>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminWeeklyReport() {
  const { data: latestReport, isLoading, refetch } = useLatestReport();
  const { data: history = [] } = useReportHistory();
  const generateReport = useGenerateWeeklyReport();
  const approveReport = useApproveWeeklyReport();

  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const { data: selectedReport } = useReportById(selectedHistoryId);

  const [approvalDirectives, setApprovalDirectives] = useState('');
  const [approvalToggle, setApprovalToggle] = useState(false);
  const [approvalInited, setApprovalInited] = useState<string | null>(null);

  // Show selected historical report or latest
  const displayReport = selectedHistoryId ? selectedReport : latestReport;

  // Sync approval state when displayReport changes
  if (displayReport?.id && displayReport.id !== approvalInited) {
    setApprovalToggle(displayReport.approved_for_assistant ?? false);
    setApprovalDirectives(displayReport.assistant_directives ?? '');
    setApprovalInited(displayReport.id);
  }

  const handleGenerate = () => {
    generateReport.mutate(undefined);
  };

  const handleSelectHistory = (id: string) => {
    setSelectedHistoryId(id === selectedHistoryId ? null : id);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Inteligencia Semanal</h1>
              <p className="text-sm text-gray-500">
                Relatorio de inteligencia de vendas com analise por IA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelectedHistoryId(null); refetch(); }}
              disabled={isLoading}
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" title="Ajuda">
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                </Button>
              </SheetTrigger>
              <HelpSheet />
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1.5" />
                  Configuracoes
                </Button>
              </SheetTrigger>
              <ReportSettingsSheet />
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <ScrollText className="w-4 h-4 mr-1.5" />
                  Historico
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[440px]">
                <SheetHeader>
                  <SheetTitle>Historico de Relatorios</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                  <ReportHistorySheet
                    reports={history}
                    selectedId={selectedHistoryId}
                    onSelect={handleSelectHistory}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={generateReport.isPending || latestReport?.status === 'generating'}
            >
              {generateReport.isPending || latestReport?.status === 'generating' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-1.5" />
                  Gerar Agora
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <StatusCards report={latestReport} />

        {/* Selected history indicator */}
        {selectedHistoryId && displayReport && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-2 rounded-md">
            <ScrollText className="w-4 h-4" />
            Visualizando relatorio de {formatShortDate(displayReport.period_start)} — {formatShortDate(displayReport.period_end)}
            <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => setSelectedHistoryId(null)}>
              Ver mais recente
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !displayReport && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        )}

        {/* Generating State */}
        {displayReport?.status === 'generating' && (
          <Card className="border-yellow-200 bg-yellow-50/30">
            <CardContent className="flex items-center gap-3 p-6">
              <Loader2 className="w-5 h-5 animate-spin text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Gerando relatorio de inteligencia...</p>
                <p className="text-xs text-gray-500">
                  Consultando 8 fontes de dados e analisando com IA. Isso leva 20-40 segundos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {displayReport?.status === 'error' && (
          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Erro ao gerar relatorio</p>
                <p className="text-xs text-red-600">{displayReport.error_message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Report */}
        {displayReport?.status === 'completed' && (
          <>
            <ReportContent report={displayReport} />

            {/* Approval section for assistant */}
            <Card className="border-indigo-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Aprovacao para Assistente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    id="approve-assistant"
                    checked={approvalToggle}
                    onCheckedChange={setApprovalToggle}
                  />
                  <Label htmlFor="approve-assistant" className="text-sm">
                    Aprovar este relatorio para a assistente
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="directives" className="text-sm font-medium">
                    Diretivas para a assistente (opcional)
                  </Label>
                  <Textarea
                    id="directives"
                    placeholder="Ex: Foque nos leads quentes desta semana. Priorize follow-ups com Maria e João..."
                    value={approvalDirectives}
                    onChange={(e) => setApprovalDirectives(e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    approveReport.mutate({
                      id: displayReport.id,
                      approved: approvalToggle,
                      directives: approvalDirectives,
                    })
                  }
                  disabled={approveReport.isPending}
                >
                  {approveReport.isPending ? 'Salvando...' : 'Salvar Aprovacao'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !displayReport && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Brain className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhum relatorio gerado</h3>
              <p className="text-sm text-gray-500 mb-4">
                Clique em "Gerar Agora" para criar o primeiro relatorio de inteligencia semanal.
              </p>
              <Button size="sm" onClick={handleGenerate} disabled={generateReport.isPending}>
                <Brain className="w-4 h-4 mr-1.5" />
                Gerar Primeiro Relatorio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
