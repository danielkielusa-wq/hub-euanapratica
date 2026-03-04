import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { toast } = useToast();
  const { logoHorizontal } = usePlatformLogo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Email ou senha incorretos.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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

          {/* Welcome Text */}
          <h4 className="text-xl font-semibold text-gray-800 dark:text-foreground mb-1">
            Bem-vindo de volta!
          </h4>
          <p className="text-sm text-gray-500 dark:text-muted-foreground mb-8">
            Entre com suas credenciais para acessar a plataforma.
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoFocus
                className="w-full px-4 py-3 bg-transparent rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7367F0] focus:ring-1 focus:ring-[#7367F0] transition-colors disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="············"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 bg-transparent rounded-lg border border-gray-300 dark:border-white/20 text-gray-900 dark:text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#7367F0] focus:ring-1 focus:ring-[#7367F0] transition-colors disabled:opacity-50"
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
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#7367F0] focus:ring-[#7367F0]"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Lembrar de mim</span>
              </label>
              <Link
                to="/esqueci-senha"
                className="text-sm text-[#7367F0] hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#7367F0] hover:bg-[#685DD8] disabled:bg-[#7367F0]/60 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#7367F0]/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 text-center">
            <p className="text-sm text-gray-500 dark:text-muted-foreground mb-3">Novo na plataforma?</p>
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center w-full py-2.5 border-2 border-[#7367F0] text-[#7367F0] font-semibold rounded-lg hover:bg-[#7367F0]/5 transition-colors"
            >
              Crie uma conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
