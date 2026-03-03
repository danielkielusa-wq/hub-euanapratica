import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  TrendingUp,
  Users,
  Crown,
  ArrowRight,
  Briefcase,
  FileText,
  Languages,
  Zap,
  MessageSquare,
  Heart,
  Video,
  PlayCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const data = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 30 },
  { name: 'Wed', value: 60 },
  { name: 'Thu', value: 45 },
  { name: 'Fri', value: 70 },
  { name: 'Sat', value: 55 },
  { name: 'Sun', value: 65 },
];

const radialData = [
  { name: 'Completed', value: 85, fill: '#7367F0' },
  { name: 'Remaining', value: 15, fill: '#f3f3f4' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'lives'>('ongoing');

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Row 1: Hero & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Hero Card - Website Analytics Style */}
        <div className="col-span-1 lg:col-span-2 bg-[#7367F0] rounded-xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-200">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Bem-vindo de volta, Daniel! 👋</h2>
            <p className="text-indigo-100 text-sm mb-6 max-w-xs">
              Você completou 68% da sua jornada Rota EUA. Continue assim!
            </p>
            
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[100px]">
                <div className="text-2xl font-bold mb-1">12</div>
                <div className="text-xs text-indigo-100">Sessões Realizadas</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[100px]">
                <div className="text-2xl font-bold mb-1">85%</div>
                <div className="text-xs text-indigo-100">Progresso Geral</div>
              </div>
            </div>

            <button className="mt-6 bg-white text-[#7367F0] text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-50 transition-colors">
              Ver Detalhes
            </button>
          </div>
          
          {/* Decorative 3D-like elements */}
          <div className="absolute right-0 bottom-0 w-64 h-64 translate-x-10 translate-y-10">
            <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full opacity-50 blur-3xl"></div>
          </div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          {/* Abstract shapes mimicking the reference image */}
          <svg className="absolute right-0 bottom-0 w-48 h-48 text-white/10" viewBox="0 0 200 200" fill="currentColor">
            <path d="M45.7,17.1c-10.1-1.6-20.5,2.6-26.6,10.8c-6.1,8.2-6.1,19.4,0,27.6c6.1,8.2,16.5,12.4,26.6,10.8c10.1-1.6,17.6-9.6,19.2-19.7C46.5,36.5,49.3,26.8,45.7,17.1z" transform="scale(4) translate(10,10)" />
          </svg>
        </div>

        {/* Stat Card 1 - Average Daily Sales Style */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">Próxima Sessão</h3>
              <div className="text-2xl font-bold text-gray-800">Seg, 02/03</div>
            </div>
            <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-full">+2 dias</span>
          </div>
          <div className="h-[100px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#28c76f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#28c76f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#28c76f" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-gray-400 text-xs mt-2">Sessão Estratégica às 09:00</p>
        </div>

        {/* Stat Card 2 - Sales Overview Style */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-700 font-semibold">Créditos</h3>
            <span className="text-green-500 text-sm font-bold">+18.2%</span>
          </div>
          
          <div className="space-y-6">
            <CreditItem 
              icon={FileText} 
              color="text-blue-500" 
              bg="bg-blue-100" 
              label="ResumePass AI" 
              value="16" 
              total="20" 
              percent={80} 
              barColor="bg-blue-500"
            />
            <CreditItem 
              icon={Languages} 
              color="text-purple-500" 
              bg="bg-purple-100" 
              label="Translator" 
              value="∞" 
              total="∞" 
              percent={100} 
              barColor="bg-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Content Grid - Split 50/50 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Col 1: Próximas Atividades (With Tabs) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sua Jornada</h3>
              <p className="text-sm text-gray-500">Gerencie suas atividades</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('ongoing')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'ongoing' 
                    ? 'bg-white text-[#7367F0] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Em Andamento
              </button>
              <button 
                onClick={() => setActiveTab('lives')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeTab === 'lives' 
                    ? 'bg-white text-[#7367F0] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Minhas Lives
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {activeTab === 'ongoing' ? (
              <>
                <ActivityItem 
                  icon={Zap} 
                  bg="bg-indigo-100" 
                  color="text-indigo-600"
                  title="Sessão Estratégica" 
                  subtitle="Seg, 09:00 - Individual" 
                  amount="Confirmado"
                  statusColor="text-green-600"
                />
                <ActivityItem 
                  icon={Users} 
                  bg="bg-green-100" 
                  color="text-green-600"
                  title="Mentoria em Grupo" 
                  subtitle="Sex, 19:00 - Grupo A" 
                  amount="Em breve"
                  statusColor="text-blue-600"
                />
                <ActivityItem 
                  icon={FileText} 
                  bg="bg-blue-100" 
                  color="text-blue-600"
                  title="Revisão de CV" 
                  subtitle="Qui, 10:00 - Assíncrono" 
                  amount="Pendente"
                  statusColor="text-orange-500"
                />
              </>
            ) : (
              <>
                <ActivityItem 
                  icon={Video} 
                  bg="bg-red-100" 
                  color="text-red-600"
                  title="Live Investimentos" 
                  subtitle="Qua, 14:00 - Youtube" 
                  amount="Ao Vivo"
                  statusColor="text-red-600 animate-pulse"
                />
                <ActivityItem 
                  icon={PlayCircle} 
                  bg="bg-purple-100" 
                  color="text-purple-600"
                  title="Workshop LinkedIn" 
                  subtitle="Gravado - Acesso Imediato" 
                  amount="Assistir"
                  statusColor="text-purple-600"
                />
                <ActivityItem 
                  icon={Calendar} 
                  bg="bg-orange-100" 
                  color="text-orange-600"
                  title="Q&A Carreira Internacional" 
                  subtitle="Ter, 18:00 - Zoom" 
                  amount="Agendado"
                  statusColor="text-gray-500"
                />
              </>
            )}
          </div>
        </div>

        {/* Col 2: Comunidade */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Comunidade</h3>
              <p className="text-sm text-gray-500">Últimas discussões</p>
            </div>
            <button className="text-sm text-indigo-600 font-bold hover:underline">Ver tudo</button>
          </div>

          <div className="p-0">
             <div className="divide-y divide-gray-50">
                <DiscussionItem 
                   avatar="https://picsum.photos/seed/u1/40/40"
                   author="Ana Souza"
                   time="2h atrás"
                   title="Dicas para entrevista técnica na Amazon (Liderança Principles)"
                   tags={['Interview', 'Big Tech']}
                   likes={24}
                   comments={8}
                />
                <DiscussionItem 
                   avatar="https://picsum.photos/seed/u2/40/40"
                   author="Carlos Mendes"
                   time="5h atrás"
                   title="Alguém já usou o Title Translator para vagas na Europa?"
                   tags={['Ferramentas', 'Dúvida']}
                   likes={12}
                   comments={15}
                />
                <DiscussionItem 
                   avatar="https://picsum.photos/seed/u3/40/40"
                   author="Beatriz Lima"
                   time="1d atrás"
                   title="Minha experiência conseguindo oferta remota em 3 meses"
                   tags={['Case de Sucesso', 'Remoto']}
                   likes={89}
                   comments={32}
                />
             </div>
          </div>
        </div>
      </div>

      {/* Row 3: Services Grid (Explorar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceCard 
          title="Mentoria ROTA EUA™" 
          desc="Programa intensivo de 8 semanas."
          icon={Crown}
          color="text-yellow-500"
          bg="bg-yellow-50"
          price="R$ 193"
          highlight
        />
        <ServiceCard 
          title="Live Investimentos" 
          desc="Aprenda a investir no mercado imobiliário."
          icon={TrendingUp}
          color="text-blue-500"
          bg="bg-blue-50"
          price="Grátis"
        />
        <ServiceCard 
          title="Comunidade VIP" 
          desc="Networking com profissionais nos EUA."
          icon={Users}
          color="text-green-500"
          bg="bg-green-50"
          price="Acesso Pro"
        />
      </div>

    </div>
  );
}

function CreditItem({ icon: Icon, color, bg, label, value, total, percent, barColor }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bg} ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">{label}</div>
            <div className="text-xs text-gray-400">{value} / {total}</div>
          </div>
        </div>
        <span className="text-sm font-bold text-gray-600">{percent}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, bg, color, title, subtitle, amount, statusColor }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
      </div>
      <div className={`text-xs font-bold ${statusColor || 'text-gray-600'}`}>{amount}</div>
    </div>
  );
}

function ServiceCard({ title, desc, icon: Icon, color, bg, price, highlight }: any) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm border transition-all hover:shadow-md cursor-pointer ${
      highlight ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${highlight ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
          {price}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      <div className="flex items-center text-xs font-bold text-indigo-600 group">
        Saiba mais <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
}

function DiscussionItem({ avatar, author, time, title, tags, likes, comments }: any) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 items-start">
      <img 
        src={avatar} 
        alt={author} 
        className="w-10 h-10 rounded-full object-cover border border-gray-100"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">{author}</span>
          <span className="text-xs text-gray-400">• {time}</span>
        </div>
        <h4 className="text-sm font-medium text-gray-800 mb-2 leading-snug">{title}</h4>
        <div className="flex items-center gap-2 mb-3">
          {tags.map((tag: string, idx: number) => (
            <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
            <Heart className="w-3.5 h-3.5" /> {likes}
          </div>
          <div className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> {comments}
          </div>
        </div>
      </div>
    </div>
  );
}
