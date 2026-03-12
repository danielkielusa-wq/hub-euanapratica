import { useState } from 'react';
import {
  Brain, RefreshCw, Loader2, AlertTriangle, TrendingUp, TrendingDown,
  Phone, Copy, Check, Clock, Calendar, Users, DollarSign, Percent,
  ChevronDown, ChevronRight, Zap, Target, ScrollText, Settings, HelpCircle,
  BarChart3, PieChart as PieChartIcon, Share2, Flame, MessageSquare,
  Database, Info, LineChart, CheckCircle2,
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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const NON_LLM_SLUGS = ['resend_email', 'ticto_webhook'];

// ── Shared card className (matches reference Card: bg-white rounded-xl border border-slate-200 shadow-sm) ──
const CARD = 'bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-sm';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEMP_BADGES: Record<string, string> = {
  'muito-quente': 'bg-red-100 text-red-800 border-red-200',
  'quente': 'bg-orange-100 text-orange-800 border-orange-200',
  'morno': 'bg-amber-100 text-amber-800 border-amber-200',
  'frio': 'bg-blue-100 text-blue-800 border-blue-200',
};

const URGENCY_BADGES: Record<string, string> = {
  high: 'bg-rose-100 text-rose-800 border border-rose-200',
  medium: 'bg-amber-100 text-amber-800 border border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-800 border border-rose-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  generating: { label: 'Gerando...', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  error: { label: 'Erro', color: 'bg-rose-100 text-rose-800 border-rose-200' },
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

/** Strip leading emojis from LLM text so we can add our own */
function stripLeadingEmoji(text: string): string {
  return text.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f\u20e3\s]+/u, '').trim();
}

/** Generate avatar URL from name */
function avatarUrl(name: string): string {
  const encoded = encodeURIComponent(name.trim());
  return `https://ui-avatars.com/api/?name=${encoded}&background=e0e7ff&color=4f46e5&size=32`;
}

// ── InfoBar (flat, no border/shadow — matches reference InfoBar.tsx) ─────────

