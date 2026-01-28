import { useState, useEffect, useCallback } from 'react';
import { Pencil, Zap, ArrowRight, Check, Target, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIPreview() {
  const [isTransformed, setIsTransformed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const originalText = "Fui responsável por cuidar dos servidores e migrar o sistema para a nuvem.";
  const transformedText = "Spearheaded a cloud migration project for 50+ microservices, reducing operational latency by 35% and saving $120k in annual infrastructure costs.";

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
    }, 25);

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
    // Auto-trigger after 3 seconds for demo
    const timer = setTimeout(() => {
      if (!isTransformed) {
        handleTransform();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="bg-background py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Pencil className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">TECNOLOGIA PROPRIETÁRIA</span>
          </div>
          
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Não apenas traduzimos.{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Maximizamos seu impacto.
            </span>
          </h2>
          
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Nosso algoritmo de IA aplica o framework STAR e as melhores práticas de recrutadores americanos 
            para transformar suas experiências em conquistas quantificáveis.
          </p>
        </div>

        {/* Interactive Widget */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Transformation Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-[hsl(222,47%,11%)] p-8">
            {/* Before State */}
            <div className={cn(
              "mb-6 transition-opacity duration-500",
              isTransformed ? "opacity-40" : "opacity-100"
            )}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-amber-500/80">
                  Padrão Comum (Brasil)
                </span>
              </div>
              <p className="italic text-primary-foreground/60">
                "{originalText}"
              </p>
            </div>

            {/* Transform Button */}
            <div className="mb-6 flex justify-center">
              <button
                onClick={handleTransform}
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-110",
                  isTransformed && !isTyping ? "bg-accent" : ""
                )}
              >
                {isTyping && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
                )}
                <Zap className={cn(
                  "h-6 w-6 transition-transform",
                  isTransformed ? "rotate-12" : ""
                )} />
              </button>
            </div>

            {/* After State */}
            <div className={cn(
              "transition-opacity duration-500",
              isTransformed ? "opacity-100" : "opacity-30"
            )}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs font-medium uppercase tracking-wider text-primary/80">
                  Padrão High-Impact (USA AI)
                </span>
              </div>
              <div className="min-h-[80px]">
                <p className="text-lg font-medium text-primary-foreground">
                  "{displayedText}
                  {isTyping && <span className="animate-blink ml-0.5 inline-block h-5 w-0.5 bg-primary" />}"
                </p>
              </div>
              
              {/* Result Badges */}
              {isTransformed && !isTyping && (
                <div className="mt-4 flex flex-wrap gap-2 animate-fade-slide-up">
                  <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                    POWER VERBS
                  </span>
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                    METRICS INCLUDED
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Benefits List */}
          <div className="flex flex-col justify-center space-y-6">
            <div className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Verbos de Poder</h3>
              <p className="text-sm text-muted-foreground">
                Substituímos termos passivos por verbos de ação agressivos que capturam a atenção 
                dos recrutadores americanos: "Led", "Spearheaded", "Orchestrated".
              </p>
            </div>

            <div className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
                <Target className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Quantificação de Dados</h3>
              <p className="text-sm text-muted-foreground">
                Tudo nos EUA é sobre números. Transformamos descrições vagas em conquistas 
                mensuráveis com percentuais, valores monetários e métricas de impacto.
              </p>
            </div>

            <div className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <FileCheck className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">ATS Friendly</h3>
              <p className="text-sm text-muted-foreground">
                Garantimos que seu documento seja legível pelos sistemas de rastreamento (ATS) 
                usados por 98% das empresas Fortune 500.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
