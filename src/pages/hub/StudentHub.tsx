import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import {
  FileSearch,
  PlayCircle,
  Calendar,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MoreHorizontal,
  GraduationCap,
  MessageSquare,
  LinkedinIcon,
  ShieldCheck
} from 'lucide-react';

export default function StudentHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quota } = useSubscription();

  const planName = quota?.planName || 'Starter (Free)';
  const remainingCredits = quota?.remaining ?? 1;
  const userName = user?.full_name?.split(' ')[0] || 'Usuário';

  const handleOpenAI = () => {
    navigate('/curriculo');
  };

  const handleOpenClass = () => {
    window.open('https://youtube.com/playlist?list=PLxyz', '_blank');
  };

  const handleBuyRota = () => {
    navigate('/catalogo');
  };

  const handleBuyCurriculo = () => {
    navigate('/catalogo');
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in pb-20 max-w-6xl mx-auto p-4 md:p-6 lg:p-10">

        {/* 1. Header Simplificado */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Seu Hub</h1>
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
              Plano {planName}
            </span>
          </div>
          <p className="text-gray-500">Olá {userName}! Comece sua jornada com suas ferramentas gratuitas.</p>
        </div>

        {/* 2. Free Tier Value (The "Hook") */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

          {/* Card 1: ResumePass AI */}
          <div
            onClick={handleOpenAI}
            className="group bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileSearch size={28} />
                </div>
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  {remainingCredits} Crédito{remainingCredits !== 1 ? 's' : ''} Disp.
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">ResumePass AI</h3>
              <p className="text-gray-500 text-sm mb-8 flex-1">
                Sua análise mensal gratuita. Descubra se seu currículo passa nos robôs americanos.
              </p>

              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:gap-4 transition-all">
                Iniciar Análise <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 2: Base Class */}
          <div
            onClick={handleOpenClass}
            className="group bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-100 transition-colors"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlayCircle size={28} />
                </div>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Aula Base
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Primeiros Passos</h3>
              <p className="text-gray-500 text-sm mb-8 flex-1">
                Masterclass: Os fundamentos da carreira internacional que ninguém te conta.
              </p>

              <div className="flex items-center gap-2 text-purple-600 font-bold text-sm group-hover:gap-4 transition-all">
                Assistir Agora <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* 3. The High-Impact Upsell (ROTA EUA) */}
        <div className="mb-16">
          <div className="relative bg-[#0F172A] rounded-[40px] p-8 md:p-12 overflow-hidden shadow-2xl shadow-indigo-900/20 group">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/3 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/4"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
              <div className="lg:col-span-3 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-indigo-200 rounded-full border border-white/10 backdrop-blur-md">
                  <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Recomendado para você</span>
                </div>

                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
                    Sessão de Direção <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">ROTA EUA™</span>
                  </h2>
                  <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
                    Pare de adivinhar. Em 60 minutos, definiremos sua rota mais curta e realista para os EUA, com um plano de 3 prioridades claras.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Análise de perfil e elegibilidade de visto</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Definição de cargos-alvo e pretensão salarial</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Estratégia de LinkedIn e Networking</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 text-center hover:bg-white/10 transition-colors">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Investimento Único</p>
                  <div className="flex items-center justify-center gap-1 mb-4">
                    <span className="text-sm font-medium text-gray-400 mt-2">R$</span>
                    <span className="text-5xl font-black text-white">397</span>
                  </div>

                  <button
                    onClick={handleBuyRota}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 mb-4 flex items-center justify-center gap-2"
                  >
                    Agendar Sessão <Calendar size={18} />
                  </button>

                  <div className="flex items-start gap-2 text-left bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <ShieldCheck size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-200 leading-tight">
                      <strong className="text-emerald-400 block mb-0.5">Risco Zero (Cashback)</strong>
                      100% do valor vira crédito se você entrar na Mentoria em até 7 dias.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Secondary Services (Marketplace Style) */}
        <div>
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Outros Serviços
            </h3>
            <button
              onClick={() => navigate('/catalogo')}
              className="text-xs font-bold text-gray-400 hover:text-gray-900 flex items-center gap-1"
            >
              Ver todos <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Consultoria Currículo & LinkedIn',
                desc: 'Transforme seu perfil em um imã de recrutadores.',
                price: 'R$ 397',
                icon: LinkedinIcon,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                action: handleBuyCurriculo
              },
              {
                title: 'Mentoria Individual',
                desc: 'Acompanhamento recorrente 1:1 para sua jornada.',
                price: 'Sob Consulta',
                icon: GraduationCap,
                color: 'text-gray-600',
                bg: 'bg-gray-50',
                action: () => navigate('/catalogo')
              },
              {
                title: 'Mock Interview AI',
                desc: 'Treine entrevistas em inglês com feedback real.',
                price: 'Apenas VIP',
                icon: MessageSquare,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                action: () => navigate('/catalogo')
              },
            ].map((service, idx) => (
              <div key={idx} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all group flex flex-col">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${service.bg} ${service.color}`}>
                  <service.icon size={24} />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{service.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-1">{service.desc}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-900">{service.price}</span>
                  <button
                    onClick={service.action}
                    className="text-[10px] font-black text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all"
                  >
                    {service.price === 'Apenas VIP' ? 'VER PLANOS' : 'CONTRATAR'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
