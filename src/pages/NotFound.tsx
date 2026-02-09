import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [countdown, setCountdown] = useState(10);

  // Determinar para onde redirecionar baseado no role
  const getRedirectPath = () => {
    if (!isAuthenticated || !user) return '/';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'mentor':
        return '/mentor/dashboard';
      case 'student':
      default:
        return '/dashboard';
    }
  };

  const redirectPath = getRedirectPath();

  // Countdown e redirect automático
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, redirectPath]);

  // Log de erro para debugging (opcional: enviar para backend)
  useEffect(() => {
      "404 Error: User tried to access non-existent route:",
      location.pathname,
      "User:", user?.email || 'anonymous'
    );
  }, [location.pathname, user]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Página não encontrada</CardTitle>
          <CardDescription className="text-base">
            Ops! A página que você procura não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Rota acessada: <code className="bg-background px-2 py-1 rounded">{location.pathname}</code>
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Você será redirecionado automaticamente em{" "}
            <span className="font-bold text-primary">{countdown}</span> segundos...
          </p>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate(redirectPath)}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              {isAuthenticated ? 'Ir para Dashboard' : 'Ir para Início'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à página anterior
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
