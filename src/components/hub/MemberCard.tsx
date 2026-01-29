import { Crown, Zap, Sparkles, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';

interface MemberCardProps {
  className?: string;
}

export function MemberCard({ className }: MemberCardProps) {
  const { quota, isLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isLoading) {
    return (
      <div className={cn('rounded-[40px] bg-gradient-to-r from-primary to-indigo-800 p-6 md:p-8', className)}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-white/20" />
              <Skeleton className="h-6 w-48 bg-white/20" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-48 rounded-2xl bg-white/20" />
            <Skeleton className="h-10 w-32 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>
    );
  }

  if (!quota) return null;

  const getPlanIcon = () => {
    switch (quota.planId) {
      case 'vip':
        return <Crown className="h-10 w-10 text-amber-400 md:h-12 md:w-12" />;
      case 'pro':
        return <Zap className="h-10 w-10 text-indigo-300 md:h-12 md:w-12" />;
      default:
        return <Sparkles className="h-10 w-10 text-white/70 md:h-12 md:w-12" />;
    }
  };

  const getPlanGradient = () => {
    switch (quota.planId) {
      case 'vip':
        return 'from-amber-600 via-amber-700 to-amber-800';
      case 'pro':
        return 'from-indigo-600 via-indigo-700 to-purple-800';
      default:
        return 'from-primary to-indigo-800';
    }
  };

  const creditPercentage = quota.monthlyLimit > 0 
    ? Math.round((quota.remaining / quota.monthlyLimit) * 100) 
    : 0;

  const isVIP = quota.planId === 'vip';

  return (
    <>
      <div 
        className={cn(
          'relative overflow-hidden rounded-[40px] bg-gradient-to-r p-6 md:p-8',
          getPlanGradient(),
          className
        )}
      >
        {/* Background decorative elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: Plan Info */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm md:h-20 md:w-20">
              {getPlanIcon()}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-white/70">
                  ASSINATURA ATIVA
                </span>
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  MENSAL
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Plano {quota.planName}
              </h2>
              <p className="text-sm text-white/80">
                Sua jornada acelerada para os EUA.
              </p>
            </div>
          </div>

          {/* Right: Credits Widget + Upgrade Button */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            {/* Credits Widget */}
            <div className="rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                CRÉDITOS CURRÍCULO USA
              </span>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-bold text-white">
                  {quota.remaining}
                  <span className="text-lg font-normal text-white/60">/{quota.monthlyLimit}</span>
                </span>
                <Progress 
                  value={creditPercentage} 
                  className="w-20 bg-white/20 [&>div]:bg-white"
                />
              </div>
              <span className="text-[10px] text-white/60">
                Renova no início do mês
              </span>
            </div>

            {/* Upgrade Button - hide for VIP */}
            {!isVIP && (
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-800 shadow-lg hover:bg-white/90"
              >
                Fazer Upgrade
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        reason="upgrade"
      />
    </>
  );
}
