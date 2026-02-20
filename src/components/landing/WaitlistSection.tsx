import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Mail, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';

export function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success('Você está na lista!', {
      description: 'Em breve você receberá novidades exclusivas.',
    });

    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-landing-primary via-landing-primary-dark to-[#312E81] py-24 lg:py-36">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm sm:mb-8">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/90 sm:text-xs">
              Vagas Limitadas
            </span>
          </div>

          {/* Title */}
          <h2 className="mb-4 text-3xl font-bold text-white sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Seja o primeiro a{' '}
            <span className="text-white/80">
              dominar o mercado.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="mb-8 text-sm leading-relaxed text-white/60 sm:mb-10 sm:text-lg">
            ResumePass, Title Translator e Prime Jobs estão em fase final. Entre na lista e seja
            notificado em primeira mão.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-8 sm:mb-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-full border-white/20 bg-white/10 pl-12 text-white placeholder:text-white/40 backdrop-blur-sm focus-visible:border-white/40 focus-visible:ring-white/20 sm:h-14"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-full bg-white px-6 font-semibold text-landing-primary shadow-lg shadow-black/10 transition-all hover:bg-white/90 sm:h-14 sm:px-8"
              >
                <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {isSubmitting ? 'Enviando...' : 'Garantir Acesso'}
              </Button>
            </div>
          </form>

          {/* Trust */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/50 sm:gap-6 sm:text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Privacidade Garantida</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Acesso Imediato ao Hub Free</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