function InfoBar({ report }: { report: WeeklyReport | null }) {
  const items = [
    { label: 'Último Relatório', value: report ? formatDate(report.created_at) : 'Nenhum', icon: Clock },
    { label: 'Próximo Agendado', value: 'Seg 06:00 BRT', icon: Calendar },
    { label: 'Método', value: report?.generation_method === 'scheduled' ? 'Agendado (cron)' : report ? 'Manual' : '—', icon: Zap },
    { label: 'Duração / Custo', value: report ? `${formatDuration(report.duration_ms)}${report.cost_usd ? ` / $${report.cost_usd}` : ''}` : '—', icon: DollarSign },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((item) => (
        <Card key={item.label} className="bg-white border-none shadow-none hover:shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-semibold text-slate-900">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Strategic KPIs (border-l-4, big numbers — matches reference StrategicKPIs.tsx) ──

function StrategicKPIs({ report }: { report: WeeklyReport }) {
  const metrics = report.raw_metrics || {};
  const pipeline = metrics.leads_pipeline as any;
  const funnel = metrics.funnel_metrics as any;
  const revenue = metrics.subscription_revenue as any;
  const hotLeads = (metrics.hot_leads_without_followup || []) as any[];

  const totalLeadsThisWeek = pipeline?.this_week?.total ?? pipeline?.total_new ?? null;
  const totalLeadsLastWeek = pipeline?.last_week?.total ?? null;
  const leadsDelta = (typeof totalLeadsThisWeek === 'number' && typeof totalLeadsLastWeek === 'number' && totalLeadsLastWeek > 0)
    ? Math.round(((totalLeadsThisWeek - totalLeadsLastWeek) / totalLeadsLastWeek) * 100)
    : null;

  const conversionRate = funnel?.lead_to_booking_rate ?? funnel?.conversion_rate ?? 0;
  const activeSubscriptions = revenue?.active_subscriptions ?? revenue?.active_count ?? null;
  const mrrValue = revenue?.mrr ?? revenue?.total_mrr ?? null;
  const hotCount = hotLeads.length;

  const kpis = [
    {
      label: 'Pipeline Potencial (Hot)',
      value: hotCount > 0 ? `${hotCount} leads` : '—',
      accent: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
      icon: Target,
      footer: typeof totalLeadsThisWeek === 'number' ? `${totalLeadsThisWeek} novos leads esta semana` : null,
      footerColor: 'text-emerald-600',
    },
    {
      label: 'Conversão (Lead → Agenda)',
      value: typeof conversionRate === 'number' ? `${conversionRate}%` : String(conversionRate),
      accent: 'border-l-rose-500',
      iconBg: 'bg-rose-100 text-rose-600',
      icon: Percent,
      footer: leadsDelta !== null ? `${leadsDelta > 0 ? '+' : ''}${leadsDelta}% vs semana anterior` : null,
      footerColor: leadsDelta !== null && leadsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600',
      footerIcon: leadsDelta !== null && leadsDelta < 0 ? TrendingDown : null,
    },
    {
      label: 'MRR Ativo',
      value: mrrValue !== null ? `R$ ${Number(mrrValue).toLocaleString('pt-BR')}` : activeSubscriptions !== null ? `${activeSubscriptions} assinaturas` : '—',
      accent: 'border-l-indigo-500',
      iconBg: 'bg-indigo-100 text-indigo-600',
      icon: DollarSign,
      footer: activeSubscriptions !== null && mrrValue !== null ? `${activeSubscriptions} assinaturas ativas` : null,
      footerColor: 'text-slate-600',
    },
    {
      label: 'Custo Geração',
      value: report.cost_usd ? `$${report.cost_usd}` : '—',
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
      icon: TrendingDown,
      footer: report.duration_ms ? `Gerado em ${formatDuration(report.duration_ms)}` : null,
      footerColor: 'text-slate-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className={cn(CARD, 'border-l-4', kpi.accent)}>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.value}</h3>
              </div>
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', kpi.iconBg)}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            {kpi.footer && (
              <div className="mt-4 flex items-center text-sm">
                <span className={cn('font-medium flex items-center', kpi.footerColor)}>
                  {kpi.footerIcon && <kpi.footerIcon className="w-4 h-4 mr-1" />}
                  {kpi.footer}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Charts Section (matches reference Charts.tsx) ────────────────────────────

const TASK_COLORS = ['#ef4444', '#f59e0b', '#10b981'];
const SOURCE_COLORS = ['#ec4899', '#0ea5e9', '#8b5cf6', '#14b8a6', '#f97316'];

function ChartsSection({ report }: { report: WeeklyReport }) {
  const metrics = report.raw_metrics || {};
  const pipeline = metrics.leads_pipeline as any;
  const tasks = metrics.task_health as any;

  const pipelineData: { name: string; leads: number }[] = [];
  if (pipeline?.last_week?.total != null) pipelineData.push({ name: 'Semana Passada', leads: pipeline.last_week.total });
  if (pipeline?.this_week?.total != null) pipelineData.push({ name: 'Esta Semana', leads: pipeline.this_week.total });
  else if (pipeline?.total_new != null) pipelineData.push({ name: 'Esta Semana', leads: pipeline.total_new });

  const taskData: { name: string; value: number }[] = [];
  if (tasks) {
    if (tasks.overdue_count != null) taskData.push({ name: 'Vencidas', value: tasks.overdue_count });
    if (tasks.pending_count != null) taskData.push({ name: 'Pendentes', value: tasks.pending_count });
    if (tasks.completed_count != null || tasks.completed_this_week != null)
      taskData.push({ name: 'Concluídas', value: tasks.completed_this_week ?? tasks.completed_count });
  }

  const sourceData: { name: string; value: number }[] = [];
  const bySource = pipeline?.this_week?.by_source || pipeline?.by_source;
  if (bySource && typeof bySource === 'object') {
    Object.entries(bySource).forEach(([name, value]) => {
      if (typeof value === 'number' && value > 0) sourceData.push({ name, value });
    });
    sourceData.sort((a, b) => b.value - a.value);
  }

  if (pipelineData.length === 0 && taskData.length === 0 && sourceData.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {pipelineData.length > 0 && (
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-lg">Pipeline de Leads</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="leads" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {sourceData.length > 0 && (
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-lg">Origem dos Leads</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="35%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {sourceData.map((_, idx) => <Cell key={idx} fill={SOURCE_COLORS[idx % SOURCE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 absolute right-4 w-32">
              {sourceData.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }} />
                  <span className="text-slate-600 truncate">{entry.name}</span>
                  <span className="font-semibold text-slate-900 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {taskData.length > 0 && (
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-lg">Status das Tarefas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taskData} cx="35%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  {taskData.map((_, idx) => <Cell key={idx} fill={TASK_COLORS[idx % TASK_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3 absolute right-4 w-28">
              {taskData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TASK_COLORS[idx % TASK_COLORS.length] }} />
                  <span className="text-slate-600 truncate">{entry.name}</span>
                  <span className="font-semibold text-slate-900 ml-auto">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Executive Summary (matches reference ExecutiveSummary.tsx) ────────────────

const SUMMARY_EMOJIS = ['📉', '🔥', '📊', '⚠️', '🔔'];

function ExecutiveSummary({ text }: { text: string | string[] }) {
  const lines = Array.isArray(text) ? text : (typeof text === 'string' ? text.split('\n').filter(Boolean) : [String(text)]);
  if (lines.length === 0) return null;
  return (
    <Card className={cn(CARD, 'mb-6')}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" />
          <CardTitle className="text-lg">Resumo Executivo</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          {lines.map((line, i) => {
            const clean = stripLeadingEmoji(String(line).replace(/^[-•]\s*/, ''));
            const colonIdx = clean.indexOf(':');
            const hasBoldLead = colonIdx > 0 && colonIdx < 80;
            return (
              <li key={i} className="flex items-start gap-3">
                <span className="text-xl leading-none">{SUMMARY_EMOJIS[i % SUMMARY_EMOJIS.length]}</span>
                <p className="text-slate-700 leading-relaxed">
                  {hasBoldLead ? (
                    <>
                      <strong className="text-slate-900 font-semibold">{clean.slice(0, colonIdx + 1)}</strong>
                      {clean.slice(colonIdx + 1)}
                    </>
                  ) : (
                    <strong className="text-slate-900 font-semibold">{clean}</strong>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

// ── Hot Leads Briefing (matches reference HotLeads.tsx) ──────────────────────

function HotLeadsBriefing({ briefing, leads }: { briefing: string; leads: HotLeadMetric[] }) {
  return (
    <Card className={cn(CARD, 'mb-6')}>
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <CardTitle className="text-lg">Leads Quentes sem Follow-up</CardTitle>
        </div>
        {leads.length > 0 && (
          <Badge className="bg-red-50 text-red-600 border-red-100">{leads.length} leads</Badge>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {briefing && (
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">{String(briefing)}</p>
        )}

        {leads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Temp.</th>
                  <th className="px-4 py-3 font-medium">Área</th>
                  <th className="px-4 py-3 font-medium">Último Contato</th>
                  <th className="px-4 py-3 font-medium">Ação Recomendada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      <div className="flex items-center gap-3">
                        <img src={avatarUrl(lead.name)} alt={lead.name} className="w-6 h-6 rounded-full" />
                        <Link to={`/admin/leads/${lead.id}`} className="hover:underline">{lead.name}</Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{lead.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', TEMP_BADGES[lead.temperature] || '')}>{lead.temperature}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.area || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={lead.last_interaction_date ? 'text-slate-600' : 'text-rose-500 font-medium'}>
                        {lead.last_interaction_date ? formatShortDate(lead.last_interaction_date) : 'Nunca'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{lead.recommended_first_action || lead.recommended_product || '—'}</td>
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

// ── Opportunities & Alerts (matches reference OpportunitiesAndAlerts.tsx) ─────

function OpportunitiesAndAlerts({ opportunities, alerts }: {
  opportunities: WeeklyReport['ai_analysis']['opportunities'];
  alerts: WeeklyReport['ai_analysis']['alerts'];
}) {
  const hasOpp = opportunities && opportunities.length > 0;
  const hasAlerts = alerts && alerts.length > 0;
  if (!hasOpp && !hasAlerts) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {hasOpp && (
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <CardTitle className="text-lg">Oportunidades</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            {opportunities!.map((opp, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Badge variant="outline" className={cn('mt-1 flex-shrink-0', URGENCY_BADGES[opp.urgency] || '')}>{opp.urgency}</Badge>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{opp.title}</h4>
                  <p className="text-sm text-slate-600 mb-2 leading-relaxed">{opp.description}</p>
                  {opp.suggested_action && (
                    <p className="text-sm text-indigo-600 italic bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">{opp.suggested_action}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {hasAlerts && (
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">Alertas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            {alerts!.map((alert, i) => (
              <div key={i} className="flex gap-4 items-start">
                <Badge variant="outline" className={cn('mt-1 flex-shrink-0', SEVERITY_BADGES[alert.severity] || '')}>{alert.severity}</Badge>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">{alert.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{alert.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sales Talking Points (matches reference TalkingPoints.tsx) ────────────────

function SalesTalkingPoints({ items }: { items: WeeklyReport['ai_analysis']['sales_talking_points'] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  if (!items || items.length === 0) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <Card className={cn(CARD, 'mb-6')}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <CardTitle className="text-lg">Pontos de Conversa para Vendas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group relative">
            <div className="flex items-center gap-3 mb-3">
              <img src={avatarUrl(item.lead_name)} alt={item.lead_name} className="w-8 h-8 rounded-full shadow-sm" />
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{item.lead_name}</h4>
                {(item as any).email && <p className="text-xs text-slate-500">{(item as any).email}</p>}
              </div>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pr-8">"{item.opener}"</p>
            <button
              onClick={() => handleCopy(item.opener, i)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Weekly Comparison (matches reference BottomSections — LineChart icon) ─────

function WeeklyComparison({ text }: { text: string | string[] }) {
  if (!text) return null;
  const content = Array.isArray(text) ? text.join('\n') : String(text);
  if (!content) return null;
  return (
    <Card className={CARD}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-indigo-500" />
          <CardTitle className="text-lg">Comparativo Semanal</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}

// ── Raw Metrics Collapsible (matches reference BottomSections — Database icon) ─

const SECTION_LABELS: Record<string, string> = {
  leads_pipeline: 'Pipeline de Leads',
  hot_leads_without_followup: 'Leads Quentes sem Follow-up',
  reengagement_opportunities: 'Oportunidades de Re-engajamento',
  funnel_metrics: 'Métricas de Funil',
  booking_activity: 'Atividade de Agendamentos',
  subscription_revenue: 'Assinaturas e Receita',
  engagement_signals: 'Sinais de Engajamento',
  task_health: 'Saúde das Tarefas',
};

function RawMetricsCollapsible({ metrics }: { metrics: WeeklyReport['raw_metrics'] }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const sections = Object.entries(metrics || {}).filter(([key]) => key !== 'period' && SECTION_LABELS[key]);

  return (
    <Card className={CARD}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-slate-500" />
          <CardTitle className="text-lg">Métricas Brutas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {sections.map(([key, value]) => (
          <Collapsible key={key} open={openSections.has(key)} onOpenChange={() => toggle(key)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-slate-700">{SECTION_LABELS[key] || key}</span>
              <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform', openSections.has(key) && 'rotate-90')} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto mt-1 border border-slate-100 text-slate-600">
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

function ReportHistorySheet({ reports, selectedId, onSelect }: {
  reports: WeeklyReportSummary[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {reports.map((r) => {
        const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.error;
        return (
          <button key={r.id} onClick={() => onSelect(r.id)} className={cn(
            'w-full text-left p-4 rounded-xl border transition-colors',
            selectedId === r.id ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'
          )}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-slate-900">{formatShortDate(r.period_start)} — {formatShortDate(r.period_end)}</span>
              <Badge variant="outline" className={cn('text-xs', sc.color)}>{sc.label}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{r.generation_method === 'scheduled' ? 'Agendado' : 'Manual'}</span>
              <span>{formatDuration(r.duration_ms)}</span>
              {r.webhook_dispatched && <Zap className="w-3 h-3 text-amber-500" />}
              <span className="ml-auto">{formatDate(r.created_at)}</span>
            </div>
          </button>
        );
      })}
      {reports.length === 0 && <p className="text-sm text-slate-500 text-center py-8">Nenhum relatório gerado ainda</p>}
    </div>
  );
}

// ── Report Content ───────────────────────────────────────────────────────────

function ReportContent({ report }: { report: WeeklyReport }) {
  const ai = (typeof report.ai_analysis === 'object' && report.ai_analysis !== null)
    ? report.ai_analysis : {} as Partial<WeeklyReport['ai_analysis']>;
  const hotLeads = (report.raw_metrics?.hot_leads_without_followup || []) as HotLeadMetric[];

  return (
    <div>
      {ai.executive_summary && <ExecutiveSummary text={ai.executive_summary} />}
      <ChartsSection report={report} />
      <HotLeadsBriefing briefing={typeof ai.hot_leads_briefing === 'string' ? ai.hot_leads_briefing : ''} leads={hotLeads} />
      <OpportunitiesAndAlerts opportunities={Array.isArray(ai.opportunities) ? ai.opportunities : []} alerts={Array.isArray(ai.alerts) ? ai.alerts : []} />
      <SalesTalkingPoints items={Array.isArray(ai.sales_talking_points) ? ai.sales_talking_points : []} />
      <div className="space-y-6">
        <WeeklyComparison text={ai.weekly_comparison || ''} />
        <RawMetricsCollapsible metrics={report.raw_metrics || {}} />
      </div>
    </div>
  );
}

// ── Help Sheet ───────────────────────────────────────────────────────────────

function HelpSheet() {
  const [openSection, setOpenSection] = useState<string | null>('visao-geral');
  const toggle = (s: string) => setOpenSection(prev => prev === s ? null : s);

  function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ElementType; children: React.ReactNode }) {
    const open = openSection === id;
    return (
      <Collapsible open={open} onOpenChange={() => toggle(id)}>
        <CollapsibleTrigger className="flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
          <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700 flex-1">{title}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-4 pt-1 text-sm text-slate-600 space-y-2 border-l-2 border-indigo-100 ml-5">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <HelpCircle className="w-5 h-5 text-indigo-500" />Como funciona a Inteligência Semanal
        </SheetTitle>
        <p className="text-xs text-slate-500 mt-1">Guia de uso e referência rápida.</p>
      </SheetHeader>
      <div className="mt-5 space-y-1">
        <Section id="visao-geral" title="Visão Geral" icon={Brain}>
          <p>Agrega dados da plataforma e usa IA para gerar insights acionáveis toda semana.</p>
          <div className="bg-indigo-50/70 rounded-lg p-3 space-y-1 text-xs font-mono leading-relaxed mt-2 border border-indigo-100/50">
            <p>1. Coleta 8 fontes de dados em paralelo</p><p className="text-indigo-400">↓</p>
            <p>2. Envia payload JSON para o LLM</p><p className="text-indigo-400">↓</p>
            <p>3. LLM retorna análise estruturada</p><p className="text-indigo-400">↓</p>
            <p>4. Relatório salvo + UI atualiza</p><p className="text-indigo-400">↓</p>
            <p>5. Webhook N8N disparado</p>
          </div>
          <p className="text-xs text-slate-500">Automático toda <strong className="text-slate-900 font-semibold">segunda 06:00 BRT</strong> via cron.</p>
        </Section>
        <Section id="secoes" title="Seções do Relatório" icon={ScrollText}>
          <ul className="space-y-2 text-xs">
            {[['Resumo Executivo','3–5 bullets principais'],['Leads Quentes','Sem contato nos últimos 7 dias'],['Oportunidades','Até 5 oportunidades com urgência'],['Alertas','Tendências negativas'],['Pontos de Conversa','Aberturas personalizadas para vendas'],['Comparativo','Esta semana vs anterior'],['Métricas Brutas','Dados crus das 8 fontes']].map(([t,d])=>(
              <li key={t}><strong className="text-slate-900">{t}</strong> — {d}</li>
            ))}
          </ul>
        </Section>
        <Section id="dados" title="Fontes de Dados (8)" icon={Users}>
          <ul className="space-y-1 text-xs">
            {['Pipeline de Leads','Leads Quentes','Re-engajamento','Funil','Agendamentos','Receita','Engajamento','Tarefas'].map(s=><li key={s}>{s}</li>)}
          </ul>
        </Section>
        <Section id="config" title="Configurações" icon={Settings}>
          <p>Escolha o LLM e customize o prompt em <strong className="text-slate-900">Configurações</strong>.</p>
        </Section>
        <Section id="custo" title="Custo" icon={DollarSign}>
          <p>Típico: $0.001–$0.01/relatório. Veja em <strong className="text-slate-900">Admin → Custos de API</strong>.</p>
        </Section>
        <Section id="cron" title="Agendamento" icon={Clock}>
          <p>Toda <strong className="text-slate-900">segunda 06:00 BRT</strong> via pg_cron.</p>
        </Section>
      </div>
    </SheetContent>
  );
}

// ── Settings Sheet ───────────────────────────────────────────────────────────

function ReportSettingsSheet() {
  const { apis } = useAdminApis();
  const { getConfigValue, updateConfig, isSaving } = useAppConfigs();

  const [llmKey, setLlmKey] = useState('');
  const configuredLlmKey = getConfigValue('weekly_report_api_key');
  if (configuredLlmKey && llmKey === '') setLlmKey(configuredLlmKey);

  const [prompt, setPrompt] = useState('');
  const [promptInited, setPromptInited] = useState(false);
  const configuredPrompt = getConfigValue('weekly_report_prompt');
  if (configuredPrompt && !promptInited) { setPrompt(configuredPrompt); setPromptInited(true); }

  const llmChanged = llmKey && llmKey !== configuredLlmKey;
  const promptChanged = promptInited && prompt !== configuredPrompt;

  return (
    <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Settings className="w-5 h-5 text-slate-500" />Configurações</SheetTitle>
      </SheetHeader>
      <div className="mt-6 space-y-6">
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900">LLM / API de IA</CardTitle>
            <CardDescription className="text-xs text-slate-500">Escolha qual API será usada.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Select value={llmKey || '_none'} onValueChange={v => setLlmKey(v === '_none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar API..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none"><span className="text-muted-foreground">Selecionar API...</span></SelectItem>
                {apis.filter(a => a.is_active && !NON_LLM_SLUGS.includes(a.api_key)).map(api => (
                  <SelectItem key={api.api_key} value={api.api_key}>{api.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50" disabled={!llmChanged || isSaving} onClick={() => updateConfig('weekly_report_api_key', llmKey)}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> : null}{llmChanged ? 'Salvar LLM' : 'LLM salvo'}
            </button>
          </CardContent>
        </Card>
        <Card className={CARD}>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-900">Prompt</CardTitle>
            <CardDescription className="text-xs text-slate-500">Instruções enviadas ao LLM.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={16} className="text-xs font-mono leading-relaxed" placeholder="Carregando..." />
            <div className="flex items-center gap-2">
              <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50" disabled={!promptChanged || isSaving} onClick={() => updateConfig('weekly_report_prompt', prompt)}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> : null}{promptChanged ? 'Salvar Prompt' : 'Prompt salvo'}
              </button>
              {promptChanged && <Button variant="ghost" size="sm" onClick={() => setPrompt(configuredPrompt)}>Desfazer</Button>}
            </div>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  );
}

// ── Approval (matches reference BottomSections — CheckCircle2 icon) ──────────

function ApprovalSection({ approvalToggle, setApprovalToggle, approvalDirectives, setApprovalDirectives, onSave, isPending }: {
  approvalToggle: boolean; setApprovalToggle: (v: boolean) => void; approvalDirectives: string; setApprovalDirectives: (v: string) => void; onSave: () => void; isPending: boolean;
}) {
  return (
    <Card className={CARD}>
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-500" />
          <CardTitle className="text-lg">Aprovação para Assistente</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <Switch id="approve-assistant" checked={approvalToggle} onCheckedChange={setApprovalToggle} />
          <Label htmlFor="approve-assistant" className="text-sm font-medium text-slate-900">Aprovar este relatório para a assistente</Label>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Diretivas para a assistente (opcional)</label>
          <textarea className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none h-24" placeholder="Ex: Foque nos leads quentes desta semana..." value={approvalDirectives} onChange={e => setApprovalDirectives(e.target.value)} />
        </div>
        <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50" onClick={onSave} disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Aprovação'}
        </button>
      </CardContent>
    </Card>
  );
}

// ── Main Page (matches reference App.tsx layout) ─────────────────────────────

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

  const displayReport = selectedHistoryId ? selectedReport : latestReport;

  if (displayReport?.id && displayReport.id !== approvalInited) {
    setApprovalToggle(displayReport.approved_for_assistant ?? false);
    setApprovalDirectives(displayReport.assistant_directives ?? '');
    setApprovalInited(displayReport.id);
  }

  return (
    <DashboardLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      <div className="flex h-full bg-slate-50/50 text-slate-900 overflow-hidden" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Header ─────────────────────────────────────────────── */}
          <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Inteligência Semanal</h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium">Relatório de inteligência de vendas com análise por IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-1 sm:pb-0">
              <button onClick={() => { setSelectedHistoryId(null); refetch(); }} disabled={isLoading} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors shrink-0">
                <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
              </button>
              <Sheet>
                <SheetTrigger asChild><button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><HelpCircle className="w-5 h-5" /></button></SheetTrigger>
                <HelpSheet />
              </Sheet>
              <Sheet>
                <SheetTrigger asChild><button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><Settings className="w-5 h-5" /></button></SheetTrigger>
                <ReportSettingsSheet />
              </Sheet>
              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    <Clock className="w-4 h-4" />Histórico
                  </button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[440px]">
                  <SheetHeader><SheetTitle className="text-lg font-semibold tracking-tight">Histórico de Relatórios</SheetTitle></SheetHeader>
                  <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                    <ReportHistorySheet reports={history} selectedId={selectedHistoryId} onSelect={(id) => setSelectedHistoryId(id === selectedHistoryId ? null : id)} />
                  </div>
                </SheetContent>
              </Sheet>
              <button
                onClick={() => generateReport.mutate(undefined)}
                disabled={generateReport.isPending || latestReport?.status === 'generating'}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generateReport.isPending || latestReport?.status === 'generating'
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</>
                  : <><Brain className="w-4 h-4" />Gerar Agora</>}
              </button>
            </div>
          </header>

          {/* ── Content ────────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="animate-in fade-in duration-500">

              <InfoBar report={latestReport} />
              {displayReport?.status === 'completed' && <StrategicKPIs report={displayReport} />}

              {selectedHistoryId && displayReport && (
                <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 p-3 rounded-xl mb-6">
                  <ScrollText className="w-4 h-4" />
                  Visualizando relatório de {formatShortDate(displayReport.period_start)} — {formatShortDate(displayReport.period_end)}
                  <button onClick={() => setSelectedHistoryId(null)} className="ml-auto text-xs hover:underline">Ver mais recente</button>
                </div>
              )}

              {isLoading && !displayReport && <div className="space-y-4"><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="h-60 w-full rounded-xl" /></div>}

              {displayReport?.status === 'generating' && (
                <Card className={cn(CARD, 'border-amber-200 bg-amber-50/30 mb-6')}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>
                    <div><p className="text-sm font-semibold text-slate-900">Gerando relatório...</p><p className="text-xs text-slate-500 mt-0.5">Consultando 8 fontes e analisando com IA. 20-40s.</p></div>
                  </CardContent>
                </Card>
              )}

              {displayReport?.status === 'error' && (
                <Card className={cn(CARD, 'border-rose-200 bg-rose-50/30 mb-6')}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
                    <div><p className="text-sm font-semibold text-rose-700">Erro ao gerar relatório</p><p className="text-xs text-rose-600 mt-0.5">{displayReport.error_message}</p></div>
                  </CardContent>
                </Card>
              )}

              {displayReport?.status === 'completed' && (
                <>
                  <ReportContent report={displayReport} />
                  <div className="mt-6">
                    <ApprovalSection
                      approvalToggle={approvalToggle} setApprovalToggle={setApprovalToggle}
                      approvalDirectives={approvalDirectives} setApprovalDirectives={setApprovalDirectives}
                      onSave={() => approveReport.mutate({ id: displayReport.id, approved: approvalToggle, directives: approvalDirectives })}
                      isPending={approveReport.isPending}
                    />
                  </div>
                </>
              )}

              {!isLoading && !displayReport && (
                <Card className={cn(CARD, 'border-dashed border-slate-300')}>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><Brain className="w-8 h-8 text-slate-400" /></div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Nenhum relatório gerado</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm">Clique em "Gerar Agora" para criar o primeiro relatório.</p>
                    <button onClick={() => generateReport.mutate(undefined)} disabled={generateReport.isPending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50">
                      <Brain className="w-4 h-4" />Gerar Primeiro Relatório
                    </button>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
