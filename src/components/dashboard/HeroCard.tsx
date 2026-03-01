import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function HeroCard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="relative p-8 sm:p-10 rounded-[24px] bg-gradient-to-br from-[#7367f0] via-[#9E95F5] to-[#CE9FFC] text-white overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-white/[0.07] rounded-full" />
      <div className="absolute top-1/2 right-[12%] w-20 h-20 bg-white/[0.05] rounded-full" />

      {/* Content */}
      <div className="relative z-10">
        <p className="text-sm font-medium text-white/80">
          {firstName ? `Olá, ${firstName}!` : 'Bem-vindo!'}
        </p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 max-w-lg leading-tight">
          Domine sua carreira internacional com mentorias práticas
        </h1>
        <Button
          onClick={() => navigate('/dashboard/hub')}
          className="mt-6 bg-white hover:bg-white/95 text-[#7367f0] shadow-lg shadow-black/10 rounded-2xl px-8 py-3 h-auto font-bold text-sm"
        >
          Ir para Meu Hub
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
