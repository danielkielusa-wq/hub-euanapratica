import { Target, Users, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeStepProps {
  onStart: () => void;
}

const benefits = [
  {
    icon: Target,
    title: 'Oportunidades personalizadas',
    description: 'Vagas e mentorias alinhadas ao seu perfil profissional.',
  },
  {
    icon: Users,
    title: 'Networking estratégico',
    description: 'Conecte-se com profissionais brasileiros nos EUA.',
  },
  {
    icon: BookOpen,
    title: 'Conteúdo exclusivo',
    description: 'Materiais e ferramentas selecionadas para você.',
  },
];

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Bem-vindo(a) ao EUA Na Prática
        </h1>
        <p className="text-muted-foreground text-base">
          Em poucos passos vamos preparar seu perfil para acelerar sua carreira internacional.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-4">
        {benefits.map((benefit) => (
          <Card
            key={benefit.title}
            className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20"
          >
            <CardContent className="flex items-start gap-4 p-5">
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time Estimate */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Leva cerca de 3–5 minutos</span>
      </div>

      {/* CTA Button */}
      <button
        onClick={onStart}
        className="w-full py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200"
      >
        Começar meu onboarding
      </button>
    </div>
  );
}
