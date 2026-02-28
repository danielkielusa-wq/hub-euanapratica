import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, Lock, ExternalLink, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveAccessCheck, useRegisterForLive, useUnregisterFromLive } from '@/hooks/useLives';
import { toast } from '@/hooks/use-toast';
import type { Live } from '@/types/live';

interface LiveAccessCTAProps {
  live: Live;
}

export function LiveAccessCTA({ live }: LiveAccessCTAProps) {
  const navigate = useNavigate();
  const { data: access, isLoading } = useLiveAccessCheck(live.id);
  const registerMutation = useRegisterForLive();
  const unregisterMutation = useUnregisterFromLive();

  if (isLoading) {
    return (
      <Button disabled className="w-full h-12">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Verificando acesso...
      </Button>
    );
  }

  if (!access) return null;

  // Already registered
  if (access.registered) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">Você está inscrito nesta live!</p>
        </div>

        {live.meeting_link && live.status === 'live' && (
          <Button
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={() => window.open(live.meeting_link!, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Entrar na Live Agora
          </Button>
        )}

        {live.meeting_link && live.status === 'scheduled' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(live.meeting_link!, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Link da Reunião (salve!)
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-red-500"
          onClick={() => {
            unregisterMutation.mutate(live.id, {
              onSuccess: () => toast({ title: 'Inscrição cancelada.' }),
            });
          }}
          disabled={unregisterMutation.isPending}
        >
          Cancelar inscrição
        </Button>
      </div>
    );
  }

  // Free — can register
  if (access.allowed && access.reason === 'free') {
    return (
      <Button
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base"
        onClick={() => {
          registerMutation.mutate(live.id, {
            onSuccess: () => toast({ title: 'Inscrição realizada!', description: 'Você está inscrito na live.' }),
          });
        }}
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Inscreva-se Gratuitamente
      </Button>
    );
  }

  // Subscriber/pro/vip allowed — can register
  if (access.allowed) {
    return (
      <Button
        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base"
        onClick={() => {
          registerMutation.mutate(live.id, {
            onSuccess: () => toast({ title: 'Inscrição realizada!', description: 'Você está inscrito na live.' }),
          });
        }}
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        Inscreva-se (incluído no seu plano)
      </Button>
    );
  }

  // Payment required
  if (access.reason === 'payment_required') {
    return (
      <Button
        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold text-base"
        onClick={() => {
          if (access.checkout_url) {
            window.open(access.checkout_url, '_blank');
          } else {
            toast({ title: 'Link de pagamento não disponível', variant: 'destructive' });
          }
        }}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Comprar Acesso — R$ {(access.price || 0).toFixed(2).replace('.', ',')}
      </Button>
    );
  }

  // No subscription
  if (access.reason === 'no_subscription') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <Lock className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">Esta live é exclusiva para assinantes.</p>
        </div>
        <Button
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          onClick={() => navigate('/pricing')}
        >
          Assine para Participar
        </Button>
      </div>
    );
  }

  // Plan too low
  if (access.reason === 'plan_too_low') {
    const requiredPlan = access.required === 'vip' ? 'VIP' : 'Pro';
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-600 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <Lock className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">
            Esta live requer o plano <strong>{requiredPlan}</strong> ou superior.
          </p>
        </div>
        <Button
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold"
          onClick={() => navigate('/pricing')}
        >
          Upgrade para {requiredPlan}
        </Button>
      </div>
    );
  }

  // Full
  if (access.reason === 'full') {
    return (
      <Button disabled className="w-full h-12">
        Vagas Esgotadas
      </Button>
    );
  }

  return null;
}
