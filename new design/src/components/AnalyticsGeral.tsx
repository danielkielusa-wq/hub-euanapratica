import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  DollarSign, 
  Activity, 
  Zap, 
  MessageCircle, 
  Mail, 
  Calendar, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  MoreHorizontal,
  TrendingUp,
  MousePointerClick
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

// --- Mock Data ---

const GROWTH_DATA = [
  { date: '22/02', leads: 6, cadastros: 2 },
  { date: '23/02', leads: 12, cadastros: 2 },
  { date: '24/02', leads: 15, cadastros: 4 },
  { date: '25/02', leads: 12, cadastros: 8 },
  { date: '26/02', leads: 9, cadastros: 2 },
  { date: '27/02', leads: 7, cadastros: 4 },
  { date: '28/02', leads: 10, cadastros: 3 },
  { date: '01/03', leads: 10, cadastros: 2 },
  { date: '02/03', leads: 9, cadastros: 5 },
];

const FUNNEL_DATA = [
  { name: 'Visitantes', value: 1200, color: '#94a3b8' },
  { name: 'Leads', value: 350, color: '#3b82f6' },
  { name: 'Cadastros', value: 85, color: '#10b981' },
  { name: 'Assinaturas', value: 12, color: '#6366f1' },
];

const TOOLS_DATA = [
  { name: 'ResumePass AI', value: 85, color: '#8b5cf6' },
  { name: 'Tradutor de Títulos', value: 45, color: '#a78bfa' },
  { name: 'Gerador de Posts', value: 30, color: '#c4b5fd' },
  { name: 'Análise de Perfil', value: 15, color: '#ddd6fe' },
];

const RECENT_ACTIVITY = [
  { type: 'cadastro', user: 'Marcio Galante', time: '18m', details: 'Plano Gratuito' },
  { type: 'lead', user: 'Marcio Galante Teste', time: '34m', details: 'Origem: LinkedIn' },
  { type: 'lead', user: 'Alex de Almeida', time: '1h', details: 'Origem: Instagram' },
  { type: 'cadastro', user: 'JOSE AELSON', time: '2h', details: 'Plano Pro' },
  { type: 'lead', user: 'Ezequiel Borges', time: '5h', details: 'Origem: Blog' },
  { type: 'lead', user: 'Roni Peterson', time: '10h', details: 'Origem: Youtube' },
];

const PAGES_DATA = [
  { path: '/blog/como-vender-mais', views: 1240 },
  { path: '/ferramentas/calculadora', views: 850 },
  { path: '/pricing', views: 620 },
  { path: '/sobre', views: 310 },
];

// --- Components ---

const KpiCard = ({ title, value, subtext, icon: Icon, trend, trendValue, colorClass }: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-full"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">{title}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  </motion.div>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
  </div>
);

export default function AnalyticsGeral() {
  const [timeRange, setTimeRange] = useState('7D');

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans bg-gray-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Geral</h1>
          <p className="text-gray-500 mt-1">Visão geral do sistema em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['Hoje', '7D', '30D', '90D'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  timeRange === range 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200">
            <Sparkles className="w-3.5 h-3.5" />
            Gerar Resumo IA
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard 
          title="Novos Leads" 
          value="64" 
          icon={Users} 
          colorClass="bg-blue-500 text-blue-600" 
          trend="up" 
          trendValue="+12%" 
        />
        <KpiCard 
          title="Novos Cadastros" 
          value="12" 
          icon={UserPlus} 
          colorClass="bg-emerald-500 text-emerald-600" 
          trend="up" 
          trendValue="+5%" 
        />
        <KpiCard 
          title="Assinaturas Ativas" 
          value="2" 
          subtext="Atual"
          icon={CreditCard} 
          colorClass="bg-violet-500 text-violet-600" 
        />
        <KpiCard 
          title="MRR" 
          value="R$ 145" 
          subtext="Atual"
          icon={DollarSign} 
          colorClass="bg-amber-500 text-amber-600" 
          trend="up" 
          trendValue="+2.4%" 
        />
        <KpiCard 
          title="Churn 30d" 
          value="0%" 
          subtext="Aprox."
          icon={Activity} 
          colorClass="bg-rose-500 text-rose-600" 
        />
        <KpiCard 
          title="Créditos Usados" 
          value="842" 
          subtext="Total"
          icon={Zap} 
          colorClass="bg-orange-500 text-orange-600" 
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <SectionHeader title="Crescimento" subtitle="Leads vs Cadastros nos últimos dias" />
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-600">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-gray-600">Cadastros</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="cadastros" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCadastros)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel & Temperature */}
        <div className="space-y-6">
          {/* Funnel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
            <SectionHeader title="Funil de Conversão" />
            <div className="flex-1 flex flex-col justify-center space-y-4">
              {FUNNEL_DATA.map((item, index) => (
                <div key={item.name} className="relative">
                  <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                    <span>{item.name}</span>
                    <span className="text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 1200) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">Taxa Lead → Cadastro</span>
                <span className="text-sm font-bold text-emerald-600">24.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* WhatsApp */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900">WhatsApp</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Enviadas</p>
              <p className="text-xl font-bold text-gray-900">24</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Recebidas</p>
              <p className="text-xl font-bold text-gray-900">15</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Opt-outs</p>
              <p className="text-xl font-bold text-gray-400">0</p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Email</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Enviados</p>
              <p className="text-xl font-bold text-gray-900">53</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Taxa de Sucesso</p>
              <p className="text-xl font-bold text-emerald-600">88.7%</p>
            </div>
          </div>
        </div>

        {/* Agendamentos */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">Agendamentos</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-xl font-bold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Feitos</p>
              <p className="text-xl font-bold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">No-show</p>
              <p className="text-xl font-bold text-gray-400">0%</p>
            </div>
          </div>
        </div>

        {/* Comunidade */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-pink-600" />
            </div>
            <h3 className="font-bold text-gray-900">Comunidade</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Posts</p>
              <p className="text-xl font-bold text-gray-900">5</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Comentários</p>
              <p className="text-xl font-bold text-gray-900">0</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Likes</p>
              <p className="text-xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Tool Usage & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Tool Usage */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <SectionHeader title="Uso de Ferramentas" subtitle="Execuções por ferramenta (top 4)" />
          <div className="space-y-5">
            {TOOLS_DATA.map((tool, index) => (
              <div key={tool.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{tool.name}</span>
                  <span className="text-sm font-bold text-gray-900">{tool.value}</span>
                </div>
                <div className="w-full bg-gray-50 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(tool.value / 100) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: tool.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <SectionHeader title="Atividade Recente" />
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Ver tudo</button>
          </div>
          <div className="space-y-0">
            {RECENT_ACTIVITY.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                <div className={`mt-1 w-2 h-2 rounded-full ${activity.type === 'cadastro' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.type === 'cadastro' ? 'Novo Cadastro' : 'Novo Lead'}: <span className="font-normal text-gray-600">{activity.user}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.details}</p>
                </div>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Accessed Pages */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <SectionHeader title="Páginas Mais Acessadas" subtitle="Visualizações únicas" />
          <div className="space-y-4">
            {PAGES_DATA.map((page, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-600 truncate font-mono">{page.path}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{page.views}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-indigo-900">Resumo do Analista (IA)</h4>
                <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                  O tráfego aumentou 12% nos últimos 3 dias, impulsionado principalmente pelo post no blog sobre "Vendas B2B". A taxa de conversão de leads para cadastro está saudável em 24%.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
