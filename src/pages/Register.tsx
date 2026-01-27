import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInvitationByToken } from '@/hooks/useEspacoInvitations';
import { supabase } from '@/integrations/supabase/client';

export default function Register() {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const espacoIdParam = searchParams.get('espaco_id');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Fetch invitation data if token is present
  const { data: invitation, isLoading: invitationLoading } = useInvitationByToken(invitationToken);

  // Pre-fill name from invitation (email is intentionally not exposed for security)
  useEffect(() => {
    if (invitation) {
      setFormData(prev => ({
        ...prev,
        full_name: invitation.invited_name || prev.full_name,
      }));
    }
  }, [invitation]);

  // Store invitation token in localStorage for processing after registration
  useEffect(() => {
    if (invitationToken) {
      localStorage.setItem('invitation_token', invitationToken);
    }
  }, [invitationToken]);
  
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;':",.<>\/?]/.test(formData.password),
  };
  
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = formData.password === formData.confirmPassword;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isPasswordValid) {
      toast({
        title: "Erro",
        description: "A senha não atende aos requisitos de segurança.",
        variant: "destructive",
      });
      return;
    }
    
    if (!passwordsMatch) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
      });
      
      // Process invitation if token exists
      const storedToken = localStorage.getItem('invitation_token');
      if (storedToken) {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.access_token) {
            await supabase.functions.invoke('process-invitation', {
              body: { token: storedToken },
            });
            localStorage.removeItem('invitation_token');
            toast({
              title: "Conta criada!",
              description: "Você foi matriculado no espaço automaticamente.",
            });
          }
        } catch (inviteError) {
          console.error('Error processing invitation:', inviteError);
        }
      } else {
        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar sua conta.",
        });
      }
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="h-4 w-4 text-accent" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={cn(passed ? 'text-accent' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
  
  const espacoName = invitation?.espacos?.name;

  return (
    <AuthLayout 
      title={espacoName ? "Você foi convidado!" : "Crie sua conta"}
      subtitle={espacoName ? `Crie sua conta para acessar: ${espacoName}` : "Comece sua jornada para trabalhar nos EUA"}
    >
      {espacoName && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Convite para</p>
              <p className="text-lg font-semibold text-primary">{espacoName}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo</Label>
          <Input
            id="full_name"
            name="full_name"
            type="text"
            placeholder="João Silva"
            value={formData.full_name}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
          />
          
          {formData.password && (
            <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground mb-2">Requisitos da senha:</p>
              <PasswordCheck passed={passwordChecks.length} label="Mínimo 8 caracteres" />
              <PasswordCheck passed={passwordChecks.uppercase} label="Uma letra maiúscula" />
              <PasswordCheck passed={passwordChecks.number} label="Um número" />
              <PasswordCheck passed={passwordChecks.special} label="Um caractere especial" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-sm text-destructive">As senhas não coincidem</p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          size="lg" 
          disabled={isLoading || !isPasswordValid || !passwordsMatch}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Faça login
        </Link>
      </p>
    </AuthLayout>
  );
}
