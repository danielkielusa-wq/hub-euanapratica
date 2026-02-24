import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Mic, Calendar, Globe, ArrowRight, Sparkles } from 'lucide-react';

interface EspacosEmptyStateProps {
  onExplore: () => void;
}

const features = [
  {
    icon: Mic,
    label: 'Hot Seats',
    description: 'Apresente seu caso e receba orientação ao vivo de quem já fez a transição',
    gradient: 'from-amber-500 to-orange-600',
    bgGlow: 'bg-amber-500/10',
  },
  {
    icon: Users,
    label: 'Mentorias em Grupo',
    description: 'Conecte-se com brasileiros que já construíram carreira nos EUA',
    gradient: 'from-primary to-purple-600',
    bgGlow: 'bg-primary/10',
  },
  {
    icon: Calendar,
    label: 'Encontros Exclusivos',
    description: 'Imersões e workshops sobre mercado americano, vistos e networking',
    gradient: 'from-teal-400 to-emerald-600',
    bgGlow: 'bg-teal-500/10',
  },
  {
    icon: Globe,
    label: 'Carreira Internacional',
    description: 'Conteúdos práticos sobre trabalho remoto, currículo e entrevistas em inglês',
    gradient: 'from-pink-500 to-rose-600',
    bgGlow: 'bg-pink-500/10',
  },
];

export function EspacosEmptyState({ onExplore }: EspacosEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Hero Section */}
      <div className="relative mb-10">
        {/* Decorative glow */}
        <div className="absolute -inset-8 bg-gradient-to-r from-primary/5 via-purple-500/5 to-teal-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col items-center">
          {/* Animated icon cluster */}
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 rotate-6 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-3">
            Sua jornada internacional<br className="hidden sm:block" /> começa aqui
          </h2>
          <p className="text-muted-foreground text-center max-w-lg text-base leading-relaxed">
            Brasileiros que participam dos nossos espaços chegam mais rápido aos EUA
            porque aprendem com quem já fez essa transição. Não enfrente sozinho o que
            pode conquistar com a comunidade certa ao seu lado.
          </p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-10">
        {features.map((feature) => (
          <Card
            key={feature.label}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:shadow-md hover:border-primary/20"
          >
            {/* Subtle background glow on hover */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 ${feature.bgGlow} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-sm`}>
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm mb-0.5">
                  {feature.label}
                </h3>
                <p className="text-muted-foreground text-sm leading-snug">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={onExplore}
          className="rounded-full px-8 gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          Explorar planos e serviços
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Descubra o plano ideal para o momento da sua jornada
        </p>
      </div>
    </div>
  );
}
