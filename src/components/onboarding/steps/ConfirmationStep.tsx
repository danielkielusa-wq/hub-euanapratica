import { CheckCircle2, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface ConfirmationStepProps {
  onComplete: () => void;
  isCompleting: boolean;
}

const nextSteps = [
  {
    icon: BookOpen,
    text: 'Acesso aos seus Espaços e conteúdos exclusivos.',
  },
  {
    icon: Sparkles,
    text: 'Recomendações mais assertivas nas mentorias.',
  },
  {
    icon: MessageSquare,
    text: 'Comunicação mais eficiente por email e WhatsApp.',
  },
];

export function ConfirmationStep({ onComplete, isCompleting }: ConfirmationStepProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-in zoom-in duration-500">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
          Seu perfil está configurado com sucesso
        </h1>
        <p className="text-muted-foreground text-base">
          Agora você está pronto para avançar na sua jornada internacional com o EUA Na Prática.
        </p>
      </div>

      {/* What happens next */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">
            O que acontece agora?
          </h3>
          <ul className="space-y-4">
            {nextSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <step.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-foreground pt-1.5">
                  {step.text}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-sm text-muted-foreground text-center">
        Você pode alterar seus dados a qualquer momento no seu Perfil.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-full py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 disabled:opacity-50"
        >
          {isCompleting ? 'Finalizando...' : 'Ir para meu painel'}
        </button>
        <button
          onClick={() => navigate('/perfil')}
          className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver meu perfil
        </button>
      </div>
    </div>
  );
}
