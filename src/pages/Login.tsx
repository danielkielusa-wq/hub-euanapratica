import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RoleType = 'student' | 'mentor' | 'admin';

const ROLE_CONFIG = {
  student: {
    label: 'Aluno',
    icon: GraduationCap,
    email: 'aluno@teste.com',
    password: 'teste123',
  },
  mentor: {
    label: 'Mentor',
    icon: Building2,
    email: 'mentor@teste.com',
    password: 'teste123',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    email: 'admin@teste.com',
    password: 'teste123',
  },
};

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<RoleType>('student');
  const [email, setEmail] = useState(ROLE_CONFIG.student.email);
  const [password, setPassword] = useState(ROLE_CONFIG.student.password);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { toast } = useToast();

  // Auto-fill credentials when role changes
  useEffect(() => {
    const config = ROLE_CONFIG[selectedRole];
    setEmail(config.email);
    setPassword(config.password);
  }, [selectedRole]);

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

  return (
    <AuthLayout 
      title="Escolha seu perfil" 
      subtitle="Selecione como deseja acessar a plataforma"
    >
      {/* Profile Selector */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.keys(ROLE_CONFIG) as RoleType[]).map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          const isSelected = selectedRole === role;
          
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                  isSelected ? "bg-indigo-100" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6",
                    isSelected ? "text-indigo-600" : "text-gray-500"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-indigo-600" : "text-gray-700"
                )}
              >
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-xs text-gray-400 uppercase tracking-wider">
            Login de {ROLE_CONFIG[selectedRole].label}
          </span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              placeholder={ROLE_CONFIG[selectedRole].email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <Link 
              to="/esqueci-senha" 
              className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Esqueceu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-6 text-center text-sm text-gray-500">
        Não tem uma conta?{' '}
        <Link to="/cadastro" className="text-indigo-600 font-medium hover:underline">
          Cadastre-se grátis
        </Link>
      </p>
    </AuthLayout>
  );
}
