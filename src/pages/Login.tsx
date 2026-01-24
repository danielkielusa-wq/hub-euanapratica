import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Users, Shield, Loader2 } from 'lucide-react';
import { UserRole } from '@/types/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, loginAsRole } = useAuth();
  const navigate = useNavigate();
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
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickLogin = (role: UserRole) => {
    loginAsRole(role);
    
    const routes = {
      student: '/dashboard',
      mentor: '/mentor/dashboard',
      admin: '/admin/dashboard',
    };
    
    toast({
      title: "Bem-vindo!",
      description: `Logado como ${role === 'student' ? 'Aluno' : role === 'mentor' ? 'Mentor' : 'Administrador'}.`,
    });
    
    navigate(routes[role]);
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
            disabled={isLoading}
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
            disabled={isLoading}
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
        
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
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
      
      <div className="mt-6">
        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
            ou acesse como
          </span>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Button
            type="button"
            variant="student"
            size="lg"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={() => handleQuickLogin('student')}
          >
            <GraduationCap className="h-6 w-6" />
            <span className="text-xs font-medium">Aluno</span>
          </Button>
          
          <Button
            type="button"
            variant="mentor"
            size="lg"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={() => handleQuickLogin('mentor')}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs font-medium">Mentor</span>
          </Button>
          
          <Button
            type="button"
            variant="admin"
            size="lg"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={() => handleQuickLogin('admin')}
          >
            <Shield className="h-6 w-6" />
            <span className="text-xs font-medium">Admin</span>
          </Button>
        </div>
      </div>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link to="/cadastro" className="text-primary font-medium hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  );
}
