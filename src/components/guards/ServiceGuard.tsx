import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useServiceAccess } from '@/hooks/useServiceAccess';
import { Button } from '@/components/ui/button';

interface ServiceGuardProps {
  serviceRoute: string;
  children: React.ReactNode;
}

export function ServiceGuard({ serviceRoute, children }: ServiceGuardProps) {
  const { hasAccess, isLoading } = useServiceAccess(serviceRoute);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-lg w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Recurso indisponível no seu plano
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Para acessar este recurso, faça upgrade para um plano Pro ou VIP.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/pricing')}>
              Ver planos
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/hub')}>
              Voltar ao Hub
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
