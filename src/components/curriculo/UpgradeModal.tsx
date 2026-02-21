import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Sparkles, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
  display_features: string[];
  cta_text: string;
  is_popular: boolean;
}

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanId?: string;
  reason?: 'limit_reached' | 'upgrade';
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlanId = 'basic',
  reason = 'upgrade'
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price, monthly_limit, display_features, cta_text, is_popular')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      
      setPlans((data || []).map(p => ({
        ...p,
        display_features: Array.isArray(p.display_features) 
          ? p.display_features as string[]
          : [],
      })));
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return `R$ ${price}/mês`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          {reason === 'limit_reached' ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <DialogTitle className="text-2xl font-bold">
                  Você Atingiu Seu Limite!
                </DialogTitle>
              </div>
              <p className="text-muted-foreground">
                Não gaste sua chance. Atualize seu plano para continuar 
                otimizando seu currículo agora mesmo.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <DialogTitle className="text-2xl font-bold">
                  Potencialize Suas Análises
                </DialogTitle>
              </div>
              <p className="text-muted-foreground">
                Escolha o plano ideal para acelerar sua jornada profissional nos EUA
              </p>
            </>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {plans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlanId;
              const isPro = plan.is_popular;
              
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border p-6 flex flex-col",
                    isPro 
                      ? "border-primary bg-primary/5 shadow-lg scale-[1.02]" 
                      : "border-border bg-card",
                    isCurrentPlan && "ring-2 ring-primary/50"
                  )}
                >
                  {/* Popular badge */}
                  {isPro && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground gap-1">
                      <Crown className="w-3 h-3" />
                      Popular
                    </Badge>
                  )}

                  {/* Plan header */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
                      {plan.name}
                    </h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPrice(plan.price)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {plan.monthly_limit === 999 
                        ? 'Análises ilimitadas' 
                        : `${plan.monthly_limit} análise${plan.monthly_limit > 1 ? 's' : ''}/mês`}
                    </p>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.display_features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isCurrentPlan ? (
                    <Button disabled variant="outline" className="w-full">
                      Plano Atual
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button disabled variant="outline" className="w-full">
                      {plan.cta_text}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleUpgrade}
                      variant={isPro ? "default" : "outline"}
                      className="w-full gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {plan.cta_text}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border mt-4">
          <p>Veja todos os detalhes e assine na página de planos.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
