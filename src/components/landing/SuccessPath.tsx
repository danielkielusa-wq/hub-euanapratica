import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Grid3X3, BookOpen, FileCheck, Link2, Send, Plane, Zap } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Grid3X3,
    color: 'bg-primary/10 text-primary',
    title: 'Acesso ao Hub',
    description: 'Ganhe acesso ao HUB EUA Na Prática com recursos gratuitos e premium para sua jornada.',
  },
  {
    number: '02',
    icon: BookOpen,
    color: 'bg-primary/10 text-primary',
    title: 'Recursos Gratuitos',
    description: 'Comece sua jornada aprendendo as bases do mercado de trabalho americano sem pagar nada.',
  },
  {
    number: '03',
    icon: FileCheck,
    color: 'bg-accent/10 text-accent',
    title: 'Validação IA',
    description: 'Ajuste seu currículo para os padrões americanos com nossa ferramenta de análise com IA.',
  },
  {
    number: '04',
    icon: Link2,
    color: 'bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]',
    title: 'Hot Seats & Network',
    description: 'Networking de elite e sessões ao vivo com profissionais que já estão nos EUA.',
  },
  {
    number: '05',
    icon: Send,
    color: 'bg-[hsl(330,81%,60%)]/10 text-[hsl(330,81%,60%)]',
    title: 'Mentoria e Educação',
    description: 'Aprofunde seus conhecimentos com cursos completos e mentoria personalizada.',
  },
  {
    number: '06',
    icon: Plane,
    color: 'bg-secondary/10 text-secondary',
    title: 'Sua Carreira USA',
    description: 'Visto aprovado, contrato assinado. Sua nova vida nos Estados Unidos começa aqui.',
  },
];

export function SuccessPath() {
  return (
    <section id="metodologia" className="bg-[hsl(240,5%,96%)] py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">JORNADA COMPLETA</span>
          </div>
          
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Sua trilha para o sucesso.
          </h2>
          
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Um plano executável de 6 etapas que já levou centenas de brasileiros 
            a conquistarem posições nas maiores empresas americanas.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mb-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group rounded-[24px] border border-border/50 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-primary">PASSO {step.number}</span>
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/cadastro">
            <Button variant="outline" size="lg" className="rounded-xl">
              Conheça nossa metodologia completa
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
