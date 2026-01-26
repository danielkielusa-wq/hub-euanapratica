import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { MoreVertical, Video, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EspacoStats {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  cover_image_url?: string | null;
  gradient_preset?: string | null;
  gradient_start?: string | null;
  gradient_end?: string | null;
  sessions_count?: number;
  pending_assignments?: number;
  completed_sessions?: number;
  total_assignments?: number;
}

interface StudentEspacoCardProps {
  espaco: EspacoStats;
}

const categoryLabels: Record<string, string> = {
  immersion: 'IMERSÃO',
  group_mentoring: 'MENTORIA',
  workshop: 'WORKSHOP',
  bootcamp: 'BOOTCAMP',
  course: 'CURSO',
};

const categoryGradients: Record<string, string> = {
  immersion: 'from-primary via-primary to-purple-600',
  group_mentoring: 'from-primary via-primary to-purple-600',
  workshop: 'from-teal-400 via-teal-500 to-emerald-600',
  bootcamp: 'from-pink-500 via-pink-600 to-purple-600',
  course: 'from-amber-400 via-orange-500 to-red-500',
};

export function StudentEspacoCard({ espaco }: StudentEspacoCardProps) {
  const navigate = useNavigate();

  const category = espaco.category || 'group_mentoring';
  const categoryLabel = categoryLabels[category] || 'ESPAÇO';
  const gradient = categoryGradients[category] || categoryGradients.group_mentoring;

  // Calculate progress
  const totalSessions = (espaco.sessions_count || 0);
  const completedSessions = espaco.completed_sessions || 0;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Module count (using folders/sessions as proxy)
  const moduleCount = totalSessions;
  const activityCount = espaco.total_assignments || espaco.pending_assignments || 0;

  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200",
        "rounded-[20px] border border-border/50 bg-card",
        "hover:shadow-lg hover:border-primary/20"
      )}
      onClick={() => navigate(`/dashboard/espacos/${espaco.id}`)}
    >
      {/* Gradient Header Area */}
      <div className={cn(
        "relative aspect-[16/9] bg-gradient-to-br",
        gradient
      )}>
        {/* Cover Image Overlay */}
        {espaco.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${espaco.cover_image_url})`,
              opacity: 0.3
            }}
          />
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-semibold tracking-wide text-primary-foreground bg-background/20 backdrop-blur-sm rounded-full">
            {categoryLabel}
          </span>
        </div>

        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-background/20"
          onClick={(e) => {
            e.stopPropagation();
            // Could open a dropdown menu here
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2">
          {espaco.name}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Video className="h-4 w-4" />
            <span>{moduleCount} Módulos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4" />
            <span>{activityCount} Atividades</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>
    </Card>
  );
}

export function ExploreCoursesCard() {
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200",
        "rounded-[20px] border border-dashed border-border bg-muted/30",
        "hover:border-primary/40 hover:bg-muted/50",
        "flex flex-col items-center justify-center min-h-[280px]"
      )}
    >
      <div className="text-center p-6">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="font-semibold text-foreground mb-1">Explorar Cursos</h3>
        <p className="text-sm text-muted-foreground">Descubra novos programas</p>
      </div>
    </Card>
  );
}
