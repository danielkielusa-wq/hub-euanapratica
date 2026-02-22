import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Users, CheckCircle2, AlertCircle, Eye, RefreshCw, Search,
  ChevronLeft, ChevronRight, DollarSign, ShieldAlert, Package, ExternalLink, Info, Brain
} from 'lucide-react';
import { AIDailyPrioritiesPanel } from '@/components/admin/ai-priorities/AIDailyPrioritiesPanel';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';

const REPORT_BASE = 'https://hub.euanapratica.com/report/';
const PER_PAGE = 20;
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-gray-300 hover:text-gray-500 transition-colors focus:outline-none" type="button">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] whitespace-pre-line leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

interface LeadRow {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  area: string | null;
  phase_name: string | null;
  phase_emoji: string | null;
  rota_letter: string | null;
  lead_temperature: string | null;
  recommended_product_name: string | null;
  investment_range: string | null;
  impediment: string | null;
  access_token: string | null;
  processing_status: string | null;
  readiness_score: number | null;
  estimated_ltv: number | null;
  has_budget: boolean | null;
  has_english_barrier: boolean | null;
  has_experience_barrier: boolean | null;
  has_financial_barrier: boolean | null;
  has_family_barrier: boolean | null;
  has_visa_barrier: boolean | null;
  has_time_barrier: boolean | null;
  has_clarity_barrier: boolean | null;
  access_count: number | null;
}

type PeriodDays = 7 | 30 | 90 | 0;

function KPICard({ label, value, subValue, icon: Icon, colorClass, tooltip }: {
  label: string; value: string | number; subValue: string; icon: React.ElementType; colorClass: string; tooltip?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:border-blue-100 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      <p className="text-xs text-gray-400 mt-2 font-medium">{subValue}</p>
    </div>
  );
}

function Card({ children, className, title, icon: Icon, subtitle, tooltip }: {
  children: React.ReactNode; className?: string; title?: string; icon?: React.ElementType; subtitle?: string; tooltip?: string;
}) {
  return (
    <div className={cn("bg-white rounded-3xl border border-gray-100 shadow-sm p-6", className)}>
      {(title || Icon) && (
        <div className="flex items-start justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-gray-400" />}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {tooltip && <InfoTip text={tooltip} />}
        </div>
      )}
      {children}
    </div>
  );
}

