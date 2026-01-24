import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, GraduationCap, User } from 'lucide-react';

const DEV_USERS = [
  { email: 'admin@teste.com', password: 'teste123', label: 'Entrar como Admin', variant: 'admin' as const, icon: Shield },
  { email: 'mentor@teste.com', password: 'teste123', label: 'Entrar como Mentor', variant: 'mentor' as const, icon: GraduationCap },
  { email: 'aluno@teste.com', password: 'teste123', label: 'Entrar como Aluno', variant: 'student' as const, icon: User },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Email ou senha incorretos.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email: string, password: string) => {
    setLoadingUser(email);
    try {
      await login(email, password);
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer login. Verifique se os usuários de teste foram criados.";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingUser(null);
    }
  };
  
  return (
    <AuthLayout 
      title="Bem-vindo de volta" 
      subtitle="Faça login para acessar sua conta"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || !!loadingUser}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link 
              to="/esqueci-senha" 
              className="text-sm text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || !!loadingUser}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Lembrar de mim
          </Label>
        </div>
        
        <Button type="submit" className="w-full" size="lg" disabled={isLoading || !!loadingUser}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link to="/cadastro" className="text-primary font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>

      {/* Acesso Rápido - Desenvolvimento */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground mb-4">
          Acesso Rápido (Desenvolvimento)
        </p>
        <div className="flex flex-col gap-2">
          {DEV_USERS.map((user) => {
            const Icon = user.icon;
            const isLoadingThis = loadingUser === user.email;
            return (
              <Button
                key={user.email}
                type="button"
                variant={user.variant}
                className="w-full"
                onClick={() => handleQuickLogin(user.email, user.password)}
                disabled={isLoading || !!loadingUser}
              >
                {isLoadingThis ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="mr-2 h-4 w-4" />
                )}
                {isLoadingThis ? 'Entrando...' : user.label}
              </Button>
            );
          })}
        </div>
      </div>
    </AuthLayout>
  );
}
