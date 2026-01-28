import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileCheck, GraduationCap, Link2, BookOpen, Users, Lock, ArrowRight, Sparkles } from 'lucide-react';

export function BentoGrid() {
  return (
    <section id="servicos" className="bg-[hsl(240,5%,96%)] py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
              Um ecossistema completo
              <br />
              para sua jornada americana
            </h2>
            <p className="max-w-xl text-muted-foreground">
              Não é apenas um curso. É uma plataforma integrada com IA, mentoria e networking para acelerar sua carreira nos EUA.
            </p>
          </div>
          <Link to="#" className="group flex items-center gap-2 text-sm font-medium text-primary">
            Ver todos os serviços
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Card - Currículo AI */}
          <div className="group relative overflow-hidden rounded-[32px] bg-[hsl(222,47%,11%)] p-8 text-primary-foreground md:col-span-2 md:row-span-2">
            {/* Recommended Badge */}
            <div className="absolute right-6 top-6">
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase text-accent-foreground">
                Recomendado
              </span>
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                  <FileCheck className="h-7 w-7 text-primary" />
                </div>
                
                <h3 className="mb-3 text-2xl font-bold md:text-3xl">
                  Currículo USA{' '}
                  <span className="text-primary">AI</span>
                </h3>
                
                <p className="mb-8 max-w-md text-primary-foreground/70">
                  Nossa inteligência artificial analisa seu CV brasileiro e o transforma no padrão americano 
                  com verbos de impacto, métricas quantificadas e otimização para sistemas ATS.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link to="/curriculo-usa">
                  <Button size="lg" className="rounded-xl bg-background text-foreground hover:bg-background/90">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Testar Agora Grátis
                  </Button>
                </Link>
                <span className="text-sm text-primary-foreground/50">
                  1 análise gratuita por mês
                </span>
              </div>
            </div>

            {/* Decorative Gradient */}
            <div className="absolute bottom-0 right-0 h-64 w-64 bg-gradient-to-tl from-primary/30 to-transparent blur-2xl" />
          </div>

          {/* Portal do Aluno */}
          <div className="group rounded-[32px] border border-border/50 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Portal do Aluno</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Acesse sua trilha de aprendizado, acompanhe seu progresso e participe da comunidade.
            </p>
            <Link to="/login" className="group/link inline-flex items-center gap-1 text-sm font-medium text-primary">
              EXPLORAR
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>

          {/* Hot Seats */}
          <div className="group rounded-[32px] border border-border/50 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
              <Link2 className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Hot Seats & Mastermind</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Encontros mensais exclusivos com Daniel Kiel e convidados especiais. Networking de elite.
            </p>
            <Link to="/login" className="group/link inline-flex items-center gap-1 text-sm font-medium text-primary">
              EXPLORAR
              <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>

          {/* Cursos - Coming Soon */}
          <div className="group relative overflow-hidden rounded-[32px] border border-border/50 bg-background p-6 opacity-60">
            <div className="absolute right-4 top-4">
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Em Desenvolvimento
              </span>
            </div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Cursos EUA Na Prática</h3>
            <p className="text-sm text-muted-foreground">
              Cursos completos sobre visto, entrevistas, negociação salarial e cultura corporativa americana.
            </p>
          </div>

          {/* Expert Marketplace - Coming Soon */}
          <div className="group relative overflow-hidden rounded-[32px] border border-border/50 bg-background p-6 opacity-60">
            <div className="absolute right-4 top-4">
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Em Desenvolvimento
              </span>
            </div>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <Users className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-foreground">Expert Marketplace</h3>
            <p className="text-sm text-muted-foreground">
              Conecte-se com mentores especializados em diferentes áreas e indústrias do mercado americano.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
