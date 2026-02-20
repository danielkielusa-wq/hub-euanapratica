import { useRef, useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

const testimonials = [
  {
    name: 'Mariana Silva',
    role: 'Software Engineer',
    company: 'Google',
    photo: 'https://randomuser.me/api/portraits/women/65.jpg',
    quote:
      'O ResumePass transformou meu currículo brasileiro em algo que os recrutadores americanos realmente entendiam. Em 3 meses, recebi a oferta da Google.',
    highlight: '3 meses até a oferta',
  },
  {
    name: 'Rafael Oliveira',
    role: 'Product Manager',
    company: 'Amazon',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote:
      'A Comunidade foi o diferencial. Nos Hot Seats aprendi como negociar salário nos EUA — consegui $40k a mais do que minha proposta inicial.',
    highlight: '+$40k em negociação',
  },
  {
    name: 'Camila Santos',
    role: 'Data Analyst',
    company: 'Meta',
    photo: 'https://randomuser.me/api/portraits/women/33.jpg',
    quote:
      'O Title Translator me mostrou que meu cargo de "Analista de Dados Pleno" equivalia a "Senior Data Analyst" no mercado americano. Isso mudou toda minha estratégia.',
    highlight: 'Reposicionamento de carreira',
  },
];

export function Testimonials() {
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
    <section ref={sectionRef} className="bg-landing-surface py-20 lg:py-28">
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
              Histórias Reais
            </span>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-landing-text md:text-4xl lg:text-5xl">
            Quem já chegou lá.
          </h2>

          <p className="mx-auto max-w-2xl text-sm text-landing-text-muted sm:text-base">
            Profissionais brasileiros que usaram a plataforma para conquistar posições
            nas maiores empresas americanas.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className={cn(
                'group relative rounded-2xl border border-landing-border bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-landing-text/5 sm:p-8',
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              )}
              style={{ transitionDelay: `${200 + i * 150}ms` }}
            >
              {/* Quote icon */}
              <Quote className="mb-4 h-6 w-6 text-landing-primary/20 sm:h-8 sm:w-8" />

              {/* Quote text */}
              <p className="mb-6 text-sm leading-relaxed text-landing-text/80 sm:text-base">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Highlight badge */}
              <div className="mb-6 inline-flex rounded-full bg-landing-primary-light px-3 py-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-landing-primary sm:text-xs">
                  {t.highlight}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-landing-border pt-5">
                <img
                  src={t.photo}
                  alt={t.name}
                  className="h-11 w-11 rounded-full object-cover shadow-sm sm:h-12 sm:w-12"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-landing-text">{t.name}</p>
                  <p className="truncate text-xs text-landing-text-muted">
                    {t.role} · <span className="font-semibold text-landing-text/70">{t.company}</span>
                  </p>
                </div>
                <div className="flex shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
