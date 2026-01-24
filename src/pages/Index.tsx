import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Users, Target, ArrowRight, CheckCircle, Star } from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: GraduationCap,
      title: 'Mentorias em Grupo',
      description: 'Sessões semanais com profissionais que já trabalham nos EUA.',
    },
    {
      icon: Users,
      title: 'Comunidade Ativa',
      description: 'Networking com outros brasileiros buscando oportunidades internacionais.',
    },
    {
      icon: Target,
      title: 'Foco em Resultados',
      description: 'Metodologia prática para preparar seu currículo, LinkedIn e entrevistas.',
    },
  ];

  const benefits = [
    'Aulas gravadas disponíveis 24/7',
    'Feedback personalizado de mentores',
    'Templates prontos de currículo e cover letter',
    'Simulações de entrevistas em inglês',
    'Acesso a vagas exclusivas',
    'Certificado de conclusão',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg">EUA Na Prática</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Mais de 500 alunos já realizaram o sonho americano
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Sua carreira nos{' '}
              <span className="text-primary">Estados Unidos</span>{' '}
              começa aqui
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Mentorias práticas com profissionais que já trilharam o caminho. 
              Aprenda as estratégias que realmente funcionam para conseguir 
              seu visto de trabalho e se destacar no mercado americano.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button size="xl" className="w-full sm:w-auto">
                  Quero começar agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Por que escolher a EUA Na Prática?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Uma metodologia desenvolvida por quem já passou pelo processo e sabe 
              exatamente o que funciona.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Tudo que você precisa para conquistar seu lugar nos EUA
              </h2>
              <p className="text-muted-foreground mb-8">
                Nossa plataforma oferece uma experiência completa de aprendizado, 
                com suporte contínuo e recursos exclusivos.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-center">
                <div className="bg-background/10 backdrop-blur rounded-xl p-6">
                  <p className="text-primary-foreground/80 text-sm mb-2">Próxima turma</p>
                  <p className="text-3xl font-bold text-primary-foreground mb-4">Março 2024</p>
                  <p className="text-primary-foreground/80 mb-6">Vagas limitadas</p>
                  <Link to="/cadastro">
                    <Button size="lg" variant="secondary" className="w-full">
                      Garantir minha vaga
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Pronto para dar o próximo passo?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de brasileiros que já estão transformando suas carreiras 
            com a EUA Na Prática.
          </p>
          <Link to="/cadastro">
            <Button size="xl" variant="secondary">
              Criar minha conta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">EUA Na Prática</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 EUA Na Prática. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
