import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Video, Calendar } from 'lucide-react';
import { getEspacoGradient } from '@/lib/gradients';
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
}

interface EspacoHeroHeaderProps {
  espaco: Espaco;
  nextSession?: Session | null;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400',
  inactive: 'bg-muted text-muted-foreground',
  completed: 'bg-primary/10 text-primary border-primary/20',
  arquivado: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  completed: 'Concluído',
  arquivado: 'Arquivado',
};

export function EspacoHeroHeader({ espaco, nextSession }: EspacoHeroHeaderProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const backgroundStyle = espaco.cover_image_url
    ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${espaco.cover_image_url})` }
    : { background: getEspacoGradient(espaco.id) };

  return (
    <>
      {/* Main Hero */}
      <div
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          isScrolled ? "h-0 opacity-0" : "h-auto opacity-100"
        )}
      >
        <div
          className="relative min-h-[200px] bg-cover bg-center"
          style={backgroundStyle}
        >
          {/* Glassmorphism Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
          
          {/* Content */}
          <div className="relative z-10 p-6 pb-8">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard/espacos')}
              className="mb-4 h-10 w-10 rounded-full bg-background/20 backdrop-blur-sm text-foreground hover:bg-background/40 border border-border/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {/* Title & Badges */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-xs", statusColors[espaco.status || 'active'])}>
                  {statusLabels[espaco.status || 'active']}
                </Badge>
                {espaco.category && (
                  <Badge variant="outline" className="bg-background/30 backdrop-blur-sm border-border/30 text-foreground">
                    {CATEGORY_LABELS[espaco.category as keyof typeof CATEGORY_LABELS] || espaco.category}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground drop-shadow-sm">
                {espaco.name}
              </h1>
              
              {espaco.description && (
                <p className="text-sm text-muted-foreground/90 max-w-2xl line-clamp-2">
                  {espaco.description}
                </p>
              )}
            </div>

            {/* Next Session CTA */}
            {nextSession && nextSession.meeting_link && (
              <div className="mt-6 inline-flex items-center gap-3 p-3 rounded-2xl bg-background/70 backdrop-blur-md border border-border/40">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Próximo:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(nextSession.datetime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl" asChild>
                  <a href={nextSession.meeting_link} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-1.5" />
                    Acessar
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Compact Header */}
      <div
        className={cn(
          "sticky top-0 z-30 transition-all duration-300",
          isScrolled 
            ? "translate-y-0 opacity-100" 
            : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 py-3">
          <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard/espacos')}
                className="h-9 w-9 rounded-full shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="font-semibold text-foreground truncate">{espaco.name}</h2>
            </div>
            
            {nextSession && nextSession.meeting_link && (
              <Button size="sm" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl shrink-0" asChild>
                <a href={nextSession.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-1.5" />
                  Acessar
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
