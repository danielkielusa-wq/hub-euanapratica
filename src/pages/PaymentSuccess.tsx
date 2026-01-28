import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentSuccess() {
  const [isSyncing, setIsSyncing] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Give the webhook time to process the payment
    const timer = setTimeout(() => {
      // Invalidate cache to fetch new access permissions
      queryClient.invalidateQueries({ queryKey: ['user-hub-access'] });
      setIsSyncing(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-[32px] border-0 bg-card/80 backdrop-blur-md shadow-xl p-8 text-center">
        {/* Success Icon with Animation */}
        <div className="relative mx-auto mb-6 w-24 h-24">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-20" />
          <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-full">
            <CheckCircle className="h-12 w-12 text-accent-foreground" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          Pagamento Confirmado!
          <Sparkles className="h-5 w-5 text-primary" />
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground mb-8">
          Seu acesso foi liberado com sucesso.
        </p>

        {/* Sync Status / CTA */}
        {isSyncing ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm">Sincronizando seu acesso...</span>
            </div>
            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <Button
            onClick={() => navigate('/dashboard/hub')}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-6"
          >
            Ir para o meu Hub
          </Button>
        )}

        {/* Footer note */}
        <p className="mt-6 text-xs text-muted-foreground">
          Você receberá um e-mail de confirmação em instantes.
        </p>
      </Card>
    </div>
  );
}
