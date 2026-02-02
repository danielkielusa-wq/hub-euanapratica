import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Eye, ArrowLeft } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, user, stopImpersonation } = useAuth();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate('/admin/usuarios');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground py-2 px-4 flex items-center justify-center gap-4 shadow-md">
      <Eye className="h-4 w-4" />
      <span className="font-medium">
        Visualizando como: <strong>{user?.full_name}</strong>
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleExit}
        className="bg-background hover:bg-muted border-border"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar ao Admin
      </Button>
    </div>
  );
}
