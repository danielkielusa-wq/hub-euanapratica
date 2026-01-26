import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Video, Users, Calendar, Settings, UserPlus } from 'lucide-react';
import { resolveGradient } from '@/lib/gradients';
import { CATEGORY_LABELS } from '@/types/admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  title: string;
  datetime: string;
  meeting_link?: string | null;
  status?: string | null;
}

interface Espaco {
  id: string;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  status?: string | null;
  category?: string | null;
  gradient_preset?: string | null;
  gradient_start?: string | null;
  gradient_end?: string | null;
  max_students?: number | null;
}

interface EspacoHeroHeaderProps {
  espaco: Espaco;
  nextSession?: Session | null;
  role?: 'student' | 'mentor';
  sessionsCount?: number;
  studentsCount?: number;
  onSettingsClick?: () => void;
  onInviteClick?: () => void;
}

const categoryLabels: Record<string, string> = {
  immersion: 'IMERSÃO',
  group_mentoring: 'MENTORIA ELITE',
  workshop: 'WORKSHOP',
  bootcamp: 'BOOTCAMP',
  course: 'CURSO',
};

export function EspacoHeroHeader({ 
  espaco, 
  nextSession, 
  role = 'student',
  sessionsCount = 0,
  studentsCount = 0,
  onSettingsClick,
  onInviteClick
}: EspacoHeroHeaderProps) {
  const navigate = useNavigate();

  const backPath = role === 'mentor' ? '/mentor/espacos' : '/dashboard/espacos';
  const categoryLabel = categoryLabels[espaco.category || 'group_mentoring'] || 'ESPAÇO';

  // Resolve background gradient
  const gradientStyle = espaco.cover_image_url
    ? { backgroundImage: `linear-gradient(to bottom right, rgba(79, 70, 229, 0.9), rgba(139, 92, 246, 0.9)), url(${espaco.cover_image_url})` }
    : { background: resolveGradient(
        espaco.gradient_preset,
        espaco.gradient_start,
        espaco.gradient_end,
        espaco.id
      )};

  // Format next session date
  const nextSessionDate = nextSession 
    ? format(new Date(nextSession.datetime), "dd MMM, HH:mm", { locale: ptBR })
    : null;

  return (
    <div
      className="relative bg-cover bg-center"
      style={gradientStyle}
    >
      <div className="relative z-10 px-6 py-8 lg:px-8">
        {/* Top Row: Back + Category Badge */}
        <div className="flex items-start justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(backPath)}
            className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full gap-2 px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>

          <div className="flex items-center gap-2">
            {role === 'mentor' && onInviteClick && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onInviteClick}
                className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Convidar</span>
              </Button>
            )}
            {role === 'mentor' && onSettingsClick && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onSettingsClick}
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/10 rounded-full"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <span className="px-4 py-1.5 text-xs font-semibold tracking-wide text-primary-foreground bg-primary-foreground/20 backdrop-blur-sm rounded-full">
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Main Content Row */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          {/* Left: Title & Stats */}
          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground">
              {espaco.name}
            </h1>
            
            <div className="flex items-center gap-4 text-primary-foreground/80 text-sm">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{studentsCount || espaco.max_students || 0} Alunos</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4" />
                <span>{sessionsCount} Sessões</span>
              </div>
            </div>
          </div>

          {/* Right: Next Session Card */}
          {nextSession && nextSession.meeting_link && (
            <div className="bg-card/95 backdrop-blur-sm rounded-[20px] p-4 shadow-lg min-w-[280px]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Próximo Encontro
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground mb-3">
                {nextSessionDate}
              </p>
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                asChild
              >
                <a href={nextSession.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  Acessar Sala ao Vivo
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
