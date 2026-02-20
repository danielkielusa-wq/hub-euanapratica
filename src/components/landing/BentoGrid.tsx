import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileCheck, Briefcase, Users, Languages, BookOpen, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function BentoGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="servicos" className="bg-landing-surface py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div
          className={cn(
            "mb-10 flex flex-col items-start justify-between gap-4 transition-all duration-700 sm:mb-12 md:flex-row md:items-end",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div>
            <h2 className="mb-3 text-3xl font-bold text-landing-text md:text-4xl lg:text-5xl">
              Um ecossistema completo
              <br />
              <span className="text-landing-primary">para sua jornada americana</span>
            </h2>
            <p className="max-w-xl text-sm text-landing-text-muted sm:text-base">
              Não é apenas um curso. É uma plataforma integrada com IA, mentoria e networking
              para acelerar sua carreira nos EUA.
            </p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Card — ResumePass */}
          <div
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-landing-primary to-landing-primary-dark p-6 text-white transition-all duration-700 sm:p-8 md:col-span-2 md:row-span-2",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: '100ms' }}
          >
            <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm sm:text-xs">
                Recomendado
              </span>
            </div>

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 sm:mb-6 sm:h-14 sm:w-14">
                  <FileCheck className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                </div>

                <h3 className="mb-2 text-2xl font-bold sm:mb-3 sm:text-3xl">
                  ResumePass{' '}
                  <span className="text-white/80">AI</span>
                </h3>

                <p className="mb-6 max-w-md text-sm text-white/70 sm:mb-8 sm:text-base">
                  Nossa IA analisa seu currículo brasileiro e o transforma no padrão americano
                  com verbos de impacto, métricas quantificadas e otimização para sistemas ATS.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link to="/login">
                  <Button
                    size="lg"
                    className="w-full rounded-full bg-white font-semibold text-landing-primary transition-all hover:bg-white/90 sm:w-auto"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Testar Agora Grátis
                  </Button>
                </Link>
                <span className="text-xs text-white/50 sm:text-sm">
                  1 análise gratuita por mês
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* Title Translator */}
          <div
            className={cn(
              "group rounded-2xl border border-landing-border bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-landing-text/5 sm:p-6",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-landing-primary-light sm:mb-4 sm:h-12 sm:w-12">
              <Languages className="h-5 w-5 text-landing-primary sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-landing-text sm:mb-2 sm:text-xl">Title Translator</h3>
            <p className="mb-3 text-xs text-landing-text-muted sm:mb-4 sm:text-sm">
              Descubra como seu cargo brasileiro se traduz para o mercado americano e reposicione sua carreira.
            </p>
            <Link
              to="/login"
              className="group/link inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-landing-primary sm:text-sm"
            >
              EXPLORAR
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {/* Prime Jobs */}
          <div
            className={cn(
              "group rounded-2xl border border-landing-border bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-landing-text/5 sm:p-6",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 sm:mb-4 sm:h-12 sm:w-12">
              <Briefcase className="h-5 w-5 text-amber-600 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-landing-text sm:mb-2 sm:text-xl">Prime Jobs</h3>
            <p className="mb-3 text-xs text-landing-text-muted sm:mb-4 sm:text-sm">
              Vagas curadas nas maiores empresas americanas, com match inteligente para seu perfil e experiência.
            </p>
            <Link
              to="/login"
              className="group/link inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-amber-600 sm:text-sm"
            >
              EXPLORAR
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {/* Comunidade */}
          <div
            className={cn(
              "group rounded-2xl border border-landing-border bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-landing-text/5 sm:p-6",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: '400ms' }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 sm:mb-4 sm:h-12 sm:w-12">
              <Users className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-landing-text sm:mb-2 sm:text-xl">Comunidade</h3>
            <p className="mb-3 text-xs text-landing-text-muted sm:mb-4 sm:text-sm">
              Hot Seats, mastermind e networking de elite com Daniel Kiel e profissionais nos EUA.
            </p>
            <Link
              to="/login"
              className="group/link inline-flex items-center gap-1 text-xs font-semibold tracking-wide text-emerald-600 sm:text-sm"
            >
              EXPLORAR
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1 sm:h-4 sm:w-4" />
            </Link>
          </div>

          {/* Cursos — Coming Soon */}
          <div
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-landing-border bg-landing-surface p-5 transition-all duration-500 sm:p-6",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: '500ms' }}
          >
            <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
              <span className="flex items-center gap-1 rounded-full bg-landing-surface-dark px-2 py-1 text-[10px] text-landing-text-muted sm:text-xs">
                <Lock className="h-3 w-3" />
                Em breve
              </span>
            </div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-landing-surface-dark sm:mb-4 sm:h-12 sm:w-12">
              <BookOpen className="h-5 w-5 text-landing-text-muted sm:h-6 sm:w-6" />
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-landing-text/60 sm:mb-2 sm:text-xl">Cursos EUA Na Prática</h3>
            <p className="text-xs text-landing-text-muted/80 sm:text-sm">
              Cursos completos sobre visto, entrevistas, negociação salarial e cultura corporativa.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
