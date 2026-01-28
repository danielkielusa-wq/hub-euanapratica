import { CheckCircle2, BookOpen, MessageSquare, Sparkles, Rocket } from 'lucide-react';

interface ConfirmationStepProps {
  onComplete: () => void;
  isCompleting: boolean;
}

const nextSteps = [
  {
    icon: Sparkles,
    text: 'Acesso à IA de Currículos para validação ATS',
  },
  {
    icon: BookOpen,
    text: 'Conteúdos exclusivos e trilhas de carreira',
  },
  {
    icon: MessageSquare,
    text: 'Comunicação direta com mentores',
  },
];

export function ConfirmationStep({ onComplete, isCompleting }: ConfirmationStepProps) {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
      {/* Success Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 animate-in zoom-in duration-500">
        <CheckCircle2 className="h-10 w-10 text-accent" />
      </div>

      {/* Title */}
      <h1 className="mb-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
        Perfil configurado com sucesso!
      </h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Agora você está pronto para acelerar sua jornada internacional.
      </p>

      {/* Resources Unlocked Card */}
      <div className="mb-8 w-full rounded-2xl bg-foreground p-6 text-left">
        <div className="mb-4 flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-background">Recursos Desbloqueados</h3>
        </div>
        <ul className="space-y-3">
          {nextSteps.map((step, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <step.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-background/80">{step.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Note */}
      <p className="mb-6 text-xs text-muted-foreground">
        Você pode alterar seus dados a qualquer momento no seu Perfil.
      </p>

      {/* CTA */}
      <button
        onClick={onComplete}
        disabled={isCompleting}
        className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isCompleting ? 'Finalizando...' : 'Acessar Meu Hub →'}
      </button>
    </div>
  );
}
