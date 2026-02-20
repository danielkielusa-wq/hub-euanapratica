import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-white pt-[72px]">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-landing-primary-light/60 via-white to-white" />

      <div className="container relative z-10 mx-auto px-4 pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-32 lg:pt-24">
        <div className="relative">
          {/* Text Content */}
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-landing-primary/20 bg-landing-primary-light px-3 py-1.5 opacity-0 animate-fade-in-up sm:mb-8 sm:px-4 sm:py-2"
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-landing-primary" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-landing-primary sm:text-xs">
                Plataforma 2.0 — IA Disponível
              </span>
            </div>

            {/* Headline */}
            <h1
              className="mb-4 text-4xl font-extrabold leading-[1.08] tracking-tight text-landing-text opacity-0 animate-fade-in-up sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              Construa sua carreira
              <br />
              <span className="bg-gradient-to-r from-landing-primary to-landing-primary-dark bg-clip-text text-transparent">
                nos Estados Unidos.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="mb-8 max-w-xl text-base leading-relaxed text-landing-text-muted opacity-0 animate-fade-in-up sm:mb-10 sm:text-lg"
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              ResumePass, Title Translator, Prime Jobs e Comunidade — tudo
              que você precisa para conquistar as maiores empresas americanas.
            </p>

            {/* CTAs */}
            <div
              className="mb-10 flex flex-col gap-3 opacity-0 animate-fade-in-up sm:mb-12 sm:flex-row sm:gap-4"
              style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
            >
              <Link to="/cadastro">
                <Button
                  size="xl"
                  className="group w-full rounded-full bg-landing-primary px-8 text-white shadow-lg shadow-landing-primary/25 transition-all hover:bg-landing-primary-dark hover:shadow-xl hover:shadow-landing-primary/30 sm:w-auto"
                >
                  Acessar o Hub
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full rounded-full border-landing-border text-landing-text hover:bg-landing-surface sm:w-auto"
                >
                  Ver Mentorias
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div
              className="flex flex-col gap-3 opacity-0 animate-fade-in-up sm:flex-row sm:items-center sm:gap-4"
              style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}
            >
              <div className="flex -space-x-3">
                {[
                  'https://randomuser.me/api/portraits/women/44.jpg',
                  'https://randomuser.me/api/portraits/men/32.jpg',
                  'https://randomuser.me/api/portraits/women/68.jpg',
                  'https://randomuser.me/api/portraits/men/75.jpg',
                  'https://randomuser.me/api/portraits/women/17.jpg',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`User ${i + 1}`}
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm sm:h-10 sm:w-10"
                    style={{ zIndex: 5 - i }}
                  />
                ))}
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-landing-primary font-mono text-[10px] font-bold text-white sm:h-10 sm:w-10 sm:text-xs">
                  +2k
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400 sm:h-4 sm:w-4" />
                  ))}
                </div>
                <span className="text-xs text-landing-text-muted sm:text-sm">
                  Junte-se a milhares de brasileiros
                </span>
              </div>
            </div>
          </div>

          {/* Floating Stat Cards */}
          <div className="mt-10 flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:mt-12 lg:mt-0 lg:absolute lg:right-0 lg:top-0 lg:flex lg:h-full lg:w-[420px] lg:flex-col lg:justify-center lg:gap-4 lg:overflow-visible lg:pb-0 xl:w-[460px]">
            {/* Card 1 — Salary */}
            <div
              className="shrink-0 opacity-0 animate-slide-in-right lg:translate-x-8 xl:translate-x-12"
              style={{ animationDelay: '900ms' }}
            >
              <div className="w-[220px] rounded-2xl border border-landing-border bg-white p-4 shadow-lg shadow-landing-text/5 sm:w-auto sm:p-5 lg:w-auto">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-landing-text-muted sm:text-xs">
                  Salário Médio
                </p>
                <p className="font-mono text-2xl font-bold text-landing-text sm:text-3xl">
                  $110k
                  <span className="text-sm font-normal text-landing-text-muted sm:text-base">/ano</span>
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-landing-success sm:mt-2">
                  <span className="text-[10px] font-medium sm:text-xs">↑ 23% vs Brasil</span>
                </div>
              </div>
            </div>

            {/* Card 2 — Jobs */}
            <div
              className="shrink-0 opacity-0 animate-slide-in-left lg:-translate-x-4 lg:self-end"
              style={{ animationDelay: '1100ms' }}
            >
              <div className="w-[220px] rounded-2xl border border-landing-border bg-white p-4 shadow-lg shadow-landing-text/5 sm:w-auto sm:p-5 lg:w-auto">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-landing-text-muted sm:text-xs">
                  Prime Jobs
                </p>
                <p className="font-mono text-2xl font-bold text-landing-text sm:text-3xl">+452</p>
                <div className="mt-1.5 flex items-center gap-1 sm:mt-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-landing-success" />
                  <span className="text-[10px] font-medium text-landing-text-muted sm:text-xs">
                    Atualizando em tempo real
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3 — Success */}
            <div
              className="shrink-0 opacity-0 animate-slide-in-right lg:translate-x-12 xl:translate-x-16"
              style={{ animationDelay: '1300ms' }}
            >
              <div className="w-[220px] rounded-2xl border border-landing-primary/20 bg-white p-4 shadow-lg shadow-landing-primary/5 sm:w-auto sm:p-5 lg:w-auto">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-landing-text-muted sm:text-xs">
                  Taxa de Sucesso
                </p>
                <p className="font-mono text-2xl font-bold text-landing-primary sm:text-3xl">94%</p>
                <div className="mt-1.5 flex items-center gap-1 sm:mt-2">
                  <span className="text-[10px] font-medium text-landing-text-muted sm:text-xs">
                    dos nossos alunos
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
