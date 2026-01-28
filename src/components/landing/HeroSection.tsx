import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, DollarSign, TrendingUp, Star } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[hsl(240,5%,96%)] py-20 lg:py-32">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Floating Widget Left */}
        <div className="absolute left-4 top-32 hidden animate-float lg:block xl:left-16">
          <div className="rounded-2xl border border-border/50 bg-background/90 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Salário Médio</p>
                <p className="text-xl font-bold text-foreground">$110k/ano</p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Widget Right */}
        <div className="absolute right-4 top-48 hidden animate-float lg:block xl:right-16" style={{ animationDelay: '1s' }}>
          <div className="rounded-2xl border border-border/50 bg-background/90 p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Jobs Abertos</p>
                <p className="text-xl font-bold text-foreground">+452 Novas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
            <Zap className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">
              PLATAFORMA 2.0: NOVAS FERRAMENTAS DE IA DISPONÍVEIS
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Construa sua carreira{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              nos Estados Unidos.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A plataforma definitiva para profissionais brasileiros que desejam conquistar 
            oportunidades nas maiores empresas americanas. Currículo, mentoria e networking em um só lugar.
          </p>

          {/* CTAs */}
          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/cadastro">
              <Button size="xl" className="rounded-xl bg-foreground text-background hover:bg-foreground/90">
                Acessar o Hub
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="xl" variant="outline" className="rounded-xl border-foreground/20">
                Ver Mentorias
              </Button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {/* Stacked Avatars */}
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary to-secondary"
                  style={{ zIndex: 5 - i }}
                />
              ))}
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground">
                +2k
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Junte-se a milhares de brasileiros de sucesso
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
