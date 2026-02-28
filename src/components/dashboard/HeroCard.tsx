import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function HeroCard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-primary via-primary to-purple-600 text-primary-foreground">
      <p className="text-sm font-medium opacity-80">
        {firstName ? `Olá, ${firstName}` : 'Bem-vindo'}
      </p>
      <h1 className="text-xl sm:text-2xl font-bold mt-1 max-w-md">
        Domine sua carreira internacional com mentorias práticas
      </h1>
      <Button
        onClick={() => navigate('/dashboard/hub')}
        className="mt-5 bg-white hover:bg-white/90 text-primary rounded-xl px-6 py-2.5 h-auto font-semibold"
      >
        Ir para Meu Hub
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
