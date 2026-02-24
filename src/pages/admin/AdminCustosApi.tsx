import { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, Loader2, TrendingUp, Cpu, Users, Zap, Settings2, Save, HelpCircle, BookOpen, ChevronRight, Wrench } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useAdminCosts, type PeriodPreset } from '@/hooks/useAdminCosts';
import { useAppConfigs } from '@/hooks/useAppConfigs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Chart Configs ────────────────────────────────────────────────────

const dailyCostConfig: ChartConfig = {
  cost: { label: 'Custo (USD)', color: 'hsl(var(--chart-1))' },
};

const functionCostConfig: ChartConfig = {
  cost: { label: 'Custo (USD)', color: 'hsl(var(--chart-2))' },
};

const providerCostConfig: ChartConfig = {
  cost: { label: 'Custo (USD)', color: 'hsl(var(--chart-3))' },
};

// ─── Formatters ───────────────────────────────────────────────────────

const fmtUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(v);

const fmtNumber = (v: number) =>
  new Intl.NumberFormat('pt-BR').format(v);

const FUNCTION_LABELS: Record<string, string> = {
  'analyze-resume': 'ResumePass AI',
  'format-lead-report': 'Relatorio Lead',
  'translate-title': 'Tradutor Titulo',
  'analyze-post-for-upsell': 'Upsell',
  'recommend-product': 'Recomendacao',
  'generate-daily-priorities': 'Prioridades CRM',
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10b981',
  anthropic: '#8b5cf6',
  openrouter: '#f97316',
  resend: '#f59e0b',
};

// ─── Period Selector ──────────────────────────────────────────────────

const periods: { key: PeriodPreset; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
];

// ─── Pricing Editor ───────────────────────────────────────────────────

interface ModelPricing {
  input_per_1m?: number;
  output_per_1m?: number;
  per_email?: number;
}

const MODEL_LABELS: Record<string, string> = {
  'gpt-4o-mini': 'GPT-4o mini',
  'gpt-4.1-mini': 'GPT-4.1 mini',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'resend_email': 'Resend (e-mail)',
};

