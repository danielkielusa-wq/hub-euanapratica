import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList, ChevronRight, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { resolveGradient } from '@/lib/gradients';
import { cn } from '@/lib/utils';
import type { EspacoWithStats } from '@/hooks/useStudentEspacosWithStats';
import type { MentorEspacoWithStats } from '@/hooks/useMentorEspacosWithStats';

interface NetflixEspacoCardProps {
  espaco: EspacoWithStats | MentorEspacoWithStats;
  role?: 'student' | 'mentor';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Em Andamento', className: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
  completed: { label: 'Concluído', className: 'bg-blue-100 text-blue-700' },
  arquivado: { label: 'Arquivado', className: 'bg-gray-100 text-gray-600' },
};

const categoryLabels: Record<string, string> = {
  immersion: 'Imersão',
  group_mentoring: 'Mentoria em Grupo',
  workshop: 'Workshop',
  bootcamp: 'Bootcamp',
  course: 'Curso',
};

export function NetflixEspacoCard({ espaco, role = 'student' }: NetflixEspacoCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const status = statusConfig[espaco.status || 'active'] || statusConfig.active;
  const hasImage = !!espaco.cover_image_url;
  const isMentor = role === 'mentor';

  // Resolve gradient with preset support
  const backgroundGradient = resolveGradient(
    (espaco as any).gradient_preset,
    (espaco as any).gradient_start,
    (espaco as any).gradient_end,
    espaco.id
  );

  // Get mentor-specific stats if available
  const mentorEspaco = espaco as MentorEspacoWithStats;
  const enrolledCount = mentorEspaco.enrolled_count;

  const handleClick = () => {
    if (isMentor) {
      navigate(`/mentor/espacos/${espaco.id}`);
    } else {
      navigate(`/dashboard/espacos/${espaco.id}`);
    }
  };

  return (
    <div
      className={cn(
        'relative aspect-[3/4] rounded-[24px] overflow-hidden cursor-pointer group w-full',
        'transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-2xl hover:z-10'
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background - Image or Gradient */}
      {hasImage ? (
        <img
          src={espaco.cover_image_url!}
          alt={espaco.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{ background: backgroundGradient }}
        />
      )}

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Status Badge */}
      <Badge 
        className={cn(
          'absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full shadow-lg',
          status.className
        )}
      >
        {status.label}
      </Badge>

      {/* Category Badge (top-left) */}
      {espaco.category && (
        <Badge 
          variant="secondary"
          className="absolute top-4 left-4 px-2 py-0.5 text-xs bg-white/20 text-white backdrop-blur-sm rounded-full"
        >
          {categoryLabels[espaco.category] || espaco.category}
        </Badge>
      )}

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col">
        {/* Title */}
        <h3 className="font-bold text-white text-xl font-sans leading-tight mb-2 line-clamp-2">
          {espaco.name}
        </h3>

        {/* Stats */}
        <div className="flex items-center gap-4 text-white/80 text-sm mb-3">
          {isMentor && enrolledCount !== undefined ? (
            <>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{espaco.upcomingSessions} sessões</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span>{espaco.pendingAssignments} correções</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{espaco.upcomingSessions} sessões</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span>{espaco.pendingAssignments} tarefas</span>
              </div>
            </>
          )}
        </div>

        {/* Access Button - appears on hover */}
        <div
          className={cn(
            'transition-all duration-200 overflow-hidden',
            isHovered ? 'max-h-12 opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-2'
          )}
        >
          <Button
            size="sm"
            className={cn(
              "w-full font-medium rounded-xl shadow-lg",
              isMentor 
                ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isMentor ? (
              <>
                <Settings className="h-4 w-4 mr-1" />
                Gerenciar
              </>
            ) : (
              <>
                Acessar
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar - thin line at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary/30">
        <Progress 
          value={espaco.progressPercent} 
          className="h-full rounded-none [&>div]:rounded-none"
        />
      </div>
    </div>
  );
}
