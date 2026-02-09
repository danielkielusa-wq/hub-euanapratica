
import React from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Video, 
  CheckCircle2, 
  MapPin, 
  Briefcase, 
  Users, 
  Globe, 
  MessageCircle, 
  Star,
  Calendar,
  ShieldCheck
} from 'lucide-react';

interface ServiceDetailsProps {
  onBack: () => void;
  onBook: () => void;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({ onBack, onBook }) => {
  return (
    <div className="animate-fade-in bg-white min-h-screen relative pb-24">
      
      {/* 1. HERO SECTION */}
      <div className="relative bg-[#0F172A] text-white rounded-b-[48px] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600 rounded-full blur-[150px] opacity-20 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[150px] opacity-10 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-20">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm mb-10 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white/10 group-hover:bg-white/20 transition-all">
               <ArrowLeft size={18} />
            </div>
            Voltar para Serviços
          </button>

          <div className="flex flex-col md:flex-row gap-12 items-start">
             <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 border border-brand-500/30 text-brand-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                   <Star size={12} fill="currentColor" /> Consultoria Individual
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-6">
                   Sessão Estratégica <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">Carreira nos EUA</span>
                </h1>
                <p className="text-lg text-gray-300 font-medium leading-relaxed max-w-xl mb-8">
                   45 minutos de pura realidade. Tire suas dúvidas, valide seu perfil e defina se o "Sonho Americano" faz sentido para o seu momento profissional e familiar.
                </p>
                
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                      <Clock size={18} className="text-brand-400" />
                      <span className="text-sm font-bold">45 Minutos</span>
                   </div>
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                      <Video size={18} className="text-brand-400" />
                      <span className="text-sm font-bold">Google Meet</span>
                   </div>
                   <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                      <Users size={18} className="text-brand-400" />
                      <span className="text-sm font-bold">1-on-1</span>
                   </div>
                </div>
             </div>

             {/* Right Side Image/Card */}
             <div className="hidden md:block w-80 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center transform rotate-3 hover:rotate-0 transition-all duration-500">
                 <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full mb-4 border-4 border-white/10 overflow-hidden">
                    <div className="w-full h-full bg-brand-900 flex items-center justify-center text-2xl font-black text-white">DK</div>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-1">Daniel Kiel</h3>
                 <p className="text-brand-200 text-xs font-bold uppercase tracking-widest mb-6">Mentor & Strategist</p>
                 <div className="bg-white/10 rounded-xl p-4 text-left">
                    <p className="text-xs text-gray-300 italic">"Minha missão não é te vender um sonho, é te dar um plano de batalha."</p>
                 </div>
             </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-20">
         
         {/* Introduction Card */}
         <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 mb-16">
             <h2 className="text-2xl font-black text-gray-900 mb-4">O que você vai descobrir nesta sessão?</h2>
             <p className="text-gray-500 mb-8 leading-relaxed">
               Muitos profissionais perdem anos (e milhares de dólares) tentando imigrar da forma errada. Esta sessão é um "alinhamento de bússola" para evitar erros caros.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: Briefcase, title: 'Análise de Mercado', desc: 'Sua experiência atual tem demanda nos EUA? Analisamos seu background vs. realidade.' },
                  { icon: Globe, title: 'Choque Cultural & Vagas', desc: 'Como as empresas americanas contratam e o que esperam de um profissional brasileiro.' },
                  { icon: Users, title: 'Mudança em Família', desc: 'Impactos práticos para cônjuges e filhos. Escolas, custo de vida e adaptação.' },
                  { icon: MapPin, title: 'Próximos Passos', desc: 'Um plano prático (roadmap) do que você deve fazer nos próximos 90 dias.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-brand-50 transition-colors border border-transparent hover:border-brand-100 group">
                     <div className="w-12 h-12 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                        <item.icon size={24} />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                     </div>
                  </div>
                ))}
             </div>
         </div>

         {/* Target Audience */}
         <div className="mb-16">
            <h3 className="text-xl font-black text-gray-900 mb-8 text-center">Para quem é esta sessão?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <div className="mb-4 bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={18} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Exploradores</h4>
                  <p className="text-xs text-gray-500">Profissionais que sonham em morar fora mas não sabem por onde começar ou qual visto se aplica.</p>
               </div>
               <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <div className="mb-4 bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={18} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Em Transição</h4>
                  <p className="text-xs text-gray-500">Quem já está aplicando para vagas mas só recebe "não" ou é ignorado pelos recrutadores.</p>
               </div>
               <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <div className="mb-4 bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={18} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Com Família</h4>
                  <p className="text-xs text-gray-500">Quem precisa de segurança e planejamento financeiro detalhado antes de fazer a mudança.</p>
               </div>
            </div>
         </div>

         {/* FAQ / Doubts */}
         <div className="bg-brand-50 rounded-[32px] p-8 md:p-12 text-center border border-brand-100 mb-10">
             <MessageCircle size={32} className="mx-auto text-brand-600 mb-4" />
             <h3 className="text-2xl font-black text-brand-900 mb-4">Dúvidas Frequentes</h3>
             <p className="text-brand-800 text-sm max-w-2xl mx-auto leading-relaxed mb-8">
               "Preciso ter inglês fluente?" "Minha faculdade vale lá?" "Quanto custa o aluguel?"
               <br/>
               <span className="font-bold">Traga todas essas perguntas.</span> A sessão é 100% aberta e honesta. Sem promessas falsas.
             </p>
         </div>

      </div>

      {/* 3. STICKY FOOTER CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
         <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden md:block">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Investimento</p>
               <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-gray-900">1 Crédito</span>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">Exclusivo Membros</span>
               </div>
            </div>
            
            <div className="flex-1 md:flex-none flex gap-4 w-full md:w-auto">
               <div className="md:hidden flex flex-col justify-center">
                  <span className="text-lg font-black text-gray-900">1 Crédito</span>
               </div>
               <button 
                 onClick={onBook}
                 className="flex-1 md:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-2xl shadow-xl shadow-brand-600/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
               >
                  <Calendar size={20} />
                  Agendar Sessão
               </button>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ServiceDetails;
