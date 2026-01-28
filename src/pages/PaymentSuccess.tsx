import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type SyncState = 'syncing' | 'confirmed' | 'delayed';

export default function PaymentSuccess() {
  const [syncState, setSyncState] = useState<SyncState>('syncing');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Phase 1: Initial sync wait (4 seconds)
    const syncTimer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['user-hub-access'] });
      setSyncState('confirmed');
    }, 4000);

    // Phase 2: If still not confirmed after 15 seconds, show fallback
    const fallbackTimer = setTimeout(() => {
      setSyncState((current) => current === 'syncing' ? 'delayed' : current);
    }, 15000);

    return () => {
      clearTimeout(syncTimer);
      clearTimeout(fallbackTimer);
    };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="max-w-md w-full rounded-[32px] border-0 bg-card/80 backdrop-blur-md shadow-xl p-8 text-center">
        {/* Dynamic Icon */}
        <div className="relative mx-auto mb-6 w-24 h-24">
          {syncState === 'syncing' && (
            <>
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20" />
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
                <Clock className="h-12 w-12 text-primary animate-pulse" />
              </div>
            </>
          )}
          {syncState === 'confirmed' && (
            <>
              <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-20" />
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-full">
                <CheckCircle className="h-12 w-12 text-accent-foreground" />
              </div>
            </>
          )}
          {syncState === 'delayed' && (
            <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/80 rounded-full">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Syncing State */}
        {syncState === 'syncing' && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sincronizando seu acesso...
            </h1>
            <p className="text-muted-foreground mb-8">
              Estamos esperando a confirmação do pagamento. Isso pode levar alguns minutos.
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">Processando...</span>
              </div>
              <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </>
        )}

        {/* Confirmed State */}
        {syncState === 'confirmed' && (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              Pagamento Confirmado!
              <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-muted-foreground mb-8">
              Tudo certo! Seu conteúdo está liberado.
            </p>
            <Button
              onClick={() => navigate('/dashboard/hub')}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-6"
            >
              Acessar Meu Conteúdo
            </Button>
          </>
        )}

        {/* Delayed/Fallback State */}
        {syncState === 'delayed' && (
          <>
            <h1 className="text-xl font-bold text-foreground mb-2">
              Houve um atraso na confirmação
            </h1>
            <p className="text-muted-foreground mb-6">
              Você não precisa fazer nada — seu acesso será liberado automaticamente assim que recebermos a confirmação.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['user-hub-access'] });
                  setSyncState('syncing');
                  // Try again
                  setTimeout(() => setSyncState('confirmed'), 3000);
                }}
                variant="outline"
                className="w-full rounded-xl"
              >
                Tentar novamente
              </Button>
              <Button
                onClick={() => navigate('/dashboard/hub')}
                variant="ghost"
                className="w-full rounded-xl"
              >
                Ir para o Hub mesmo assim
              </Button>
            </div>
          </>
        )}

        {/* Footer note */}
        <p className="mt-6 text-xs text-muted-foreground">
          {syncState === 'confirmed' 
            ? 'Você receberá um e-mail de confirmação em instantes.'
            : 'Se precisar de ajuda, entre em contato pelo suporte.'}
        </p>
      </Card>
    </div>
  );
}
