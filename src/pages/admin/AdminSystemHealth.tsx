import { useState, Component, type ReactNode, type ErrorInfo } from 'react';
import {
  Activity,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Mail,
  MailCheck,
  MailX,
  CreditCard,
  Database,
  Brain,
  Sparkles,
  Webhook,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  useSystemHealth,
  type HealthReport,
  type CheckResult,
} from '@/hooks/useSystemHealth';

// ─── ErrorBoundary ──────────────────────────────────────────────────
class HealthErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AdminSystemHealth] Render crash:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <DashboardLayout>
          <div className="max-w-2xl mx-auto mt-12 bg-red-50 rounded-[28px] border border-red-200 p-8 text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-red-800 mb-2">Erro na página Saúde do Sistema</h2>
            <pre className="text-xs text-red-700 bg-red-100 rounded-xl p-4 mt-3 text-left overflow-auto max-h-60 whitespace-pre-wrap">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => this.setState({ error: null })}
            >
              Tentar Novamente
            </Button>
          </div>
        </DashboardLayout>
      );
    }
    return this.props.children;
  }
}

// ─── Icon mapping for known API slugs ────────────────────────────────
const API_ICONS: Record<string, React.ElementType> = {
  openai_api: Brain,
  anthropic_api: Sparkles,
  resend_email: Mail,
  ticto_webhook: CreditCard,
};

const API_COLORS: Record<string, string> = {
  openai_api: 'text-emerald-600 bg-emerald-50',
  anthropic_api: 'text-purple-600 bg-purple-50',
  resend_email: 'text-blue-600 bg-blue-50',
  ticto_webhook: 'text-amber-600 bg-amber-50',
};

// ─── Chart config for email volume ───────────────────────────────────
const emailChartConfig: ChartConfig = {
  sent: { label: 'Enviados', color: '#22c55e' },
  failed: { label: 'Falharam', color: '#ef4444' },
};

// ─── Main Component ──────────────────────────────────────────────────

export default function AdminSystemHealth() {
  return (
    <HealthErrorBoundary>
      <AdminSystemHealthContent />
    </HealthErrorBoundary>
  );
}

