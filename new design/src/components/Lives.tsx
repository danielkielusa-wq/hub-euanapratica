import React, { useState } from 'react';
import { 
  Play, 
  Calendar, 
  Clock, 
  Users, 
  MessageCircle, 
  Share2, 
  Bell, 
  MoreVertical,
  Search,
  Filter,
  Video,
  CheckCircle2
} from 'lucide-react';

interface LivesProps {
  onNavigate?: (page: string) => void;
}

export default function Lives({ onNavigate }: LivesProps) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate('LiveDetails');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Lives & Workshops <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider">Ao Vivo</span>
          </h2>
          <p className="text-gray-500 text-sm">Aprenda em tempo real com especialistas do mercado americano.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar lives..." 
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64 transition-all"
            />
          </div>
          <button className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Featured Live (Hero) */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-3">
        {/* Video Placeholder / Thumbnail */}
        <div className="lg:col-span-2 bg-gray-900 relative min-h-[300px] group cursor-pointer" onClick={handleCardClick}>
          <img 
            src="https://picsum.photos/seed/live_tech/1200/800" 
            alt="Live Thumbnail" 
            className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-indigo-600 ml-1" />
              </div>
            </div>
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              AO VIVO AGORA
            </span>
            <span className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Users className="w-3 h-3" />
              1.2k assistindo
            </span>
          </div>
        </div>

        {/* Live Details */}
        <div className="p-6 lg:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <img src="https://picsum.photos/seed/mentor_ana/40/40" className="w-8 h-8 rounded-full border border-gray-200" alt="Speaker" referrerPolicy="no-referrer" />
            <div>
              <p className="text-xs font-bold text-gray-800">Ana Silva</p>
              <p className="text-[10px] text-gray-500">Tech Recruiter @ Netflix</p>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight cursor-pointer hover:text-indigo-600 transition-colors" onClick={handleCardClick}>
            Como hackear o algoritmo do LinkedIn para vagas nos EUA
          </h1>
          <p className="text-gray-500 text-sm mb-6 line-clamp-3">
            Nesta live exclusiva, vamos analisar perfis reais e mostrar as palavras-chave exatas que os recrutadores da Big Tech usam para encontrar candidatos.
          </p>

          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={handleCardClick}
              className="flex-1 bg-[#7367F0] text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200"
            >
              Assistir Agora
            </button>
            <button className="p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Nesta Live</h4>
            <div className="flex flex-wrap gap-2">
              <Tag label="LinkedIn" />
              <Tag label="Recrutamento" />
              <Tag label="Carreira" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main List */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-6 border-b border-gray-200">
            <TabButton label="Próximas" active={activeTab === 'upcoming'} onClick={() => setActiveTab('upcoming')} />
            <TabButton label="Gravadas" active={activeTab === 'recorded'} onClick={() => setActiveTab('recorded')} />
            <TabButton label="Minha Lista" active={activeTab === 'mylist'} onClick={() => setActiveTab('mylist')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LiveCard 
              image="https://picsum.photos/seed/live1/600/400"
              date="Amanhã, 19:00"
              title="Inglês Técnico para Daily Scrum"
              speaker="Mike Ross"
              role="English Teacher"
              tags={['Idioma', 'Soft Skills']}
              isUpcoming
              onClick={handleCardClick}
            />
            <LiveCard 
              image="https://picsum.photos/seed/live2/600/400"
              date="05 Mar, 18:00"
              title="Mock Interview: System Design"
              speaker="Roberto Chen"
              role="Staff Engineer"
              tags={['Técnico', 'Entrevista']}
              isUpcoming
              onClick={handleCardClick}
            />
            <LiveCard 
              image="https://picsum.photos/seed/live3/600/400"
              date="Gravado • 1h 20m"
              title="Vistos EB-2 NIW: O Guia Definitivo"
              speaker="Dra. Julia Smith"
              role="Immigration Lawyer"
              tags={['Imigração', 'Legal']}
              views="3.4k visualizações"
              onClick={handleCardClick}
            />
            <LiveCard 
              image="https://picsum.photos/seed/live4/600/400"
              date="Gravado • 58m"
              title="Negociação de Salário em Dólar"
              speaker="Fernanda Lima"
              role="Career Coach"
              tags={['Carreira', 'Salário']}
              views="2.1k visualizações"
              onClick={handleCardClick}
            />
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="w-full lg:w-80 space-y-6">
          
          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Agenda Semanal
            </h3>
            <div className="space-y-4">
              <ScheduleItem day="SEG" date="02" title="Q&A Vistos" time="19:00" onClick={handleCardClick} />
              <ScheduleItem day="QUA" date="04" title="Live Code" time="20:00" onClick={handleCardClick} />
              <ScheduleItem day="QUI" date="05" title="Networking" time="18:30" onClick={handleCardClick} />
            </div>
            <button className="w-full mt-4 text-sm text-indigo-600 font-bold hover:underline">
              Ver calendário completo
            </button>
          </div>

          {/* Top Speakers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Top Mentores
            </h3>
            <div className="space-y-4">
              <SpeakerItem name="Ana Silva" role="Tech Recruiter" />
              <SpeakerItem name="Mike Ross" role="English Teacher" />
              <SpeakerItem name="Roberto Chen" role="Staff Engineer" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

function Tag({ label }: any) {
  return (
    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md uppercase tracking-wide">
      {label}
    </span>
  );
}

function TabButton({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
        active ? 'border-[#7367F0] text-[#7367F0]' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function LiveCard({ image, date, title, speaker, role, tags, isUpcoming, views, onClick }: any) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
        <div className="absolute top-3 left-3">
          <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
            {isUpcoming ? <Calendar className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {date}
          </span>
        </div>
        {!isUpcoming && (
          <div className="absolute bottom-3 right-3">
             <span className="text-white text-xs font-medium drop-shadow-md">{views}</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          {tags.map((tag: string, idx: number) => (
            <Tag key={idx} label={tag} />
          ))}
        </div>
        <h3 className="font-bold text-gray-800 text-lg mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
              {speaker.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-800">{speaker}</div>
              <div className="text-[10px] text-gray-500">{role}</div>
            </div>
          </div>
          <button className={`p-2 rounded-full transition-colors ${
            isUpcoming 
              ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
              : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'
          }`}>
            {isUpcoming ? <Bell className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleItem({ day, date, title, time, onClick }: any) {
  return (
    <div 
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-indigo-50 text-indigo-600 rounded-lg p-2 text-center min-w-[50px]">
        <div className="text-[10px] font-bold">{day}</div>
        <div className="text-lg font-bold leading-none">{date}</div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-gray-800 line-clamp-1">{title}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {time}
        </div>
      </div>
      <ChevronRightIcon />
    </div>
  );
}

function SpeakerItem({ name, role }: any) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
        {name.charAt(0)}
      </div>
      <div>
        <div className="text-sm font-bold text-gray-800">{name}</div>
        <div className="text-xs text-gray-500">{role}</div>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
