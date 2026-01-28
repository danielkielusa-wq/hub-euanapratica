import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useServiceAccess } from '@/hooks/useServiceAccess';
import { useToast } from '@/hooks/use-toast';

interface ServiceGuardProps {
  serviceRoute: string;
  children: React.ReactNode;
}

export function ServiceGuard({ serviceRoute, children }: ServiceGuardProps) {
  const { hasAccess, isLoading } = useServiceAccess(serviceRoute);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      toast({
        title: 'Serviço não contratado',
        description: 'Adquira este serviço no Hub para acessar.',
        variant: 'destructive',
      });
      navigate('/dashboard/hub');
    }
  }, [hasAccess, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