export default function AdminLeadsDashboard() {
  const { toast } = useToast();
  const [allData, setAllData] = useState<LeadRow[]>([]);
  const [period, setPeriod] = useState<PeriodDays>(7);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tempFilter, setTempFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [prioritiesOpen, setPrioritiesOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('career_evaluations')
        .select('id,created_at,name,email,phone,area,phase_name,phase_emoji,rota_letter,lead_temperature,recommended_product_name,investment_range,impediment,access_token,processing_status,readiness_score,estimated_ltv,has_budget,has_english_barrier,has_experience_barrier,has_financial_barrier,has_family_barrier,has_visa_barrier,has_time_barrier,has_clarity_barrier,access_count')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      setAllData((data as LeadRow[]) || []);
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Period filter
  const periodData = useMemo(() => {
    if (period === 0) return allData;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    return allData.filter(d => new Date(d.created_at) >= cutoff);
  }, [allData, period]);

  // Stats
  const stats = useMemo(() => {
    const total = periodData.length;
    const completed = periodData.filter(d => d.processing_status === 'completed').length;
    const errors = periodData.filter(d => d.processing_status === 'error').length;
    const accessed = periodData.filter(d => (d.access_count || 0) > 0).length;
    const totalLTV = periodData.reduce((s, d) => s + (Number(d.estimated_ltv) || 0), 0);
    const withBudget = periodData.filter(d => d.has_budget).length;
    return {
      total, completed, errors, accessed, totalLTV, withBudget,
      completedPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      errorPct: total > 0 ? Math.round((errors / total) * 100) : 0,
      accessPct: completed > 0 ? Math.round((accessed / completed) * 100) : 0,
      avgLTV: total > 0 ? Math.round(totalLTV / total) : 0,
    };
  }, [periodData]);

  // Volume chart
  const volumeChartData = useMemo(() => {
    const days = period === 0 ? 30 : period;
    const map: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toISOString().split('T')[0]] = 0;
    }
    periodData.forEach(d => {
      const key = d.created_at?.split('T')[0];
      if (key && map.hasOwnProperty(key)) map[key]++;
    });
    return Object.entries(map).map(([date, count]) => ({
      date: date.split('-').slice(1).reverse().join('/'), count
    }));
  }, [periodData, period]);

  // Phase chart
  const phaseChartData = useMemo(() => {
    const phases: Record<string, number> = {};
    periodData.forEach(d => {
      if (d.phase_emoji && d.rota_letter) {
        const key = `${d.phase_emoji} ${d.rota_letter}`;
        phases[key] = (phases[key] || 0) + 1;
      }
    });
    return Object.entries(phases).map(([name, value]) => ({ name, value }));
  }, [periodData]);

  // Barriers
  const barriersData = useMemo(() => {
    const barriers = [
      { label: 'Inglês', key: 'has_english_barrier' as const },
      { label: 'Experiência', key: 'has_experience_barrier' as const },
      { label: 'Clareza', key: 'has_clarity_barrier' as const },
      { label: 'Financeiro', key: 'has_financial_barrier' as const },
      { label: 'Visto', key: 'has_visa_barrier' as const },
      { label: 'Família', key: 'has_family_barrier' as const },
      { label: 'Tempo', key: 'has_time_barrier' as const },
    ];
    return barriers.map(b => ({
      label: b.label,
      count: periodData.filter(d => d[b.key]).length
    })).sort((a, b) => b.count - a.count);
  }, [periodData]);

  // Products
  const productsData = useMemo(() => {
    const products: Record<string, number> = {};
    periodData.forEach(d => {
      if (d.recommended_product_name) products[d.recommended_product_name] = (products[d.recommended_product_name] || 0) + 1;
    });
    return Object.entries(products).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [periodData]);

  // Unique phases for filter
  const uniquePhases = useMemo(() =>
    [...new Set(periodData.map(d => d.phase_name).filter(Boolean))] as string[]
  , [periodData]);

  // Table filtering + pagination
  const tableData = useMemo(() => {
    return periodData.filter(d => {
      if (search && !(d.name || '').toLowerCase().includes(search.toLowerCase()) && !(d.email || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && d.processing_status !== statusFilter) return false;
      if (tempFilter && (d.lead_temperature || '').toUpperCase() !== tempFilter) return false;
      if (phaseFilter && d.phase_name !== phaseFilter) return false;
      return true;
    });
  }, [periodData, search, statusFilter, tempFilter, phaseFilter]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = tableData.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  useEffect(() => { setPage(1); }, [search, statusFilter, tempFilter, phaseFilter, period]);

  const openReport = (accessToken: string, email: string | null) => {
    if (email) {
      navigator.clipboard.writeText(email).then(() => toast({ title: 'Email copiado — cole no gate do relatório' })).catch(() => {});
    }
    window.open(REPORT_BASE + accessToken, '_blank');
  };

  if (loading && !allData.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <DashboardLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Leads Dashboard</h2>
            <p className="text-gray-500 mt-1">Confira a atividade mais recente dos seus leads.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
              {([7, 30, 90, 0] as PeriodDays[]).map(d => (
                <button key={d} onClick={() => setPeriod(d)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all",
                    period === d ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                  )}
                >{d === 0 ? 'Tudo' : `${d}D`}</button>
              ))}
            </div>
            <button onClick={fetchData}
              className={cn("p-2.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all", loading && "animate-pulse")}>
              <RefreshCw className={cn("w-5 h-5 text-gray-500", loading && "animate-spin")} />
            </button>
            <button onClick={() => setPrioritiesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all">
              <Brain className="w-4 h-4" />
              Prioridades do Dia
            </button>
            {lastUpdate && <span className="text-xs text-gray-400 font-medium hidden sm:block">Atualizado: {lastUpdate}</span>}
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard label="Total de Avaliações" value={stats.total}
            subValue={period === 0 ? "Histórico total" : `Últimos ${period} dias`}
            icon={Users} colorClass="bg-blue-50 text-blue-600"
            tooltip="Total de leads no período selecionado, independente do status de processamento." />
          <KPICard label="Concluídas" value={stats.completed}
            subValue={`${stats.completedPct}% do total`}
            icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600"
            tooltip="Leads cujo relatório foi processado com sucesso.\nInclui leads processados pelo N8N e pela IA diretamente." />
          <KPICard label="Com Erro" value={stats.errors}
            subValue={`${stats.errorPct}% do total`}
            icon={AlertCircle} colorClass="bg-red-50 text-red-600"
            tooltip="Leads onde houve falha no processamento automático.\nO usuário pode ainda ter acesso ao relatório se ele existia anteriormente." />
          <KPICard label="Relatórios Acessados" value={stats.accessed}
            subValue={`${stats.accessPct}% dos concluídos`}
            icon={Eye} colorClass="bg-amber-50 text-amber-600"
            tooltip="Leads que abriram o link do relatório pelo menos uma vez.\nBaseia-se no campo access_count > 0." />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Volume de Avaliações" subtitle="Frequência diária de novos leads" className="lg:col-span-2"
            tooltip="Quantidade de novos leads criados por dia no período selecionado.">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeChartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Distribuição Fase ROTA" subtitle="Estágio atual dos candidatos"
            tooltip={"Classifica os leads nas 4 fases do método ROTA com base no score de prontidão:\n❌ Pré-R: 0–35 pts\n🟡 R-O: 36–60 pts\n🟢 O-T: 61–85 pts\n🚀 T-A: 86–100 pts\n\nApenas leads com score calculado aparecem aqui."}>
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={phaseChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {phaseChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                {phaseChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-gray-500 truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-gray-900 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="LTV Estimado" icon={DollarSign} subtitle="Potencial financeiro dos leads"
            tooltip={"Potencial de receita estimado por lead com base no score e orçamento:\n≥71 pts + orçamento → R$10.000\n≥71 pts → R$3.000\n≥51 pts + orçamento → R$2.500\n≥51 pts → R$500\n≥31 pts + orçamento → R$700\n≥31 pts → R$200\n\n'Com orçamento': investment_range acima de R$1.500."}>
            <div className="space-y-6">
              <div>
                <h4 className="text-4xl font-bold tracking-tight text-gray-900">
                  R$ {stats.totalLTV.toLocaleString('pt-BR')}
                </h4>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Média de R$ {stats.avgLTV.toLocaleString('pt-BR')} por lead
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Com orçamento</span>
                  <span className="text-emerald-600 font-bold">{stats.withBudget}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.total ? (stats.withBudget / stats.total) * 100 : 0}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Taxa de Conversão Budget</span>
                  <span>{stats.total ? Math.round((stats.withBudget / stats.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Barreiras Comuns" icon={ShieldAlert} subtitle="Principais dificuldades detectadas"
            tooltip={"Calculado a partir das respostas do formulário:\n• Inglês: nível Básico ou Intermediário\n• Visto: nunca iniciou o processo\n• Financeiro: renda até R$5k ou impedimento financeiro\n• Experiência: menos de 5 anos na área\n• Família: tem filhos ou impedimento familiar\n• Clareza: objetivo de entender direção\n• Tempo: impedimento de tempo/rotina\n\nUm lead pode ter múltiplas barreiras."}>
            <div className="space-y-4">
              {barriersData.slice(0, 5).map(b => (
                <div key={b.label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">{b.label}</span>
                    <span className="text-xs font-bold text-gray-400">{b.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.total ? (b.count / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Produtos Sugeridos" icon={Package} subtitle="Top recomendações da IA"
            tooltip={"Somente leads que acessaram o relatório recebem uma recomendação de produto (gerada pela IA no momento do acesso).\n\nLeads que nunca abriram o link não aparecem aqui — por isso o total é menor que o número de avaliações."}>
            <div className="space-y-3">
              {productsData.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-700 truncate max-w-[180px]">{name}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                    {count} leads
                  </span>
                </div>
              ))}
              {!productsData.length && <p className="text-center text-gray-400 text-sm py-8">Sem dados de produtos</p>}
            </div>
          </Card>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Leads Recentes</h3>
              <p className="text-xs text-gray-400 font-medium">Gerencie e filtre suas avaliações</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-bold w-36 placeholder:text-gray-400" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">Status</option>
                <option value="completed">Concluído</option>
                <option value="error">Erro</option>
                <option value="pending">Pendente</option>
              </select>
              <select value={tempFilter} onChange={e => setTempFilter(e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">Temperatura</option>
                <option value="QUENTE">Quente</option>
                <option value="MORNO">Morno</option>
                <option value="FRIO">Frio</option>
              </select>
              <select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100">
                <option value="">Fase</option>
                {uniquePhases.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  {['Lead', 'Área', 'Fase', 'Score', 'Temperatura', 'Status', 'Ações'].map(h => (
                    <th key={h} className={cn("px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider", h === 'Ações' && 'text-right')}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageSlice.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {(d.name || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{d.name || '—'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{d.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-medium text-gray-500">{d.area || '—'}</span></td>
                    <td className="px-6 py-4"><span className="text-sm">{d.phase_emoji} {d.rota_letter || '—'}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full",
                            (d.readiness_score || 0) > 70 ? "bg-emerald-500" : (d.readiness_score || 0) > 40 ? "bg-amber-500" : "bg-red-500"
                          )} style={{ width: `${d.readiness_score || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{d.readiness_score ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg border",
                        (d.lead_temperature || '').toUpperCase() === 'QUENTE' ? "bg-red-50 text-red-600 border-red-100" :
                        (d.lead_temperature || '').toUpperCase() === 'MORNO' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>{(d.lead_temperature || '—').toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                          d.processing_status === 'completed' ? "bg-emerald-500" :
                          d.processing_status === 'error' ? "bg-red-500" : "bg-amber-500"
                        )} />
                        <span className="text-xs font-bold text-gray-700 capitalize">{d.processing_status || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {d.access_token ? (
                        <button onClick={() => openReport(d.access_token!, d.email)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm">
                          Ver Relatório <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
                {!pageSlice.length && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">Nenhum lead encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Página {safePage} de {totalPages} ({tableData.length} leads)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <AIDailyPrioritiesPanel open={prioritiesOpen} onOpenChange={setPrioritiesOpen} />
    </DashboardLayout>
    </TooltipProvider>
  );
}
