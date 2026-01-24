import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erro",
        description: "Por favor, informe seu email.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setEmailSent(true);
    
    toast({
      title: "Email enviado!",
      description: "Verifique sua caixa de entrada.",
    });
  };
  
  if (emailSent) {
    return (
      <AuthLayout 
        title="Verifique seu email" 
        subtitle="Enviamos instruções para redefinir sua senha"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <p className="text-muted-foreground mb-6">
            Enviamos um link de redefinição de senha para{' '}
            <span className="font-medium text-foreground">{email}</span>.
            O link expira em 1 hora.
          </p>
          
          <p className="text-sm text-muted-foreground mb-6">
            Não recebeu o email? Verifique sua pasta de spam ou{' '}
            <button 
              onClick={() => setEmailSent(false)} 
              className="text-primary hover:underline"
            >
              tente novamente
            </button>
          </p>
          
          <Link to="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao login
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout 
      title="Esqueceu sua senha?" 
      subtitle="Informe seu email para receber um link de redefinição"
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
        
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar link de redefinição'
          )}
        </Button>
      </form>
      
      <div className="mt-6">
        <Link to="/login">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