function PricingEditor() {
  const { getConfigValue, updateConfig, isSaving, isLoading } = useAppConfigs();
  const [pricing, setPricing] = useState<Record<string, ModelPricing>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const raw = getConfigValue('llm_model_pricing');
    if (raw) {
      try {
        setPricing(JSON.parse(raw));
      } catch {
        // keep empty
      }
    }
  }, [getConfigValue]);

  const updateModel = (model: string, field: string, value: string) => {
    const num = parseFloat(value);
    setPricing(prev => ({
      ...prev,
      [model]: { ...prev[model], [field]: isNaN(num) ? 0 : num },
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await updateConfig('llm_model_pricing', JSON.stringify(pricing));
    setIsDirty(false);
  };

  if (isLoading) return <Skeleton className="h-[160px] w-full rounded-xl" />;

  const models = Object.keys(pricing).length > 0 ? Object.keys(pricing) : Object.keys(MODEL_LABELS);

  return (
    <div className="bg-card rounded-[20px] border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Tabela de Precos por Modelo
          </h2>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Salvar
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Modelo</th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Input ($/1M tokens)</th>
              <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Output ($/1M tokens)</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const p = pricing[model] || {};
              const isEmail = 'per_email' in p;
              return (
                <tr key={model} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-medium">{MODEL_LABELS[model] || model}</td>
                  <td className="py-2.5 px-3 text-right">
                    {isEmail ? (
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={p.per_email ?? 0}
                        onChange={(e) => updateModel(model, 'per_email', e.target.value)}
                        className="w-28 ml-auto text-right h-8 text-sm"
                        placeholder="por email"
                      />
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.input_per_1m ?? 0}
                        onChange={(e) => updateModel(model, 'input_per_1m', e.target.value)}
                        className="w-28 ml-auto text-right h-8 text-sm"
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {isEmail ? (
                      <span className="text-muted-foreground text-xs">por e-mail acima</span>
                    ) : (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.output_per_1m ?? 0}
                        onChange={(e) => updateModel(model, 'output_per_1m', e.target.value)}
                        className="w-28 ml-auto text-right h-8 text-sm"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Precos em USD. Altere quando os valores dos provedores mudarem. O custo e recalculado automaticamente nas proximas chamadas.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export default function AdminCustosApi() {
  const {
    period,
    setPeriod,
    summary,
    isLoadingSummary,
    dailyCosts,
    isLoadingDaily,
    byFunction,
    isLoadingByFunction,
    byProvider,
    isLoadingByProvider,
    topUsers,
    isLoadingTopUsers,
    refetchAll,
  } = useAdminCosts();

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Custos de API</h1>
              <p className="text-sm text-muted-foreground">
                Acompanhe gastos com OpenAI, Anthropic e outros provedores de IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-muted rounded-lg p-0.5">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    period === p.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={refetchAll}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Documentação
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Documentação — Custos de API
                  </SheetTitle>
                  <SheetDescription>Como os custos são registrados, calculados e monitorados</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 text-sm">
                  <section className="space-y-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                      Propósito
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Monitora gastos com APIs de IA (OpenAI, Anthropic, OpenRouter) e email (Resend). Cada chamada de Edge Function registra automaticamente o uso de tokens e calcula o custo com base na tabela de preços configurada. Provedores são detectados automaticamente pela base_url configurada em /admin/configuracoes-apis.
                    </p>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                      Como os custos são registrados
                    </h3>
                    <ul className="space-y-2 text-muted-foreground">
                      {[
                        { item: "Registro automático", detail: "Cada Edge Function com IA chama logApiCost() após a resposta, registrando input_tokens, output_tokens, modelo e duração." },
                        { item: "Tabela de origem", detail: "api_cost_logs — contém edge_function, provider, model, tokens, cost_usd, status, metadata." },
                        { item: "Edge Functions monitoradas", detail: "analyze-resume, format-lead-report, translate-title, analyze-post-for-upsell, recommend-product, generate-daily-priorities, suggest-lead-tasks, suggest-whatsapp-messages." },
                        { item: "Provedores suportados", detail: "OpenAI, Anthropic, OpenRouter (detectado via base_url em api_configs) e Resend. Chamadas OpenRouter aparecem como provedor separado com cor laranja." },
                        { item: "Custo de email", detail: "Registrado por envio (campo per_email na tabela de preços), não por tokens." },
                      ].map((i, idx) => (
                        <li key={idx} className="flex gap-3">
                          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div><span className="font-medium text-foreground">{i.item}: </span>{i.detail}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                      Tabela de preços por modelo
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Editável diretamente nesta página (seção "Tabela de Preços por Modelo"). Os valores são salvos em <code className="bg-muted px-1 rounded text-xs">app_configs</code> com a chave <code className="bg-muted px-1 rounded text-xs">llm_model_pricing</code>.
                    </p>
                    <ul className="space-y-1 text-muted-foreground text-xs">
                      {[
                        "Valores em USD por 1 milhão de tokens (input e output separados).",
                        "Para email, o campo per_email representa o custo por mensagem enviada.",
                        "Atualize sempre que o provedor mudar os preços — o sistema recalcula nas próximas chamadas.",
                        "Clique em \"Salvar\" após editar; sem salvar, as alterações são descartadas.",
                      ].map((t, i) => <li key={i} className="flex gap-2"><ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />{t}</li>)}
                    </ul>
                  </section>
                  <div className="border-t" />
                  <section className="space-y-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      Troubleshooting
                    </h3>
                    <div className="space-y-3">
                      {[
                        { p: "Custo zerado ($0) com tokens registrados", c: "O modelo usado não tem entrada na tabela de preços abaixo.", f: "Adicione o modelo e seus preços na seção 'Tabela de Preços por Modelo' e clique em Salvar. Para OpenRouter, use o nome exato do modelo (ex: google/gemini-2.0-flash)." },
                        { p: "Função não aparece no gráfico", c: "Nenhuma chamada no período selecionado, ou a função não usa logApiCost().", f: "Mude o período ou verifique os logs da função no Supabase → Edge Functions → Logs." },
                        { p: "OpenRouter aparecendo como OpenAI", c: "API configurada antes da atualização do sistema de detecção (fev/2026).", f: "Os novos registros já aparecem como 'openrouter'. Os registros antigos ficaram como 'openai' — isso é esperado." },
                        { p: "Custo calculado incorretamente", c: "Tabela de preços desatualizada.", f: "Atualize os preços na seção abaixo e clique em Salvar. O sistema recalcula nas próximas chamadas (não retroativo)." },
                        { p: "Fallback aparece em Custos", c: "É esperado — quando o sistema usa o fallback, registra dois logs: o do erro primário e o do fallback (metadata: used_fallback: true).", f: "Confira a coluna de metadados na tabela api_cost_logs se precisar distingui-los." },
                      ].map((item, i) => (
                        <div key={i} className="rounded-lg border p-3 space-y-1">
                          <p className="font-medium text-destructive text-xs">{item.p}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Causa:</span> {item.c}</p>
                          <p className="text-muted-foreground text-xs"><span className="font-medium text-foreground">Fix:</span> {item.f}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ─── Summary Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            label="Hoje"
            value={summary?.today}
            icon={<Zap className="w-4 h-4" />}
            isLoading={isLoadingSummary}
          />
          <SummaryCard
            label="Esta Semana"
            value={summary?.thisWeek}
            icon={<TrendingUp className="w-4 h-4" />}
            isLoading={isLoadingSummary}
          />
          <SummaryCard
            label="Este Mes"
            value={summary?.thisMonth}
            icon={<DollarSign className="w-4 h-4" />}
            isLoading={isLoadingSummary}
            highlight
          />
          <SummaryCard
            label="Mes Passado"
            value={summary?.lastMonth}
            icon={<DollarSign className="w-4 h-4" />}
            isLoading={isLoadingSummary}
          />
          <SummaryCard
            label="Requests (mes)"
            value={summary?.totalRequests}
            isCount
            icon={<Cpu className="w-4 h-4" />}
            isLoading={isLoadingSummary}
          />
        </div>

        {/* ─── Daily Cost Trend ────────────────────────────────────── */}
        <div className="bg-card rounded-[20px] border border-border p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
            Tendencia Diaria de Custos
          </h2>
          {isLoadingDaily ? (
            <Skeleton className="h-[250px] w-full rounded-xl" />
          ) : dailyCosts.length === 0 ? (
            <EmptyState message="Nenhum dado de custo registrado para o periodo selecionado." />
          ) : (
            <ChartContainer config={dailyCostConfig} className="h-[250px] w-full">
              <LineChart data={dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(new Date(d + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => fmtUSD(Number(value))}
                      labelFormatter={(label) => format(new Date(label + 'T12:00:00'), 'dd MMM yyyy', { locale: ptBR })}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-cost)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>

        {/* ─── Cost by Function & Provider (2-col) ─────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* By Function */}
          <div className="bg-card rounded-[20px] border border-border p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
              Custo por Funcao
            </h2>
            {isLoadingByFunction ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : byFunction.length === 0 ? (
              <EmptyState message="Nenhum dado disponivel." />
            ) : (
              <ChartContainer config={functionCostConfig} className="h-[220px] w-full">
                <BarChart data={byFunction} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                  <YAxis
                    dataKey="edge_function"
                    type="category"
                    width={110}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => FUNCTION_LABELS[v] || v}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => fmtUSD(Number(value))}
                        labelFormatter={(label) => FUNCTION_LABELS[label] || label}
                      />
                    }
                  />
                  <Bar dataKey="cost" fill="var(--color-cost)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          {/* By Provider */}
          <div className="bg-card rounded-[20px] border border-border p-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
              Custo por Provedor
            </h2>
            {isLoadingByProvider ? (
              <Skeleton className="h-[220px] w-full rounded-xl" />
            ) : byProvider.length === 0 ? (
              <EmptyState message="Nenhum dado disponivel." />
            ) : (
              <div className="space-y-4">
                {byProvider.map((p) => (
                  <div key={p.provider} className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PROVIDER_COLORS[p.provider] || '#6b7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium capitalize">{p.provider}</span>
                        <span className="font-bold text-lg">{fmtUSD(p.cost)}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
                        <span>{fmtNumber(p.requests)} requests</span>
                        <span>{fmtNumber(p.input_tokens)} input tokens</span>
                        <span>{fmtNumber(p.output_tokens)} output tokens</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${byProvider.length > 0 ? Math.max(5, (p.cost / Math.max(...byProvider.map(x => x.cost))) * 100) : 0}%`,
                            backgroundColor: PROVIDER_COLORS[p.provider] || '#6b7280',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Cost per Request by Function ─────────────────────────── */}
        <div className="bg-card rounded-[20px] border border-border p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
            Custo Medio por Requisicao
          </h2>
          {isLoadingByFunction ? (
            <Skeleton className="h-[100px] w-full rounded-xl" />
          ) : byFunction.length === 0 ? (
            <EmptyState message="Nenhum dado disponivel." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Funcao</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Requests</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Custo Total</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Custo Medio</th>
                  </tr>
                </thead>
                <tbody>
                  {byFunction.map((f) => (
                    <tr key={f.edge_function} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-medium">
                        {FUNCTION_LABELS[f.edge_function] || f.edge_function}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{fmtNumber(f.requests)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium">{fmtUSD(f.cost)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">{fmtUSD(f.avg_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Top Users ───────────────────────────────────────────── */}
        <div className="bg-card rounded-[20px] border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Maiores Consumidores
            </h2>
          </div>
          {isLoadingTopUsers ? (
            <Skeleton className="h-[120px] w-full rounded-xl" />
          ) : topUsers.length === 0 ? (
            <EmptyState message="Nenhum uso de usuario registrado no periodo." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">#</th>
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Usuario</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Requests</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u, i) => (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 px-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium">{u.full_name || 'Usuario'}</div>
                        {u.email && <div className="text-xs text-muted-foreground">{u.email}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{fmtNumber(u.requests)}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium">{fmtUSD(u.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── Pricing Editor ──────────────────────────────────────── */}
        <PricingEditor />
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  isLoading,
  isCount,
  highlight,
}: {
  label: string;
  value: number | undefined | null;
  icon: React.ReactNode;
  isLoading: boolean;
  isCount?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-[20px] border border-border p-5 flex flex-col gap-2',
        highlight && 'ring-2 ring-emerald-500/20 border-emerald-500/30'
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24 rounded" />
      ) : (
        <span className="text-2xl font-bold tracking-tight">
          {isCount ? fmtNumber(value ?? 0) : fmtUSD(value ?? 0)}
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <DollarSign className="w-8 h-8 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
