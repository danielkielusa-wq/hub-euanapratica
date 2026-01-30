import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import logo from '@/assets/logo-horizontal.png';

interface ReportGatekeeperProps {
  onVerify: (email: string) => Promise<boolean>;
  isLoading?: boolean;
  error?: string;
}

export function ReportGatekeeper({ onVerify, isLoading, error }: ReportGatekeeperProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      await onVerify(email.trim().toLowerCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[24px] shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="Logo" className="h-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">Seu Diagnóstico de Carreira</CardTitle>
            <CardDescription>
              Digite seu email para acessar seu relatório personalizado
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-[12px]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-[12px] bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full rounded-[12px] gap-2" 
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Acessar Relatório
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Usamos seu email apenas para verificar sua identidade e proteger seu relatório.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
