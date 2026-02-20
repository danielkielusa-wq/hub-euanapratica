import { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Target, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIPreview() {
  const [isTransformed, setIsTransformed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasAutoTriggered = useRef(false);

  const originalText =
    'Fui responsável por cuidar dos servidores e migrar o sistema para a nuvem.';
  const transformedText =
    'Spearheaded a cloud migration project for 50+ microservices, reducing operational latency by 35% and saving $120k in annual infrastructure costs.';

  const typeText = useCallback(() => {
    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    const interval = setInterval(() => {
      if (index < transformedText.length) {
        setDisplayedText(transformedText.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  const handleTransform = () => {
    if (isTransformed) {
      setIsTransformed(false);
      setDisplayedText('');
      setIsTyping(false);
    } else {
      setIsTransformed(true);
      typeText();
    }
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (!hasAutoTriggered.current) {
            hasAutoTriggered.current = true;
            setTimeout(() => {
              handleTransform();
            }, 1500);
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const benefits = [
    {
      icon: Zap,
      color: 'text-landing-primary bg-landing-primary-light',
      title: 'Verbos de Poder',
      desc: 'Substituímos termos passivos por verbos de ação que capturam a atenção dos recrutadores.',
    },
    {
      icon: Target,
      color: 'text-amber-600 bg-amber-50',
      title: 'Quantificação de Dados',
      desc: 'Transformamos descrições vagas em conquistas mensuráveis com métricas de impacto.',
    },
    {
      icon: FileCheck,
      color: 'text-emerald-600 bg-emerald-50',
      title: 'ATS Friendly',
      desc: 'Garantimos legibilidade pelos sistemas de rastreamento usados por 98% das Fortune 500.',
    },
  ];

  return (
    <section ref={sectionRef} id="ia" className="bg-white py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div
          className={cn(
            'mb-10 text-center transition-all duration-700 sm:mb-16',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          )}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-landing-primary/20 bg-landing-primary-light px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-landing-primary">
              ResumePass AI
            </span>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-landing-text md:text-4xl lg:text-5xl">
            Não apenas traduzimos.{' '}
            <span className="bg-gradient-to-r from-landing-primary to-landing-primary-dark bg-clip-text text-transparent">
              Maximizamos seu impacto.
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-sm text-landing-text-muted sm:text-base">
            O ResumePass aplica o framework STAR e as melhores práticas de recrutadores
            americanos para transformar suas experiências em conquistas quantificáveis.
          </p>
        </div>

        {/* Interactive Widget */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
          {/* Transformation Card */}
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl bg-landing-navy p-6 transition-all duration-700 sm:p-8',
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            )}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="relative z-10">
              {/* Before */}
              <div
                className={cn(
                  'mb-6 transition-opacity duration-500 sm:mb-8',
                  isTransformed ? 'opacity-40' : 'opacity-100'
                )}
              >
                <div className="mb-2 flex items-center gap-2 sm:mb-3">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-amber-500/80 sm:text-[10px]">
                    Padrão Comum (Brasil)
                  </span>
                </div>
                <p className="text-sm italic leading-relaxed text-white/50 sm:text-base">
                  &ldquo;{originalText}&rdquo;
                </p>
              </div>

              {/* Transform Button */}
              <div className="mb-6 flex justify-center sm:mb-8">
                <button
                  onClick={handleTransform}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110 sm:h-14 sm:w-14',
                    isTransformed && !isTyping
                      ? 'bg-landing-success text-white'
                      : 'bg-landing-primary text-white'
                  )}
                >
                  {isTyping && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-landing-primary/40" />
                  )}
                  <Zap
                    className={cn(
                      'h-5 w-5 transition-transform sm:h-6 sm:w-6',
                      isTransformed ? 'rotate-12' : ''
                    )}
                  />
                </button>
              </div>

              {/* After */}
              <div
                className={cn(
                  'transition-opacity duration-500',
                  isTransformed ? 'opacity-100' : 'opacity-20'
                )}
              >
                <div className="mb-2 flex items-center gap-2 sm:mb-3">
                  <span className="h-2 w-2 rounded-full bg-landing-primary" />
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-landing-primary/80 sm:text-[10px]">
                    ResumePass Output
                  </span>
                </div>
                <div className="min-h-[60px] sm:min-h-[80px]">
                  <p className="text-base font-medium leading-relaxed text-white sm:text-lg">
                    &ldquo;{displayedText}
                    {isTyping && (
                      <span className="animate-blink ml-0.5 inline-block h-5 w-[2px] bg-landing-primary" />
                    )}
                    &rdquo;
                  </p>
                </div>

                {isTransformed && !isTyping && (
                  <div className="mt-3 flex animate-fade-slide-up flex-wrap gap-2 sm:mt-4">
                    <span className="rounded-full bg-landing-primary/20 px-3 py-1 font-mono text-[9px] font-bold tracking-wider text-landing-primary sm:text-[10px]">
                      POWER VERBS
                    </span>
                    <span className="rounded-full bg-landing-success/20 px-3 py-1 font-mono text-[9px] font-bold tracking-wider text-landing-success sm:text-[10px]">
                      METRICS INCLUDED
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="flex flex-col justify-center gap-3 sm:gap-4">
            {benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className={cn(
                  'group rounded-2xl border border-landing-border bg-white p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-landing-text/5 sm:p-6',
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                )}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div
                  className={cn(
                    'mb-2 flex h-9 w-9 items-center justify-center rounded-xl sm:mb-3 sm:h-10 sm:w-10',
                    benefit.color
                  )}
                >
                  <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-landing-text sm:mb-2 sm:text-lg">
                  {benefit.title}
                </h3>
                <p className="text-xs leading-relaxed text-landing-text-muted sm:text-sm">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
