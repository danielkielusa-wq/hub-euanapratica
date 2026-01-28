import { Rocket, Sparkles, Users, Target, GraduationCap } from 'lucide-react';

interface WelcomeStepProps {
  onStart: () => void;
}

const benefits = [
  {
    icon: Sparkles,
    title: 'IA de Currículos',
    description: 'Valide seu CV para o padrão USA',
  },
  {
    icon: Users,
    title: 'Comunidade Elite',
    description: 'Networking com brasileiros nos EUA',
  },
  {
    icon: Target,
    title: 'Foco em Vistos',
    description: 'Trilhas para O-1 e EB-2 NIW',
  },
  {
    icon: GraduationCap,
    title: 'Trilhas de Carreira',
    description: 'Mentorias e conteúdos exclusivos',
  },
];

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Icon */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Rocket className="h-10 w-10 text-primary" />
      </div>

      {/* Title */}
      <h1 className="mb-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        Prepare-se para decolar
      </h1>
      <p className="mb-10 max-w-md text-muted-foreground">
        Sua jornada internacional começa com um perfil bem configurado. Em poucos passos você terá
        acesso ao ecossistema completo.
      </p>

      {/* Benefits Grid */}
      <div className="mb-10 grid w-full grid-cols-2 gap-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="flex flex-col items-center rounded-2xl border border-border/50 bg-muted/30 p-4 transition-all hover:border-primary/30 hover:bg-muted/50"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <benefit.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
            <p className="text-xs text-muted-foreground">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={onStart}
        className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
      >
        Configurar meu Perfil →
      </button>
    </div>
  );
}
