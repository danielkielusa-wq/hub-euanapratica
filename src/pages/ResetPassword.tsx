import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation rules
  const passwordRules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas não correspondem');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        
        if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
          setError('O link de recuperação expirou ou é inválido. Por favor, solicite um novo link.');
        } else if (updateError.message.includes('weak')) {
          setError('A senha é muito fraca. Por favor, escolha uma senha mais forte.');
        } else {
          setError('Ocorreu um erro ao atualizar a senha. Tente novamente.');
        }
        return;
      }

      setIsSuccess(true);
      toast.success('Senha atualizada com sucesso!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordCheck = ({ passed, label }: { passed: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {passed ? (
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={passed ? 'text-primary' : 'text-muted-foreground'}>
        {label}
      </span>
    </div>
  );

  if (isSuccess) {
    return (
      <AuthLayout
        title="Senha Atualizada!"
        subtitle="Sua senha foi alterada com sucesso."
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Você será redirecionado para a página de login em instantes...
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Ir para Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Redefinir Senha"
      subtitle="Digite sua nova senha abaixo."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive">{error}</p>
              {error.includes('expirou') && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm text-destructive underline"
                  onClick={() => navigate('/esqueci-senha')}
                >
                  Solicitar novo link
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Nova Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Digite sua nova senha"
            autoComplete="new-password"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Confirme sua nova senha"
            autoComplete="new-password"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-destructive">As senhas não correspondem</p>
          )}
        </div>

        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium text-foreground mb-2">Requisitos da senha:</p>
          <PasswordCheck passed={passwordRules.length} label="Mínimo de 8 caracteres" />
          <PasswordCheck passed={passwordRules.uppercase} label="Uma letra maiúscula" />
          <PasswordCheck passed={passwordRules.number} label="Um número" />
          <PasswordCheck passed={passwordRules.special} label="Um caractere especial" />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !isPasswordValid || !passwordsMatch}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Atualizando...
            </>
          ) : (
            'Redefinir Senha'
          )}
        </Button>

        <div className="text-center">
          <Button
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={() => navigate('/login')}
          >
            Voltar para login
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
