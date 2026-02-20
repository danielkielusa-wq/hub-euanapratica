import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Grid3X3, BookOpen, FileCheck, Link2, Send, Plane, ArrowRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const steps = [
  {
    number: '01',
    icon: Grid3X3,
    title: 'Acesso ao Hub',
    description: 'Crie sua conta gratuita e acesse o HUB com recursos para iniciar sua jornada.',
    isFinal: false,
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Aprenda as Bases',
    description: 'Domine os fundamentos do mercado de trabalho americano sem pagar nada.',
    isFinal: false,
  },
  {
    number: '03',
    icon: FileCheck,
    title: 'ResumePass + Title Translator',
    description: 'Adapte seu currículo e cargo para os padrões americanos com nossas ferramentas de IA.',
    isFinal: false,
  },
  {
    number: '04',
    icon: Link2,
    title: 'Comunidade & Network',
    description: 'Hot Seats, mastermind e networking com profissionais que já estão nos EUA.',
    isFinal: false,
  },
  {
    number: '05',
    icon: Send,
    title: 'Prime Jobs & Mentoria',
    description: 'Acesse vagas curadas e mentoria personalizada para acelerar suas entrevistas.',
    isFinal: false,
  },
  {
    number: '06',
    icon: Plane,
    title: 'Sua Carreira USA',
    description: 'Visto aprovado, contrato assinado. Sua nova vida nos Estados Unidos começa aqui.',
    isFinal: true,
  },
];

export function SuccessPath() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="metodologia" className="bg-white py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div
          className={cn(
            'mb-12 text-center transition-all duration-700 sm:mb-16',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-landing-primary/20 bg-landing-primary-light px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-landing-primary">
              Jornada Completa
            </span>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-landing-text md:text-4xl lg:text-5xl">
            Sua trilha para o sucesso.
          </h2>

          <p className="mx-auto max-w-2xl text-sm text-landing-text-muted sm:text-base">
            Um plano executável de 6 etapas que já levou centenas de brasileiros a conquistarem
            posições nas maiores empresas americanas.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mb-12 grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => {
            if (step.isFinal) {
              return (
                <div
                  key={step.number}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl bg-gradient-to-br from-landing-primary to-landing-primary-dark p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-landing-primary/15 sm:p-8',
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  )}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                  <div className="relative z-10">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 sm:h-14 sm:w-14">
                        <step.icon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                      </div>
                      <span className="font-mono text-2xl font-bold text-white/30 sm:text-3xl">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-white sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/70 sm:text-base">
                      {step.description}
                    </p>

                    <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white sm:mt-6">
                      <span>COMEÇAR AGORA</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            }

            const progressOpacity = 0.4 + i * 0.12;
            return (
              <div
                key={step.number}
                className={cn(
                  'group rounded-2xl border border-landing-border bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-landing-text/5 sm:p-6',
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <div className="mb-3 flex items-start justify-between sm:mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-landing-primary-light sm:h-12 sm:w-12"
                    style={{ opacity: progressOpacity }}
                  >
                    <step.icon className="h-5 w-5 text-landing-primary sm:h-6 sm:w-6" />
                  </div>
                  <span
                    className="font-mono text-lg font-bold text-landing-primary/20 sm:text-xl"
                    style={{ opacity: progressOpacity }}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="mb-1.5 text-base font-semibold text-landing-text sm:mb-2 sm:text-lg">
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed text-landing-text-muted sm:text-sm">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          className={cn(
            'text-center transition-all duration-700',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
          style={{ transitionDelay: '800ms' }}
        >
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-landing-border font-medium text-landing-text hover:bg-landing-surface"
            >
              Conheça nossa metodologia completa
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