function AdminSystemHealthContent() {
  const {
    healthReport,
    isLoadingHealth,
    healthError,
    runHealthCheck,
    apis,
    isLoadingApis,
    apiTests,
    testingApi,
    testApiConnection,
    emailMetrics,
    isLoadingEmails,
    webhookMetrics,
    isLoadingWebhooks,
    refetchAll,
  } = useSystemHealth();

  const [showAllChecks, setShowAllChecks] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Saúde do Sistema
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão unificada de integrações, emails, webhooks e saúde geral da plataforma.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refetchAll} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar Dados
            </Button>
            <Button onClick={runHealthCheck} disabled={isLoadingHealth} className="gap-2">
              {isLoadingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Health Check
            </Button>
          </div>
        </div>

        {/* ─── Section 1: Overall Health Banner ──────────────────── */}
        {healthReport && (
          <HealthBanner report={healthReport} />
        )}
        {healthError && !healthReport && (
          <div className="bg-red-50 rounded-[28px] border border-red-200 p-6 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-800">Erro ao executar Health Check</p>
            <p className="text-xs text-red-600 mt-1">{healthError}</p>
          </div>
        )}
        {!healthReport && !isLoadingHealth && !healthError && (
          <div className="bg-card rounded-[28px] border border-border p-6 text-center text-muted-foreground">
            <p className="text-sm">Clique em <strong>Health Check</strong> para executar a verificação completa do sistema.</p>
            <p className="text-xs mt-1">Este é o mesmo health-check executado diariamente via N8N.</p>
          </div>
        )}

        {/* ─── Section 2: Integration Status Cards ───────────────── */}
        <div>
          <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-widest">Integrações</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Supabase (always shown — not in api_configs) */}
            <IntegrationCard
              name="Supabase DB"
              icon={Database}
              color="text-green-600 bg-green-50"
              isActive={true}
              testResult={healthReport ? {
                success: healthReport.status !== 'down',
                message: healthReport.status === 'healthy'
                  ? `Saudável (${healthReport.passed}/${healthReport.total_checks} checks OK)`
                  : healthReport.status === 'degraded'
                    ? `Degradado (${healthReport.warned} avisos, ${healthReport.failed} falhas)`
                    : 'Sistema fora do ar',
              } : null}
              isTesting={isLoadingHealth}
              onTest={runHealthCheck}
            />

            {/* Dynamic from api_configs */}
            {isLoadingApis ? (
              <div className="col-span-3 flex items-center justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              apis.map(api => (
                <IntegrationCard
                  key={api.api_key}
                  name={api.name}
                  icon={API_ICONS[api.api_key] || Webhook}
                  color={API_COLORS[api.api_key] || 'text-gray-600 bg-gray-50'}
                  isActive={api.is_active}
                  testResult={apiTests[api.api_key] ?? null}
                  isTesting={testingApi === api.api_key}
                  onTest={() => testApiConnection(api.api_key)}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── Section 3: Email Metrics ──────────────────────────── */}
        <div>
          <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-widest">Emails</h2>
          {isLoadingEmails ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : emailMetrics ? (
            <div className="space-y-4">
              {/* Metric cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Enviados (24h)" value={String(emailMetrics.sent24h)} icon={MailCheck} color="text-green-600 bg-green-50" />
                <MetricCard label="Falharam (24h)" value={String(emailMetrics.failed24h)} icon={MailX} color={emailMetrics.failed24h > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'} />
                <MetricCard label="Enviados (7d)" value={String(emailMetrics.sent7d)} icon={Mail} color="text-blue-600 bg-blue-50" />
                <MetricCard label="Taxa de Sucesso" value={`${emailMetrics.successRate}%`} icon={CheckCircle2} color={emailMetrics.successRate >= 95 ? 'text-green-600 bg-green-50' : emailMetrics.successRate >= 80 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'} />
              </div>

              {/* By template breakdown */}
              {emailMetrics.byTemplate.length > 0 && (
                <div className="bg-card rounded-[28px] border border-border p-6">
                  <h3 className="text-sm font-black text-foreground mb-3">Volume por Template (7 dias)</h3>
                  <ChartContainer config={emailChartConfig} className="h-[200px] w-full">
                    <BarChart data={emailMetrics.byTemplate.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="template_name"
                        tickFormatter={(v: string) => v.replace(/_/g, ' ').replace(/^(.{12}).*/, '$1…')}
                        fontSize={11}
                      />
                      <YAxis allowDecimals={false} fontSize={11} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sent" fill="var(--color-sent)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {emailMetrics.byTemplate.length === 0 && (
                <div className="bg-card rounded-[28px] border border-border p-6 text-center text-muted-foreground text-sm">
                  Nenhum email registrado nos últimos 7 dias. Os logs começarão a aparecer após o deploy das Edge Functions atualizadas.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ─── Section 4: Webhook & Payment Activity ─────────────── */}
        <div>
          <h2 className="text-sm font-black text-foreground mb-3 uppercase tracking-widest">Webhooks & Pagamentos</h2>
          {isLoadingWebhooks ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : webhookMetrics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <MetricCard label="Recebidos (24h)" value={String(webhookMetrics.received24h)} icon={Webhook} color="text-blue-600 bg-blue-50" />
                <MetricCard label="Processados (24h)" value={String(webhookMetrics.processed24h)} icon={CheckCircle2} color="text-green-600 bg-green-50" />
                <MetricCard label="Erros (24h)" value={String(webhookMetrics.errors24h)} icon={AlertTriangle} color={webhookMetrics.errors24h > 0 ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'} />
              </div>

              {/* Event type breakdown + Recent events */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* By event type */}
                {webhookMetrics.byEventType.length > 0 && (
                  <div className="bg-card rounded-[28px] border border-border p-6">
                    <h3 className="text-sm font-black text-foreground mb-3">Por Tipo de Evento (24h)</h3>
                    <div className="space-y-2">
                      {webhookMetrics.byEventType.slice(0, 8).map(et => (
                        <div key={et.event_type} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground font-mono">{et.event_type}</span>
                          <Badge variant="secondary">{et.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent events */}
                {webhookMetrics.recentEvents.length > 0 && (
                  <div className="bg-card rounded-[28px] border border-border p-6">
                    <h3 className="text-sm font-black text-foreground mb-3">Últimos Eventos</h3>
                    <div className="space-y-2">
                      {webhookMetrics.recentEvents.map(ev => (
                        <div key={ev.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <StatusDot status={ev.status === 'processed' ? 'pass' : ev.status === 'received' ? 'warn' : 'fail'} />
                            <span className="font-mono text-muted-foreground">{ev.event_type}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ev.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {webhookMetrics.received24h === 0 && (
                <div className="bg-card rounded-[28px] border border-border p-6 text-center text-muted-foreground text-sm">
                  Nenhum webhook recebido nas últimas 24 horas.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ─── Section 5: Health Check Details ────────────────────── */}
        {healthReport && (
          <div>
            <button
              onClick={() => setShowAllChecks(!showAllChecks)}
              className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-widest mb-3 hover:text-primary transition-colors"
            >
              Detalhes do Health Check
              {showAllChecks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAllChecks && (
              <div className="bg-card rounded-[28px] border border-border p-6 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Executado em {new Date(healthReport.timestamp).toLocaleString('pt-BR')}</span>
                  <span>{healthReport.total_duration_ms}ms total</span>
                </div>

                {/* Failures and warnings first */}
                {[...healthReport.checks]
                  .sort((a, b) => {
                    const order = { fail: 0, warn: 1, pass: 2 };
                    return order[a.status] - order[b.status];
                  })
                  .map((check, i) => (
                    <HealthCheckRow key={i} check={check} />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function HealthBanner({ report }: { report: HealthReport }) {
  const statusConfig = {
    healthy: { label: 'Sistema Saudável', color: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2, iconColor: 'text-green-500' },
    degraded: { label: 'Sistema Degradado', color: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle, iconColor: 'text-amber-500' },
    down: { label: 'Sistema Fora do Ar', color: 'bg-red-50 border-red-200 text-red-800', icon: XCircle, iconColor: 'text-red-500' },
  };
  const cfg = statusConfig[report.status as keyof typeof statusConfig] ?? statusConfig.degraded;
  const Icon = cfg.icon;

  return (
    <div className={cn('rounded-[28px] border p-5 flex items-center justify-between', cfg.color)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('w-7 h-7', cfg.iconColor)} />
        <div>
          <p className="font-black text-lg">{cfg.label}</p>
          <p className="text-xs opacity-75">
            {report.passed} passou · {report.warned} avisos · {report.failed} falhas · {report.total_duration_ms}ms
          </p>
        </div>
      </div>
      <div className="text-xs opacity-60 text-right hidden sm:block">
        <p>{new Date(report.timestamp).toLocaleString('pt-BR')}</p>
        <p>{report.environment}</p>
      </div>
    </div>
  );
}

function IntegrationCard({
  name,
  icon: Icon,
  color,
  isActive,
  testResult,
  isTesting,
  onTest,
}: {
  name: string;
  icon: React.ElementType;
  color: string;
  isActive: boolean;
  testResult: { success: boolean; message: string } | null;
  isTesting: boolean;
  onTest: () => void;
}) {
  return (
    <div className="bg-card rounded-[20px] border border-border p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{name}</p>
            <StatusDot status={!isActive ? 'inactive' : testResult ? (testResult.success ? 'pass' : 'fail') : 'unknown'} showLabel />
          </div>
        </div>
      </div>

      {testResult && (
        <p className="text-xs text-muted-foreground line-clamp-2">{testResult.message}</p>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={onTest}
        disabled={isTesting}
        className="w-full gap-1.5 mt-auto"
      >
        {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
        Testar
      </Button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-card rounded-[20px] border border-border p-5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function StatusDot({ status, showLabel }: { status: 'pass' | 'warn' | 'fail' | 'unknown' | 'inactive'; showLabel?: boolean }) {
  const config = {
    pass: { color: 'bg-green-500', label: 'Ativo' },
    warn: { color: 'bg-amber-500', label: 'Aviso' },
    fail: { color: 'bg-red-500', label: 'Falha' },
    unknown: { color: 'bg-gray-400', label: 'Não testado' },
    inactive: { color: 'bg-gray-400', label: 'Inativo' },
  };
  const cfg = config[status];
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-2 h-2 rounded-full', cfg.color)} />
      {showLabel && <span className="text-xs text-muted-foreground">{cfg.label}</span>}
    </div>
  );
}

function HealthCheckRow({ check }: { check: CheckResult }) {
  const statusBadge = {
    pass: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>,
    warn: <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Aviso</Badge>,
    fail: <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Falha</Badge>,
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {statusBadge[check.status]}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{check.name}</p>
          {check.error && (
            <p className="text-xs text-red-600 mt-0.5 truncate">{check.error}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        <Clock className="w-3 h-3" />
        {check.duration}ms
      </div>
    </div>
  );
}
