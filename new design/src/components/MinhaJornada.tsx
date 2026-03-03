import React, { useState } from 'react';
import { 
  MoreVertical, 
  Plus, 
  Video, 
  FileText, 
  Users, 
  ArrowRight,
  Layout,
  Calendar,
  MessageSquare
} from 'lucide-react';

export default function MinhaJornada() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Minha Jornada</h2>
          <p className="text-gray-500 text-sm">Seus espaços exclusivos de mentoria e acompanhamento.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <TabButton label="Em andamento" active={activeTab === 'active'} onClick={() => setActiveTab('active')} />
          <TabButton label="Concluídos" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
          <TabButton label="Todos" active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Card 1: Mentoria Principal */}
        <SpaceCard 
          title="Mentoria em Grupo ROTA EUA™ - Turma Abril"
          type="MENTORIA"
          gradient="from-blue-600 to-indigo-600"
          modules={8}
          activities={24}
          progress={65}
          members={12}
          nextSession="Terça, 19:00"
        />

        {/* Card 2: Hot Seats */}
        <SpaceCard 
          title="Monthly Hot Seats & Q&A"
          type="HOT SEAT"
          gradient="from-orange-500 to-red-500"
          modules={12}
          activities={5}
          progress={100}
          members={156}
          nextSession="05/04 - 18:00"
          isLive
        />

        {/* Card 3: Comunidade VIP */}
        <SpaceCard 
          title="Networking VIP & Vagas"
          type="COMUNIDADE"
          gradient="from-emerald-500 to-teal-500"
          modules={0}
          activities={142}
          progress={0}
          members={840}
          hideProgress
        />

        {/* Card 4: Explore Placeholder */}
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center hover:bg-gray-100 transition-colors cursor-pointer group min-h-[300px]">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Explorar Novos Espaços</h3>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Descubra novas mentorias, grupos de estudo e comunidades para acelerar sua jornada.
          </p>
          <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Ver Catálogo <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
        active ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function SpaceCard({ 
  title, 
  type, 
  gradient, 
  modules, 
  activities, 
  progress, 
  members,
  nextSession,
  isLive,
  hideProgress
}: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
      
      {/* Header */}
      <div className={`h-32 bg-gradient-to-r ${gradient} p-6 relative`}>
        <div className="flex justify-between items-start">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border border-white/10">
            {type}
          </span>
          <button className="text-white/80 hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Video className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{modules} Módulos</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{activities} Atividades</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{members} Membros</span>
          </div>
          {nextSession && (
            <div className="flex items-center gap-2 text-indigo-600 font-medium">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{nextSession}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto">
          {!hideProgress ? (
            <div className="space-y-2">
              <div className="flex justify-between items-end text-xs">
                <span className="font-bold text-gray-700">Progresso</span>
                <span className="font-bold text-indigo-600">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${isLive ? 'bg-red-500' : 'bg-[#7367F0]'}`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Acessar Comunidade
            </button>
          )}

          {isLive && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-red-600 bg-red-50 py-2 rounded-lg animate-pulse">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              Sessão ao vivo em breve
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
