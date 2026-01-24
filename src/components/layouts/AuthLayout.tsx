import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-90" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground mb-4">
              EUA Na Prática
            </h1>
            <p className="text-xl text-primary-foreground/80">
              Sua jornada para trabalhar nos Estados Unidos começa aqui.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold">1</span>
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Mentorias em Grupo</h3>
                <p className="text-primary-foreground/70 text-sm">
                  Aprenda com especialistas e troque experiências com outros profissionais.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold">2</span>
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Imersões Práticas</h3>
                <p className="text-primary-foreground/70 text-sm">
                  Experiências intensivas para acelerar sua preparação.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold">3</span>
              </div>
              <div>
                <h3 className="text-primary-foreground font-semibold mb-1">Suporte Contínuo</h3>
                <p className="text-primary-foreground/70 text-sm">
                  Acompanhamento durante toda sua jornada profissional.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary/30" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/20" />
      </div>
      
      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">EUA Na Prática</h1>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
