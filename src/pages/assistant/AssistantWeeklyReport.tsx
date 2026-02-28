import { useState } from 'react';
import {
  Brain, AlertTriangle, TrendingUp, Phone, Copy, Check,
  Target, ScrollText, MessageCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  useAssistantLatestReport,
  useAssistantReportHistory,
} from '@/hooks/useAssistantWeeklyReport';
import { useReportById, type WeeklyReport, type WeeklyReportSummary, type HotLeadMetric } from '@/hooks/useAdminWeeklyReport';
import { PageHelpButton } from '@/components/assistant/PageHelpButton';
import { WEEKLY_REPORT_HELP } from '@/lib/assistantHelpContent';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), "dd MMM yyyy", { locale: ptBR });
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

// ── Components ──────────────────────────────────────────────────────────────

function DirectivesCard({ directives }: { directives: string }) {
  return (
    <Card className="border-amber-300 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-amber-600" />
          Diretivas do Admin
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">{directives}</p>
      </CardContent>
    </Card>
  );
}

function ExecutiveSummary({ text }: { text: string }) {
  const lines = text.split('\n').filter(Boolean);
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
            <li key={i} className="text-sm leading-relaxed">{line.replace(/^[-•]\s*/, '')}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function HotLeadsBriefing({ briefing, leads }: { briefing: string; leads: HotLeadMetric[] }) {
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
        {briefing && <p className="text-sm leading-relaxed text-gray-700">{briefing}</p>}
        {leads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">Nome</th>
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
                        to={`/assistant/leads/${lead.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {lead.name}
                      </Link>
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

function WeeklyComparison({ text }: { text: string }) {
  if (!text) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Comparativo Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-gray-700">{text}</p>
      </CardContent>
    </Card>
  );
}

// ── History Sheet ────────────────────────────────────────────────────────────

function HistorySheet({
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
      {reports.map((r) => (
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
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Aprovado
            </Badge>
          </div>
          <span className="text-xs text-gray-500">{formatDate(r.created_at)}</span>
        </button>
      ))}
      {reports.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nenhum relatorio aprovado ainda.</p>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AssistantWeeklyReport() {
  const { data: latestReport, isLoading } = useAssistantLatestReport();
  const { data: history = [] } = useAssistantReportHistory();

  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const { data: selectedReport } = useReportById(selectedHistoryId);

  const displayReport = selectedHistoryId ? selectedReport : latestReport;

  const handleSelectHistory = (id: string) => {
    setSelectedHistoryId(id === selectedHistoryId ? null : id);
  };

  const directives = displayReport?.assistant_directives ?? null;
  const ai = displayReport?.ai_analysis;
  const hotLeads = (displayReport?.raw_metrics?.hot_leads_without_followup || []) as HotLeadMetric[];

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
                Relatorio aprovado com diretivas e insights para sua semana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PageHelpButton
              pageTitle={WEEKLY_REPORT_HELP.pageTitle}
              description={WEEKLY_REPORT_HELP.description}
              sections={WEEKLY_REPORT_HELP.sections}
            />
            {history.length > 1 && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ScrollText className="w-4 h-4 mr-1.5" />
                    Historico
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[440px]">
                  <SheetHeader>
                    <SheetTitle>Relatorios Anteriores</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 overflow-y-auto max-h-[calc(100vh-120px)]">
                    <HistorySheet
                      reports={history}
                      selectedId={selectedHistoryId}
                      onSelect={handleSelectHistory}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

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

        {/* Loading */}
        {isLoading && !displayReport && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        )}

        {/* Report Content */}
        {displayReport?.status === 'completed' && (
          <div className="space-y-4">
            {directives && <DirectivesCard directives={directives} />}
            {ai?.executive_summary && <ExecutiveSummary text={ai.executive_summary} />}
            <HotLeadsBriefing briefing={ai?.hot_leads_briefing || ''} leads={hotLeads} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OpportunitiesList items={ai?.opportunities} />
              <AlertsList items={ai?.alerts} />
            </div>
            <SalesTalkingPoints items={ai?.sales_talking_points} />
            <WeeklyComparison text={ai?.weekly_comparison || ''} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !displayReport && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Brain className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhum relatorio aprovado</h3>
              <p className="text-sm text-gray-500">
                O admin vai aprovar o relatorio semanal para voce. Volte mais tarde!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
