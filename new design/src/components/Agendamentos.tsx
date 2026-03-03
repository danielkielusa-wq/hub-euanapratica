import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  MoreVertical, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

export default function Agendamentos() {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Meus Agendamentos</h2>
          <p className="text-gray-500 text-sm">Gerencie suas sessões e mentorias</p>
        </div>
        <button className="bg-[#7367F0] text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-indigo-600 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Calendar & Filters */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800">Março 2026</h3>
              <div className="flex gap-2">
                <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-xs font-medium text-gray-400 py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isToday = day === 2; // Example
                const hasEvent = [2, 5, 12, 18].includes(day);
                const isSelected = day === 2;
                
                return (
                  <button 
                    key={day}
                    className={`
                      h-8 w-8 rounded-full text-sm flex items-center justify-center relative transition-all
                      ${isSelected ? 'bg-[#7367F0] text-white shadow-md shadow-indigo-200' : 'text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    {day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7367F0] rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Filtros</h3>
            <div className="space-y-1">
              <FilterItem label="Todos os Agendamentos" count={12} active />
              <FilterItem label="Confirmados" count={8} color="bg-green-100 text-green-600" />
              <FilterItem label="Pendentes" count={3} color="bg-orange-100 text-orange-600" />
              <FilterItem label="Cancelados" count={1} color="bg-red-100 text-red-600" />
            </div>
          </div>
        </div>

        {/* Right Column: Appointment List */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          
          {/* List Header */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-800 text-lg">Próximos Eventos</h3>
              <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
                4 Agendados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64 transition-all"
                />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="divide-y divide-gray-50">
            <AppointmentItem 
              date={{ day: '02', month: 'MAR', time: '09:00' }}
              title="Sessão Estratégica Individual"
              type="Mentoria 1:1"
              location="Google Meet"
              avatar="https://picsum.photos/seed/mentor1/40/40"
              mentor="Dr. Sarah Wilson"
              status="Confirmado"
              statusColor="bg-green-100 text-green-600"
            />
            <AppointmentItem 
              date={{ day: '05', month: 'MAR', time: '14:00' }}
              title="Workshop: LinkedIn Optimization"
              type="Workshop em Grupo"
              location="Zoom"
              avatar="https://picsum.photos/seed/mentor2/40/40"
              mentor="Grupo A"
              status="Confirmado"
              statusColor="bg-green-100 text-green-600"
            />
            <AppointmentItem 
              date={{ day: '12', month: 'MAR', time: '10:00' }}
              title="Revisão de Currículo"
              type="Análise Técnica"
              location="Assíncrono"
              avatar="https://picsum.photos/seed/mentor3/40/40"
              mentor="Equipe Rota EUA"
              status="Pendente"
              statusColor="bg-orange-100 text-orange-600"
            />
            <AppointmentItem 
              date={{ day: '18', month: 'MAR', time: '16:30' }}
              title="Q&A: Vistos e Imigração"
              type="Live Q&A"
              location="Youtube Privado"
              avatar="https://picsum.photos/seed/mentor4/40/40"
              mentor="Dra. Ana Silva"
              status="Confirmado"
              statusColor="bg-green-100 text-green-600"
            />
          </div>
          
          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex justify-center">
            <button className="text-sm text-indigo-600 font-medium hover:underline">
              Ver todos os agendamentos
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function FilterItem({ label, count, active, color }: any) {
  return (
    <button className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
      active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
    }`}>
      <div className="flex items-center gap-2">
        {color && <span className={`w-2 h-2 rounded-full ${color.split(' ')[0]}`}></span>}
        <span>{label}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
        {count}
      </span>
    </button>
  );
}

function AppointmentItem({ date, title, type, location, avatar, mentor, status, statusColor }: any) {
  return (
    <div className="p-6 hover:bg-gray-50 transition-all group cursor-pointer">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        
        {/* Date Box */}
        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-1 min-w-[80px]">
          <div className="text-3xl font-bold text-gray-800">{date.day}</div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{date.month}</div>
          <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1">
            {date.time}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
              {title}
            </h4>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${statusColor}`}>
              {status}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4" />
              {type}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <img src={avatar} alt={mentor} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
            <span className="text-xs font-medium text-gray-600">Com {mentor}</span>
          </div>
        </div>

        {/* Action */}
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
