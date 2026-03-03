import React, { useState } from 'react';
import { 
  Play, 
  BookOpen, 
  Award, 
  Clock, 
  CheckCircle, 
  MoreVertical, 
  Star, 
  TrendingUp,
  Search,
  Filter,
  ChevronRight,
  Lock
} from 'lucide-react';

export default function MeusCursos() {
  const [activeTab, setActiveTab] = useState('in_progress');

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Meus Cursos</h2>
          <p className="text-gray-500 text-sm">Continue sua jornada de aprendizado e conquiste novas habilidades.</p>
        </div>
        
        <div className="flex gap-4">
          <StatBadge icon={BookOpen} value="4" label="Em Andamento" color="text-indigo-600" bg="bg-indigo-50" />
          <StatBadge icon={Award} value="2" label="Certificados" color="text-orange-600" bg="bg-orange-50" />
          <StatBadge icon={Clock} value="12h" label="Horas Estudadas" color="text-green-600" bg="bg-green-50" />
        </div>
      </div>

      {/* Hero: Continue Learning */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

        {/* Thumbnail */}
        <div className="w-full md:w-80 h-48 rounded-xl overflow-hidden relative shadow-md group cursor-pointer shrink-0">
          <img 
            src="https://picsum.photos/seed/course_hero/800/600" 
            alt="Course Thumbnail" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-[#7367F0] w-[65%]"></div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wide">
              Em Andamento
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Módulo 3 de 8
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Inglês para Tech Recruiters: Technical Terms & Culture
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-2xl">
            Aprenda o vocabulário essencial para conduzir entrevistas técnicas em inglês e entenda a cultura das Big Techs americanas.
          </p>

          <div className="flex items-center gap-6">
            <button className="bg-[#7367F0] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
              <Play className="w-4 h-4 fill-white" />
              Continuar Aula
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-400 uppercase">Próxima Aula</span>
              <span className="text-sm font-medium text-gray-700">3.2 - Understanding Equity & Stock Options</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-6">
        
        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-4">
          <div className="flex gap-6 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <TabButton label="Em Andamento" active={activeTab === 'in_progress'} onClick={() => setActiveTab('in_progress')} count={4} />
            <TabButton label="Concluídos" active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} count={2} />
            <TabButton label="Favoritos" active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar meus cursos..." 
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full transition-all"
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          <CourseCard 
            image="https://picsum.photos/seed/course1/600/400"
            category="CARREIRA"
            title="LinkedIn Optimization Masterclass"
            instructor="Ana Silva"
            progress={35}
            totalModules={12}
            completedModules={4}
            lastAccessed="2 dias atrás"
          />

          <CourseCard 
            image="https://picsum.photos/seed/course2/600/400"
            category="IMIGRAÇÃO"
            title="O Guia Definitivo do Visto O-1"
            instructor="Dra. Julia Smith"
            progress={12}
            totalModules={20}
            completedModules={2}
            lastAccessed="5 dias atrás"
          />

          <CourseCard 
            image="https://picsum.photos/seed/course3/600/400"
            category="SOFT SKILLS"
            title="Negociação e Salário em Dólar"
            instructor="Fernanda Lima"
            progress={88}
            totalModules={10}
            completedModules={8}
            lastAccessed="1 semana atrás"
          />

          <CourseCard 
            image="https://picsum.photos/seed/course4/600/400"
            category="TÉCNICO"
            title="System Design Interview Prep"
            instructor="Roberto Chen"
            progress={0}
            totalModules={25}
            completedModules={0}
            isLocked={false} // Just started
            cta="Começar"
          />

           <CourseCard 
            image="https://picsum.photos/seed/course5/600/400"
            category="BÔNUS"
            title="Networking nos EUA"
            instructor="Equipe Rota EUA"
            isLocked
            cta="Bloqueado"
          />

        </div>
      </div>

    </div>
  );
}

function StatBadge({ icon: Icon, value, label, color, bg }: any) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${bg} border border-transparent`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <div className={`text-lg font-bold ${color} leading-none`}>{value}</div>
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={`pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
        active ? 'border-[#7367F0] text-[#7367F0]' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {count && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function CourseCard({ 
  image, 
  category, 
  title, 
  instructor, 
  progress, 
  totalModules, 
  completedModules, 
  lastAccessed,
  isLocked,
  cta
}: any) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full ${isLocked ? 'opacity-75' : ''}`}>
      {/* Image Area */}
      <div className="relative h-48 overflow-hidden">
        <img src={image} alt={title} className={`w-full h-full object-cover transition-transform duration-500 ${!isLocked && 'group-hover:scale-105'}`} referrerPolicy="no-referrer" />
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
        )}
        {!isLocked && progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-[#7367F0] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wide">
            {category}
          </span>
          {progress === 100 && (
            <span className="text-green-500">
              <CheckCircle className="w-5 h-5" />
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-800 text-lg mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-4">com {instructor}</p>

        <div className="mt-auto space-y-4">
          {!isLocked ? (
            <>
              <div className="flex justify-between items-end text-xs">
                <span className="text-gray-500 font-medium">
                  {progress}% Concluído
                </span>
                <span className="text-gray-400">
                  {completedModules}/{totalModules} Módulos
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {lastAccessed || 'Não iniciado'}
                </span>
                <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  {cta || 'Continuar'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
             <div className="pt-4 border-t border-gray-50">
                <button className="w-full py-2 bg-gray-100 text-gray-500 text-sm font-bold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                  <Lock className="w-3 h-3" />
                  Bloqueado
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
