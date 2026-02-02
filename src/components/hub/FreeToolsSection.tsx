import { FileSearch, PlayCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface FreeToolsSectionProps {
  creditsRemaining: number;
  isLoading?: boolean;
}

export function FreeToolsSection({ creditsRemaining, isLoading }: FreeToolsSectionProps) {
  const navigate = useNavigate();

  const handleOpenAI = () => {
    navigate('/curriculo');
  };

  const handleOpenClass = () => {
    window.open('https://youtube.com/playlist?list=PLxyz', '_blank');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Skeleton className="h-64 rounded-[32px]" />
        <Skeleton className="h-64 rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {/* Card 1: ResumePass AI */}
      <div 
        onClick={handleOpenAI}
        className="group bg-card rounded-[32px] p-8 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSearch size={28} />
            </div>
            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
              creditsRemaining > 0 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {creditsRemaining > 0 ? `${creditsRemaining} Crédito${creditsRemaining > 1 ? 's' : ''} Disp.` : 'Sem Créditos'}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-2">ResumePass AI</h3>
          <p className="text-muted-foreground text-sm mb-8 flex-1">
            Sua análise mensal gratuita. Descubra se seu currículo passa nos robôs americanos.
          </p>

          <div className="flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-4 transition-all">
            Iniciar Análise <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Card 2: Base Class */}
      <div 
        onClick={handleOpenClass}
        className="group bg-card rounded-[32px] p-8 border border-border shadow-sm hover:shadow-xl hover:border-purple-400/30 transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlayCircle size={28} />
            </div>
            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              Aula Base
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-foreground mb-2">Primeiros Passos</h3>
          <p className="text-muted-foreground text-sm mb-8 flex-1">
            Masterclass: Os fundamentos da carreira internacional que ninguém te conta.
          </p>

          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm group-hover:gap-4 transition-all">
            Assistir Agora <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
