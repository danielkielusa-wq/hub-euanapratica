import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { Loader2, Eye, EyeOff, Check, X, Sparkles } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logoHorizontal } = usePlatformLogo();

  // Fetch invitation data if token is present
  const { data: invitation } = useInvitationByToken(invitationToken);

  // Pre-fill name from invitation
  useEffect(() => {
    if (invitation) {
      setFormData(prev => ({
        ...prev,
        full_name: invitation.invited_name || prev.full_name,
      }));
    }
  }, [invitation]);

  // Store invitation token and espaco_id in localStorage for processing after registration
  useEffect(() => {
    if (invitationToken) {
      localStorage.setItem('invitation_token', invitationToken);
    }
    if (espacoIdParam) {
      localStorage.setItem('pending_espaco_id', espacoIdParam);
    }
  }, [invitationToken, espacoIdParam]);

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
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: 'Erro',
        description: 'A senha não atende aos requisitos de segurança.',
        variant: 'destructive',
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
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
              title: 'Conta criada!',
              description: 'Você foi matriculado no espaço automaticamente.',
            });
          }
        } catch {
          // Invitation processing failed silently
        }
      } else {
        toast({
          title: 'Conta criada!',
          description: 'Verifique seu email para confirmar sua conta.',
        });
      }

      navigate('/dashboard');
    } catch (error) {
      const err = error as { message?: string; status?: number; code?: string };

      const isRateLimit = err?.status === 429 || (err?.message || '').toLowerCase().includes('rate limit');
      const isDuplicateEmail = err?.status === 409 || err?.code === 'email_already_exists';

      let errorMessage = 'Não foi possível criar sua conta. Tente novamente.';

      if (isRateLimit) {
        errorMessage = 'Limite de emails atingido. Aguarde alguns minutos e tente novamente.';
      } else if (isDuplicateEmail) {
        errorMessage = err?.message || 'Este endereço de email já está cadastrado. Por favor, faça login ou use outro email.';
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <X className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
      )}
      <span className={cn(
        passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
      )}>
        {label}
      </span>
    </div>
  );

  const espacoName = invitation?.espacos?.name;

  const inputClass = "w-full px-4 py-3 bg-transparent rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7367F0] focus:ring-1 focus:ring-[#7367F0] transition-colors disabled:opacity-50";
  const inputWithToggleClass = "w-full px-4 py-3 pr-12 bg-transparent rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7367F0] focus:ring-1 focus:ring-[#7367F0] transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7FA] dark:bg-background p-4">
      <div className="w-full max-w-[460px]">
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-8 md:p-10">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={logoHorizontal}
              alt="Logo"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Invitation Banner */}
          {espacoName && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#7367F0]/10 to-purple-500/10 border border-[#7367F0]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#7367F0]/20">
                  <Sparkles className="h-5 w-5 text-[#7367F0]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Convite para</p>
                  <p className="text-lg font-semibold text-[#7367F0]">{espacoName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Text */}
          <h4 className="text-xl font-semibold text-gray-800 dark:text-foreground mb-1">
            {espacoName ? 'Você foi convidado!' : 'A aventura começa aqui! 🚀'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-8">
            {espacoName
              ? `Crie sua conta para acessar: ${espacoName}`
              : 'Crie sua conta e comece sua jornada na plataforma.'}
          </p>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="register-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome completo
              </label>
              <input
                id="register-name"
                name="full_name"
                type="text"
                placeholder="João Silva"
                value={formData.full_name}
                onChange={handleChange}
                disabled={isLoading}
                autoFocus
                className={inputClass}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="············"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={inputWithToggleClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2.5 p-3 bg-gray-50 dark:bg-white/5 rounded-lg space-y-1.5">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Requisitos da senha:</p>
                  <PasswordCheck passed={passwordChecks.length} label="Mínimo 8 caracteres" />
                  <PasswordCheck passed={passwordChecks.uppercase} label="Uma letra maiúscula" />
                  <PasswordCheck passed={passwordChecks.number} label="Um número" />
                  <PasswordCheck passed={passwordChecks.special} label="Um caractere especial" />
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="············"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={inputWithToggleClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-sm text-red-500 mt-1">As senhas não coincidem</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#7367F0] focus:ring-[#7367F0]"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                Eu concordo com a{' '}
                <Link to="/privacidade" target="_blank" className="text-[#7367F0] hover:underline">
                  política de privacidade
                </Link>{' '}
                e os{' '}
                <Link to="/termos-de-uso" target="_blank" className="text-[#7367F0] hover:underline">
                  termos de uso
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch || !agreedTerms}
              className="w-full py-3 bg-[#7367F0] hover:bg-[#685DD8] disabled:bg-[#7367F0]/60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#7367F0]/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-muted-foreground">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[#7367F0] font-medium hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
