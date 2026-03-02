import { useState } from 'react';
import {
  BarChart2, RefreshCw, Loader2, Users, UserPlus, CreditCard,
  DollarSign, TrendingDown, Zap, Sparkles, Info, HelpCircle, BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useAdminAnalytics, type AnalyticsPeriod } from '@/hooks/useAdminAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Chart Configs ────────────────────────────────────────────────────

const growthConfig: ChartConfig = {
  leads: { label: 'Leads', color: '#3b82f6' },
  signups: { label: 'Cadastros', color: '#10b981' },
};

const toolConfig: ChartConfig = {
  credits: { label: 'Créditos', color: '#8b5cf6' },
};

const funnelConfig: ChartConfig = {
  value: { label: 'Total', color: '#3b82f6' },
};

// ─── Constants ────────────────────────────────────────────────────────

const TEMP_COLORS: Record<string, string> = {
  'muito-quente': '#ef4444',
  'quente': '#f59e0b',
  'morno': '#3b82f6',
  'frio': '#8b5cf6',
};

const TEMP_LABELS: Record<string, string> = {
  'muito-quente': 'Muito Quente',
  'quente': 'Quente',
  'morno': 'Morno',
  'frio': 'Frio',
};

const ACTIVITY_COLORS: Record<string, string> = {
  lead: 'bg-blue-500',
  signup: 'bg-emerald-500',
  booking: 'bg-violet-500',
  subscription: 'bg-amber-500',
};

const periods: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
];

const fmtNumber = (v: number) => new Intl.NumberFormat('pt-BR').format(v);
const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v);

// ─── InfoTip ──────────────────────────────────────────────────────────

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors focus:outline-none">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] whitespace-pre-line leading-relaxed text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────

