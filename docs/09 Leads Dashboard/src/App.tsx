import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Target,
  BarChart3,
  DollarSign,
  ShieldAlert,
  Package,
  ExternalLink,
  Moon,
  Sun,
  Share2,
  Bell
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types & Constants ---

const SUPABASE_URL = 'https://seqgnxynrcylxsdzbloa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcWdueHlucmN5bHhzZHpibG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTI1NTksImV4cCI6MjA4NTUyODU1OX0.YJGbf2Ja79mshCRG5I6lEhOvmstaeuZqJQVrTi9jdmg';

interface Evaluation {
  id: string;
  name: string;
  email: string;
  area: string;
  processing_status: 'completed' | 'error' | 'pending';
  processing_error: string | null;
  created_at: string;
  readiness_score: number;
  phase_name: string;
  phase_emoji: string;
  rota_letter: string;
  lead_temperature: string;
  lead_priority_score: number;
  access_count: number;
  access_token: string;
  first_accessed_at: string | null;
  estimated_ltv: number;
  has_budget: boolean;
  has_english_barrier: boolean;
  has_experience_barrier: boolean;
  has_financial_barrier: boolean;
  has_family_barrier: boolean;
  has_visa_barrier: boolean;
  has_time_barrier: boolean;
  has_clarity_barrier: boolean;
  recommended_product_name: string;
  recommended_product_tier: string;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

// --- Components ---

const Card = ({ children, className, title, icon: Icon, subtitle }: { children: React.ReactNode, className?: string, title?: string, icon?: any, subtitle?: string }) => (
  <div className={cn("bg-white rounded-3xl border border-gray-100 shadow-sm p-6", className)}>
    {(title || Icon) && (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-gray-400" />}
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 cursor-pointer transition-colors">
          <ExternalLink className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    )}
    {children}
  </div>
);

const KPICard = ({ label, value, subValue, icon: Icon, trend, colorClass }: { label: string, value: string | number, subValue: string, icon: any, trend?: string, colorClass: string }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:border-blue-100 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-2xl", colorClass)}>
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      <p className="text-xs text-gray-400 mt-2 font-medium">{subValue}</p>
    </div>
  </div>
);

export default function App() {
  const [data, setData] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(7);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [tempFilter, setTempFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      let dateFilter = '';
      if (range !== 0) {
        const d = new Date();
        d.setDate(d.getDate() - range);
        dateFilter = `&created_at=gte.${d.toISOString()}`;
      }

      const url = `${SUPABASE_URL}/rest/v1/career_evaluations?select=*&order=created_at.desc${dateFilter}&limit=1000`;
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      });

      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesStatus = !statusFilter || item.processing_status === statusFilter;
      const matchesTemp = !tempFilter || item.lead_temperature?.toUpperCase() === tempFilter;
      const matchesPhase = !phaseFilter || item.phase_name === phaseFilter;
      const matchesSearch = !searchQuery || 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesTemp && matchesPhase && matchesSearch;
    });
  }, [data, statusFilter, tempFilter, phaseFilter, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // --- Chart Data Processing ---

  const volumeChartData = useMemo(() => {
    const days = range === 0 ? 30 : range;
    const volumeByDay: Record<string, number> = {};
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      volumeByDay[key] = 0;
    }

    data.forEach(r => {
      const key = r.created_at.split('T')[0];
      if (volumeByDay.hasOwnProperty(key)) volumeByDay[key]++;
    });

    return Object.entries(volumeByDay).map(([date, count]) => ({
      date: date.split('-').slice(1).reverse().join('/'),
      count
    }));
  }, [data, range]);

  const phaseChartData = useMemo(() => {
    const phases: Record<string, number> = {};
    data.forEach(r => {
      if (r.phase_emoji && r.rota_letter) {
        const key = `${r.phase_emoji} ${r.rota_letter}`;
        phases[key] = (phases[key] || 0) + 1;
      }
    });
    return Object.entries(phases).map(([name, value]) => ({ name, value }));
  }, [data]);

  const tempChartData = useMemo(() => {
    const temps = { QUENTE: 0, MORNO: 0, FRIO: 0 };
    data.forEach(r => {
      const t = r.lead_temperature?.toUpperCase();
      if (t === 'QUENTE') temps.QUENTE++;
      else if (t === 'MORNO') temps.MORNO++;
      else if (t === 'FRIO') temps.FRIO++;
    });
    return [
      { name: '🔥 Quente', value: temps.QUENTE },
      { name: '🟡 Morno', value: temps.MORNO },
      { name: '🔵 Frio', value: temps.FRIO },
    ];
  }, [data]);

  const barriersData = useMemo(() => {
    const barriers = [
      { label: 'Inglês', key: 'has_english_barrier' },
      { label: 'Experiência', key: 'has_experience_barrier' },
      { label: 'Clareza', key: 'has_clarity_barrier' },
      { label: 'Financeiro', key: 'has_financial_barrier' },
      { label: 'Visto', key: 'has_visa_barrier' },
      { label: 'Família', key: 'has_family_barrier' },
      { label: 'Tempo', key: 'has_time_barrier' },
    ];
    return barriers.map(b => ({
      label: b.label,
      count: data.filter(r => (r as any)[b.key]).length
    })).sort((a, b) => b.count - a.count);
  }, [data]);

  const productsData = useMemo(() => {
    const products: Record<string, number> = {};
    data.forEach(r => {
      if (r.recommended_product_name) {
        products[r.recommended_product_name] = (products[r.recommended_product_name] || 0) + 1;
      }
    });
    return Object.entries(products)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [data]);

  const stats = useMemo(() => {
    const total = data.length;
    const completed = data.filter(r => r.processing_status === 'completed').length;
    const errors = data.filter(r => r.processing_status === 'error').length;
    const accessed = data.filter(r => r.access_count > 0).length;
    const totalLTV = data.reduce((s, r) => s + (Number(r.estimated_ltv) || 0), 0);
    const withBudget = data.filter(r => r.has_budget).length;

    return {
      total,
      completed,
      errors,
      accessed,
      totalLTV,
      withBudget,
      completedPct: total > 0 ? Math.round((completed / total) * 100) : 0,
      errorPct: total > 0 ? Math.round((errors / total) * 100) : 0,
      accessPct: completed > 0 ? Math.round((accessed / completed) * 100) : 0,
      avgLTV: total > 0 ? Math.round(totalLTV / total) : 0
    };
  }, [data]);

  const uniquePhases = useMemo(() => {
    return Array.from(new Set(data.map(r => r.phase_name).filter(Boolean)));
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => fetchData()}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans selection:bg-blue-100">
      {/* --- Header --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-bottom border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
              🎯
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">EUA na Prática</h1>
              <p className="text-xs text-gray-400 font-medium">Dashboard de Diagnósticos</p>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
            {[7, 30, 90, 0].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-semibold transition-all",
                  range === d ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {d === 0 ? 'Tudo' : `${d}D`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar lead..." 
              className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="text-[10px] font-bold text-gray-300 bg-white border border-gray-100 px-1.5 py-0.5 rounded-md">⌘ K</span>
          </div>

          <button 
            onClick={() => fetchData()}
            className={cn(
              "p-2.5 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all group",
              loading && "animate-pulse"
            )}
          >
            <RefreshCw className={cn("w-5 h-5 text-gray-500 group-hover:rotate-180 transition-transform duration-500", loading && "animate-spin")} />
          </button>

          <div className="w-px h-6 bg-gray-100 mx-2" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src="https://picsum.photos/seed/alan/100/100" alt="User" referrerPolicy="no-referrer" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold">Alan</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Admin</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* --- Welcome Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Bom dia, Alan</h2>
            <p className="text-gray-500 mt-1">Confira a atividade mais recente dos seus leads.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm">
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
              <Bell className="w-4 h-4" />
              Notificações
            </button>
          </div>
        </div>

        {/* --- KPI Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="Total de Avaliações" 
            value={stats.total} 
            subValue={range === 0 ? "Histórico total" : `Últimos ${range} dias`}
            icon={Users}
            colorClass="bg-blue-50 text-blue-600"
          />
          <KPICard 
            label="Concluídas" 
            value={stats.completed} 
            subValue={`${stats.completedPct}% do total`}
            icon={CheckCircle2}
            colorClass="bg-emerald-50 text-emerald-600"
            trend="+12%"
          />
          <KPICard 
            label="Com Erro" 
            value={stats.errors} 
            subValue={`${stats.errorPct}% do total`}
            icon={AlertCircle}
            colorClass="bg-red-50 text-red-600"
          />
          <KPICard 
            label="Relatórios Acessados" 
            value={stats.accessed} 
            subValue={`${stats.accessPct}% dos concluídos`}
            icon={Eye}
            colorClass="bg-amber-50 text-amber-600"
            trend="+8%"
          />
        </div>

        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Volume de Avaliações" subtitle="Frequência diária de novos leads" className="lg:col-span-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeChartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Distribuição Fase ROTA" subtitle="Estágio atual dos candidatos">
            <div className="h-[300px] w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={phaseChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {phaseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                {phaseChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                    <span className="text-[10px] font-bold text-gray-500 truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-gray-900 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* --- Metrics Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="LTV Estimado" icon={DollarSign} subtitle="Potencial financeiro dos leads">
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
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{width: `${(stats.withBudget / stats.total) * 100}%`}}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Taxa de Conversão Budget</span>
                  <span>{Math.round((stats.withBudget / stats.total) * 100)}%</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Barreiras Comuns" icon={ShieldAlert} subtitle="Principais dificuldades detectadas">
            <div className="space-y-4">
              {barriersData.slice(0, 5).map((b, i) => (
                <div key={b.label} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">{b.label}</span>
                    <span className="text-xs font-bold text-gray-400">{b.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{width: `${(b.count / stats.total) * 100}%`}}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Produtos Sugeridos" icon={Package} subtitle="Top recomendações da IA">
            <div className="space-y-3">
              {productsData.map(([name, count], i) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-700 truncate max-w-[180px]">{name}</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                    {count} leads
                  </span>
                </div>
              ))}
              {productsData.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Sem dados de produtos</p>
              )}
            </div>
          </Card>
        </div>

        {/* --- Table Section --- */}
        <Card className="overflow-hidden p-0">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Leads Recentes</h3>
              <p className="text-xs text-gray-400 font-medium">Gerencie e filtre suas avaliações</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                className="text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Status</option>
                <option value="completed">Concluído</option>
                <option value="error">Erro</option>
                <option value="pending">Pendente</option>
              </select>

              <select 
                className="text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
              >
                <option value="">Temperatura</option>
                <option value="QUENTE">🔥 Quente</option>
                <option value="MORNO">🟡 Morno</option>
                <option value="FRIO">🔵 Frio</option>
              </select>

              <select 
                className="text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <option value="">Fase</option>
                {uniquePhases.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fase</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Temperatura</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {item.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name || '—'}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{item.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-gray-500">{item.area || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{item.phase_emoji} {item.rota_letter}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              item.readiness_score > 70 ? "bg-emerald-500" : item.readiness_score > 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{width: `${item.readiness_score}%`}}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{item.readiness_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-lg border",
                        item.lead_temperature?.toUpperCase() === 'QUENTE' ? "bg-red-50 text-red-600 border-red-100" :
                        item.lead_temperature?.toUpperCase() === 'MORNO' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {item.lead_temperature?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          item.processing_status === 'completed' ? "bg-emerald-500" :
                          item.processing_status === 'error' ? "bg-red-500" : "bg-amber-500"
                        )} />
                        <span className="text-xs font-bold text-gray-700 capitalize">{item.processing_status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`https://hub.euanapratica.com/diagnostico/${item.access_token}`} 
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                      >
                        Ver Relatório
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Página {currentPage} de {totalPages || 1}
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-xl border border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </main>

      {/* --- Footer --- */}
      <footer className="p-8 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
          EUA na Prática © {new Date().getFullYear()} · Inteligência de Diagnóstico
        </p>
        <p className="text-[10px] text-gray-300 mt-2 font-medium">
          Última atualização: {lastUpdated || '—'}
        </p>
      </footer>
    </div>
  );
}
