import { useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  Video,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { EspacoWithStats } from '@/hooks/useStudentEspacosWithStats';

interface StudentEspacoCardProps {
  espaco: EspacoWithStats;
}

const categoryLabels: Record<string, string> = {
  immersion: 'IMERSÃO',
  group_mentoring: 'MENTORIA',
  workshop: 'WORKSHOP',
  bootcamp: 'BOOTCAMP',
  course: 'CURSO',
  hot_seat: 'HOT SEAT',
  community: 'COMUNIDADE',
};

const categoryGradients: Record<string, string> = {
  immersion: 'from-blue-600 to-indigo-600',
  group_mentoring: 'from-blue-600 to-indigo-600',
  workshop: 'from-teal-400 to-emerald-600',
  bootcamp: 'from-pink-500 to-purple-600',
  course: 'from-amber-400 to-red-500',
  hot_seat: 'from-orange-500 to-red-500',
  community: 'from-emerald-500 to-teal-500',
};

export function StudentEspacoCard({ espaco }: StudentEspacoCardProps) {
  const navigate = useNavigate();

  const category = espaco.category || 'group_mentoring';
  const categoryLabel = categoryLabels[category] || 'ESPAÇO';
  const gradient = categoryGradients[category] || categoryGradients.group_mentoring;
  const isCommunity = category === 'community';

  const moduleCount = espaco.totalSessions;
  const activityCount = espaco.totalAssignments;
  const progressPercent = espaco.progressPercent;

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col cursor-pointer"
      onClick={() => navigate(`/dashboard/espacos/${espaco.id}`)}
    >
      {/* Header */}
      <div className={`h-32 bg-gradient-to-r ${gradient} p-6 relative`}>
        <div className="flex justify-between items-start">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border border-white/10">
            {categoryLabel}
          </span>
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Cover Image Overlay */}
        {espaco.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${espaco.cover_image_url})`,
              opacity: 0.3,
            }}
          />
        )}

        {/* Decorative Circle */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-gray-800 mb-4 leading-tight group-hover:text-indigo-600 transition-colors">
          {espaco.name}
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-500">
            <Video className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{moduleCount} Módulos</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{activityCount} Atividades</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs">{espaco.membersCount} Membros</span>
          </div>
          {espaco.nextSessionLabel && (
            <div className="flex items-center gap-2 text-indigo-600 font-medium">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">{espaco.nextSessionLabel}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto">
          {!isCommunity ? (
            <div className="space-y-2">
              <div className="flex justify-between items-end text-xs">
                <span className="font-bold text-gray-700">Progresso</span>
                <span className="font-bold text-indigo-600">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${espaco.hasLiveSession ? 'bg-red-500' : 'bg-[#7367F0]'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <button className="w-full py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Acessar Comunidade
            </button>
          )}

          {espaco.hasLiveSession && (
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

export function ExploreCoursesCard() {
  const navigate = useNavigate();

  return (
    <div
      className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center hover:bg-gray-100 transition-colors cursor-pointer group min-h-[300px]"
      onClick={() => navigate('/dashboard/hub')}
    >
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
  );
}