function KPICard({
  label, value, icon: Icon, isLoading, suffix, hint, tooltip,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  isLoading?: boolean;
  suffix?: string;
  hint?: string;
  tooltip?: string;
}) {
  return (
    <div className="bg-card rounded-[20px] border border-border p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
        </div>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-24 rounded" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
      )}
      {hint && <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{hint}</span>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────

function SectionCard({
  title, children, className, tooltip,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}) {
  return (
    <div className={cn('bg-card rounded-[20px] border border-border p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex-1">{title}</h2>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      {children}
    </div>
  );
}

// ─── Ops Stat ─────────────────────────────────────────────────────────

function OpsStat({
  label, value, tooltip,
}: {
  label: string;
  value: string | number;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      <span className="text-base font-bold tabular-nums">{value}</span>
    </div>
  );
}

// ─── Documentation Sheet ──────────────────────────────────────────────

function DocSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {num}
        </span>
        {title}
      </h3>
      <div className="text-muted-foreground leading-relaxed space-y-1.5 pl-8">
        {children}
      </div>
    </section>
  );
}

function DocsSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          Documentação
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Como interpretar o Analytics
          </SheetTitle>
          <SheetDescription>
            Guia de leitura para cada métrica e como agir sobre elas.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 text-sm">

          <DocSection num="1" title="KPIs Principais">
            <p><strong>Novos Leads</strong> — diagnósticos preenchidos no período. Mede o topo do funil de aquisição. Compara apenas leads dentro do período selecionado.</p>
            <p><strong>Novos Cadastros</strong> — usuários que criaram conta na plataforma. Mede conversão de lead anônimo em usuário identificado.</p>
            <p><strong>Assinaturas Ativas</strong> — total de assinaturas ativas agora, independente do período. Indica a saúde da base pagante.</p>
            <p><strong>MRR</strong> — Receita Recorrente Mensal estimada. Para planos anuais, divide o valor pelo 12. É uma aproximação — não inclui pagamentos avulsos.</p>
            <p><strong>Churn 30d</strong> — percentual de assinaturas canceladas nos últimos 30 dias em relação à base ativa. Acima de 5% é sinal de alerta.</p>
            <p><strong>Créditos Usados</strong> — total de créditos consumidos nas ferramentas (ResumePass=3 créditos, Tradutor=1, Prime Jobs=1).</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="2" title="Gráfico de Crescimento">
            <p>Mostra a evolução diária de novos leads (azul) e cadastros (verde) ao longo do período selecionado.</p>
            <p><strong>O que observar:</strong> picos isolados podem indicar campanhas de tráfego. Crescimento constante de cadastros acima de leads indica boa taxa de conversão. Leads sem crescimento de cadastros indica atrito no fluxo de onboarding.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="3" title="Funil de Conversão">
            <p>Mostra os 3 estágios principais: Leads → Cadastros → Assinaturas. A porcentagem abaixo é a taxa Lead→Cadastro no período.</p>
            <p><strong>Benchmark:</strong> taxa acima de 15% é boa para diagnósticos; acima de 3% lead→assinatura é excelente para plataformas de conteúdo.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="4" title="Temperatura dos Leads">
            <p>Distribuição dos leads qualificados por temperatura, calculada pelo algoritmo de scoring.</p>
            <p><strong>Muito Quente 🔴</strong> — alta urgência, budget e perfil. Prioridade máxima de contato (menos de 24h).</p>
            <p><strong>Quente 🟡</strong> — bom fit, mas pode ter 1–2 barreiras. Contato em até 48h.</p>
            <p><strong>Morno 🔵</strong> — lead qualificado mas sem urgência. Fluxo de nutrição por WhatsApp/email.</p>
            <p><strong>Frio 🟣</strong> — perfil ainda fora do momento ideal. Re-engajar em 30–60 dias.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="5" title="Uso de Ferramentas">
            <p>Créditos consumidos por ferramenta no período. Indica quais produtos têm mais adoção e onde estão os custos de IA.</p>
            <p><strong>ResumePass AI</strong> — gera currículo adaptado para vagas nos EUA (3 créditos). Alto uso = produto de maior valor percebido.</p>
            <p><strong>Tradutor de Títulos</strong> — converte cargo em inglês americano (1 crédito). Uso frequente = users em fase de pesquisa.</p>
            <p><strong>Prime Jobs</strong> — candidatura a vagas (1 crédito). Uso indica usuários na fase ativa de busca.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="6" title="Operações">
            <p><strong>WhatsApp Enviadas/Recebidas</strong> — mensagens do período. Alta relação enviadas/recebidas pode indicar baixo engajamento nos flows. Opt-outs acima de 1% por dia é sinal de conteúdo invasivo.</p>
            <p><strong>Email — Taxa de Sucesso</strong> — percentual de emails aceitos pelo Resend. Abaixo de 95% indica problemas de entregabilidade ou endereços inválidos.</p>
            <p><strong>No-show 30d</strong> — percentual de agendamentos onde o aluno não compareceu. Acima de 20% sugere fluxo de lembrete deficiente ou desalinhamento de expectativas.</p>
            <p><strong>Comunidade</strong> — posts, comentários e likes criados no período. Indicador de saúde do engajamento dos assinantes.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="7" title="Páginas Mais Acessadas">
            <p>Ranking das páginas com mais visualizações, baseado nos eventos <code>page_view</code> registrados automaticamente pela plataforma.</p>
            <p><strong>O que observar:</strong> páginas de ferramenta com muitos acessos indicam interesse. Páginas de pricing/planos com muitos acessos indicam intenção de compra — bom momento para follow-up.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="8" title="Resumo do Analista (IA)">
            <p>Texto gerado pela IA ao clicar "Gerar Resumo" ou pelo cron diário (23h BRT). A IA recebe todas as métricas do dia e escreve um resumo executivo em português, estruturado em 6 blocos: headline, crescimento, receita, engajamento, operações e alerta.</p>
            <p><strong>Receber pelo Telegram/WhatsApp:</strong> configure o webhook URL em <em>Automações N8N → "Resumo Diário de Analytics"</em>. O payload inclui o texto + link para esta página.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="9" title="Troubleshooting">
            <p><strong>Métricas zeradas?</strong> Verifique se o período selecionado tem dados. Use "Hoje" para confirmar que queries funcionam.</p>
            <p><strong>Páginas sem views?</strong> O componente <code>AnalyticsTracker</code> precisa estar montado. Verifique se está nas páginas que não aparecem.</p>
            <p><strong>MRR parece baixo?</strong> Assinaturas sem plano associado ou com <code>billing_cycle = NULL</code> são tratadas como mensais.</p>
            <p><strong>Resumo não gerado?</strong> Verifique se <code>daily_analytics_api_key</code> e <code>openai_api</code> estão configurados em <em>Configurações → APIs Externas</em>.</p>
          </DocSection>

        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function AdminAnalytics() {
  const {
    period, setPeriod,
    growth, isLoadingGrowth,
    revenue, isLoadingRevenue,
    toolUsage, isLoadingTools,
    temperature, isLoadingTemp,
    ops, isLoadingOps,
    topPages, isLoadingPages,
    activity, isLoadingActivity,
    lastSnapshot,
    refetchAll,
  } = useAdminAnalytics();

  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refetchAll();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleGenerateNow = async () => {
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke('generate-daily-analytics', {
        body: { generation_method: 'manual' },
      });
      if (error) throw error;
      toast({ title: 'Analytics gerado!', description: 'Resumo do dia atualizado.' });
      refetchAll();
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Funnel data
  const funnelData = [
    { name: 'Leads', value: growth?.totalLeads ?? 0, fill: '#3b82f6' },
    { name: 'Cadastros', value: growth?.totalSignups ?? 0, fill: '#10b981' },
    { name: 'Assinaturas', value: revenue?.newSubsToday ?? 0, fill: '#8b5cf6' },
  ];

  const leadToSignup = growth && growth.totalLeads > 0
    ? Math.round((growth.totalSignups / growth.totalLeads) * 100)
    : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

          {/* Header */}
          <PageHeader title="Analytics" subtitle="Visão geral da utilização do sistema." icon={BarChart2}>
            <div className="flex items-center gap-2 flex-wrap">
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

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              </Button>

              <DocsSheet />

              <Button size="sm" onClick={handleGenerateNow} disabled={isGenerating} className="gap-2">
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar Resumo
              </Button>
            </div>
          </PageHeader>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <KPICard
              label="Novos Leads"
              value={fmtNumber(growth?.totalLeads ?? 0)}
              icon={Users}
              isLoading={isLoadingGrowth}
              tooltip="Diagnósticos preenchidos no período selecionado. Mede o topo do funil de aquisição."
            />
            <KPICard
              label="Novos Cadastros"
              value={fmtNumber(growth?.totalSignups ?? 0)}
              icon={UserPlus}
              isLoading={isLoadingGrowth}
              tooltip="Usuários que criaram conta na plataforma no período. Mede a conversão de lead anônimo em usuário identificado."
            />
            <KPICard
              label="Assinaturas"
              value={fmtNumber(revenue?.activeSubscriptions ?? 0)}
              icon={CreditCard}
              isLoading={isLoadingRevenue}
              hint="atual"
              tooltip="Total de assinaturas com status 'ativo' agora — independente do período selecionado."
            />
            <KPICard
              label="MRR"
              value={fmtBRL(revenue?.mrrEstimate ?? 0)}
              icon={DollarSign}
              isLoading={isLoadingRevenue}
              hint="atual"
              tooltip="Receita Recorrente Mensal estimada. Planos anuais são divididos por 12. Não inclui vendas avulsas."
            />
            <KPICard
              label="Churn 30d"
              value={revenue?.churnPercent30d ?? 0}
              suffix="%"
              icon={TrendingDown}
              isLoading={isLoadingRevenue}
              hint="aprox."
              tooltip={`Cancelamentos nos últimos 30 dias ÷ (ativos + cancelamentos). Valor aproximado.\n\nReferência: abaixo de 3% = saudável · 3–7% = atenção · acima de 7% = alerta.`}
            />
            <KPICard
              label="Créditos"
              value={fmtNumber(toolUsage?.totalCredits ?? 0)}
              icon={Zap}
              isLoading={isLoadingTools}
              tooltip="Total de créditos consumidos nas ferramentas no período. ResumePass=3 créditos, Tradutor=1, Prime Jobs=1."
            />
          </div>

          {/* Growth Chart */}
          <SectionCard
            title="Crescimento"
            tooltip="Evolução diária de novos leads e cadastros. Picos indicam campanhas. Crescimento de cadastros acima de leads indica boa conversão."
          >
            {isLoadingGrowth ? (
              <Skeleton className="h-[280px] w-full rounded-xl" />
            ) : (growth?.dailySeries?.length ?? 0) === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <ChartContainer config={growthConfig} className="h-[280px] w-full">
                <LineChart data={growth!.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Leads" />
                  <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Cadastros" />
                </LineChart>
              </ChartContainer>
            )}
          </SectionCard>

          {/* Funnel + Temperature row */}
          <div className="grid lg:grid-cols-5 gap-6">
            <SectionCard
              title="Funil de Conversão"
              className="lg:col-span-3"
              tooltip="Os 3 estágios do funil no período. Benchmark: >15% Lead→Cadastro é bom; >3% Lead→Assinatura é excelente."
            >
              {isLoadingGrowth || isLoadingRevenue ? (
                <Skeleton className="h-[200px] w-full rounded-xl" />
              ) : (
                <div className="space-y-4">
                  <ChartContainer config={funnelConfig} className="h-[180px] w-full">
                    <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                        {funnelData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  <p className="text-xs text-muted-foreground text-center">
                    Lead → Cadastro: <span className="font-bold text-foreground">{leadToSignup}%</span>
                  </p>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Temperatura dos Leads"
              className="lg:col-span-2"
              tooltip={"Distribuição dos leads qualificados por temperatura.\n🔴 Muito Quente — contato em <24h\n🟡 Quente — contato em <48h\n🔵 Morno — fluxo de nutrição\n🟣 Frio — re-engajar em 30–60d"}
            >
              {isLoadingTemp ? (
                <Skeleton className="h-[200px] w-full rounded-xl" />
              ) : temperature.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados.
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={temperature}
                        dataKey="count"
                        nameKey="temperature"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {temperature.map((entry, i) => (
                          <Cell key={i} fill={TEMP_COLORS[entry.temperature] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Legend
                        formatter={(value: string) => TEMP_LABELS[value] || value}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Tool Usage */}
          <SectionCard
            title="Uso de Ferramentas"
            tooltip="Créditos consumidos por ferramenta no período. Alto uso de ResumePass indica produto de maior valor percebido; Prime Jobs indica fase ativa de busca."
          >
            {isLoadingTools ? (
              <Skeleton className="h-[180px] w-full rounded-xl" />
            ) : !toolUsage || toolUsage.byApp.length === 0 ? (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                Sem dados para o período.
              </div>
            ) : (
              <ChartContainer config={toolConfig} className="h-[180px] w-full">
                <BarChart data={toolUsage.byApp} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="label" type="category" width={140} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="credits" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={24} name="Créditos" />
                </BarChart>
              </ChartContainer>
            )}
          </SectionCard>

          {/* Operations Row */}
          <div className="grid lg:grid-cols-4 gap-4">
            <SectionCard
              title="WhatsApp"
              tooltip="Mensagens enviadas e recebidas no período via Evolution API. Opt-out = usuário enviou STOP."
            >
              {isLoadingOps ? (
                <Skeleton className="h-24 w-full rounded" />
              ) : (
                <div className="space-y-3">
                  <OpsStat
                    label="Enviadas"
                    value={fmtNumber(ops?.whatsappOutbound ?? 0)}
                    tooltip="Mensagens enviadas pela plataforma no período."
                  />
                  <OpsStat
                    label="Recebidas"
                    value={fmtNumber(ops?.whatsappInbound ?? 0)}
                    tooltip="Mensagens recebidas de leads/usuários no período."
                  />
                  <OpsStat
                    label="Opt-outs"
                    value={fmtNumber(ops?.whatsappOptouts ?? 0)}
                    tooltip="Usuários que enviaram STOP no período. Acima de 1%/dia é sinal de conteúdo invasivo."
                  />
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Email"
              tooltip="Emails disparados via Resend no período. Taxa de sucesso abaixo de 95% indica problemas de entregabilidade."
            >
              {isLoadingOps ? (
                <Skeleton className="h-24 w-full rounded" />
              ) : (
                <div className="space-y-3">
                  <OpsStat
                    label="Enviados"
                    value={fmtNumber(ops?.emailSent ?? 0)}
                    tooltip="Total de emails disparados no período (todos os templates)."
                  />
                  <OpsStat
                    label="Taxa de Sucesso"
                    value={`${ops?.emailSuccessRate ?? 100}%`}
                    tooltip="Aceitos pelo Resend / total. Abaixo de 95% investigue rejeições no painel Resend."
                  />
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Agendamentos"
              tooltip="Sessões de mentoria criadas no período. No-show calculado sobre os últimos 30 dias."
            >
              {isLoadingOps ? (
                <Skeleton className="h-24 w-full rounded" />
              ) : (
                <div className="space-y-3">
                  <OpsStat
                    label="Total"
                    value={fmtNumber(ops?.bookingsTotal ?? 0)}
                    tooltip="Agendamentos criados no período selecionado."
                  />
                  <OpsStat
                    label="Completados"
                    value={fmtNumber(ops?.bookingsCompleted ?? 0)}
                    tooltip="Sessões marcadas como completadas no período."
                  />
                  <OpsStat
                    label="No-show 30d"
                    value={`${ops?.bookingsNoShowRate30d ?? 0}%`}
                    tooltip="Percentual de sessões com no-show nos últimos 30 dias. Acima de 20% revise o fluxo de lembretes."
                  />
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Comunidade"
              tooltip="Conteúdo gerado por usuários no período. Indicador de engajamento dos assinantes ativos."
            >
              {isLoadingOps ? (
                <Skeleton className="h-24 w-full rounded" />
              ) : (
                <div className="space-y-3">
                  <OpsStat
                    label="Posts"
                    value={fmtNumber(ops?.communityPosts ?? 0)}
                    tooltip="Publicações criadas na comunidade no período."
                  />
                  <OpsStat
                    label="Comentários"
                    value={fmtNumber(ops?.communityComments ?? 0)}
                    tooltip="Comentários em posts da comunidade no período."
                  />
                  <OpsStat
                    label="Likes"
                    value={fmtNumber(ops?.communityLikes ?? 0)}
                    tooltip="Curtidas em posts e comentários no período."
                  />
                </div>
              )}
            </SectionCard>
          </div>

          {/* Top Pages + Activity row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <SectionCard
              title="Páginas Mais Acessadas"
              tooltip="Ranking de views por rota, baseado em eventos page_view. Muitos acessos em /assinar ou /planos indicam intenção de compra — bom momento para follow-up."
            >
              {isLoadingPages ? (
                <Skeleton className="h-[250px] w-full rounded" />
              ) : topPages.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados de page views.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">#</th>
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Página</th>
                        <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((p, i) => (
                        <tr key={p.path} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-2 px-3 font-medium truncate max-w-[200px]">{p.path}</td>
                          <td className="py-2 px-3 text-right tabular-nums font-medium">{fmtNumber(p.count)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Atividade Recente"
              tooltip="Feed das últimas 20 ações na plataforma (novos leads, cadastros, bookings, assinaturas). Atualizado a cada minuto."
            >
              {isLoadingActivity ? (
                <Skeleton className="h-[250px] w-full rounded" />
              ) : activity.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  Sem atividade recente.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-0">
                  {activity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0"
                    >
                      <div className={cn('w-2 h-2 rounded-full shrink-0', ACTIVITY_COLORS[item.type])} />
                      <span className="text-sm flex-1 truncate">{item.label}</span>
                      <span className="text-xs text-muted-foreground font-medium shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* AI Summary */}
          <SectionCard
            title="Resumo do Analista (IA)"
            tooltip="Texto gerado pela IA com todas as métricas do dia. Cron dispara automaticamente às 23h BRT e envia via webhook para N8N (Telegram/WhatsApp). Clique em 'Gerar Resumo' para forçar manualmente."
          >
            {lastSnapshot ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Gerado em {format(new Date(lastSnapshot.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {' '}— Data: {lastSnapshot.snapshot_date}
                  </span>
                </div>
                <div className="bg-muted/50 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap">
                  {lastSnapshot.ai_summary || 'Resumo não disponível.'}
                </div>
              </div>
            ) : (
              <div className="h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                <p>Nenhum resumo gerado ainda.</p>
                <Button size="sm" variant="outline" onClick={handleGenerateNow} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar Primeiro Resumo
                </Button>
              </div>
            )}
          </SectionCard>

        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
}
