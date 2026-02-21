import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Clock, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type PageState = 'waiting' | 'activated' | 'timeout';

export default function SubscriptionSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('waiting');
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    if (!user?.id) return;

    // Check if already active
    async function checkExisting() {
      const { data } = await supabase
        .from('user_subscriptions')
        .select('status, plan_id, plans(name)')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (data?.status === 'active') {
        const plan = data.plans as unknown as { name: string } | null;
        setPlanName(plan?.name || data.plan_id);
        setState('activated');
        return true;
      }
      return false;
    }

    checkExisting().then((alreadyActive) => {
      if (alreadyActive) return;

      // Listen for realtime updates
      const channel = supabase
        .channel('sub-success')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user!.id}`,
          },
          async (payload) => {
            const record = payload.new as Record<string, unknown>;
            if (record?.status === 'active') {
              const planId = record.plan_id as string;
              const { data: planData } = await supabase
                .from('plans')
                .select('name')
                .eq('id', planId)
                .maybeSingle();
              setPlanName(planData?.name || planId);
              setState('activated');
            }
          }
        )
        .subscribe();

      // Timeout after 60s
      const timeout = setTimeout(() => {
        setState((prev) => (prev === 'waiting' ? 'timeout' : prev));
      }, 60000);

      return () => {
        supabase.removeChannel(channel);
        clearTimeout(timeout);
      };
    });
  }, [user?.id]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center bg-card border border-border rounded-[32px] p-10 shadow-sm animate-fade-in">
          {state === 'waiting' && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-black text-foreground mb-2">
                Processando pagamento...
              </h1>
              <p className="text-muted-foreground mb-6">
                Estamos confirmando seu pagamento. Isso pode levar alguns segundos.
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </>
          )}

          {state === 'activated' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-black text-foreground mb-2">
                Assinatura ativada!
              </h1>
              <p className="text-muted-foreground mb-6">
                Bem-vindo ao plano <span className="font-bold text-foreground">{planName}</span>!
                Seus novos recursos já estão disponíveis.
              </p>
              <Button
                onClick={() => navigate('/dashboard/hub')}
                className="gap-2"
                size="lg"
              >
                Ir para o Hub
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {state === 'timeout' && (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-black text-foreground mb-2">
                Pagamento em processamento
              </h1>
              <p className="text-muted-foreground mb-6">
                Se você pagou via Pix ou Boleto, pode levar até 3 dias úteis para confirmação.
                Você receberá um email quando sua assinatura for ativada.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/dashboard/hub')} className="gap-2">
                  Ir para o Hub
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/meus-pedidos')}>
                  Meus Pedidos
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
