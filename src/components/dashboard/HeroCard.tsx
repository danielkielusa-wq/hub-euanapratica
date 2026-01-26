import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function HeroCard() {
  const navigate = useNavigate();

  return (
    <div className="p-8 rounded-[24px] bg-gradient-to-br from-primary via-primary to-purple-600 text-primary-foreground">
      <span className="text-xs font-semibold tracking-widest uppercase opacity-80">
        ONLINE COURSE
      </span>
      <h1 className="text-2xl md:text-3xl font-bold mt-2 max-w-md">
        Domine sua carreira internacional com mentorias práticas
      </h1>
      <Button 
        onClick={() => navigate('/dashboard/espacos')}
        className="mt-6 bg-foreground hover:bg-foreground/90 text-background rounded-xl px-6 py-2.5 h-auto"
      >
        Acessar Mentoria
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
