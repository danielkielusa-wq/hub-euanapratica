import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Briefcase, 
  CheckCircle, 
  History, 
  RotateCcw,
  UserX,
  Loader2,
  Crown,
  Zap,
  Sparkles,
  Pencil
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { PlanBadge } from './PlanBadge';
import { AppConsumptionCard } from './AppConsumptionCard';
import { supabase } from '@/integrations/supabase/client';

interface UserWithUsage {
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  plan_id: string;
  plan_name: string;
  monthly_limit: number;
  used_this_month: number;
  last_usage_at: string | null;
}

interface ActivityLog {
  id: string;
  app_id: string;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  monthly_limit: number;
}

interface UserDetailDrawerProps {
  user: UserWithUsage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResetUsage: (userId: string) => Promise<boolean>;
  isResetting?: boolean;
  plans?: Plan[];
  onChangePlan?: (userId: string, planId: string) => Promise<boolean>;
  isChangingPlan?: boolean;
}

export function UserDetailDrawer({
  user,
  open,
  onOpenChange,
  onResetUsage,
  isResetting = false,
  plans = [],
  onChangePlan,
  isChangingPlan = false,
}: UserDetailDrawerProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (user && open) {
      fetchActivities(user.user_id);
    }
  }, [user, open]);

  const fetchActivities = async (userId: string) => {
    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('id, app_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setActivities(data);
      }
    } catch (err) {
    } finally {
      setLoadingActivities(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityLabel = (appId: string) => {
    switch (appId) {
      case 'curriculo_usa':
        return 'Análise de currículo realizada';
      case 'job_marketplace':
        return 'Vaga visualizada';
      default:
        return 'Atividade registrada';
    }
  };

  const getAppLabel = (appId: string) => {
    switch (appId) {
      case 'curriculo_usa':
        return 'ResumePass';
      case 'job_marketplace':
        return 'Job Marketplace';
      default:
        return appId;
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profile_photo_url || undefined} />
              <AvatarFallback className="text-lg bg-blue-600 text-white">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-xl text-slate-900">
                {user.full_name}
              </SheetTitle>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Plan & Status Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Plano Atual
                </p>
                <div className="flex items-center gap-2">
                  <PlanBadge planId={user.plan_id} planName={user.plan_name} size="lg" />
                  {plans.length > 0 && onChangePlan && (
                    <Select
                      value={user.plan_id}
                      onValueChange={(value) => onChangePlan(user.user_id, value)}
                      disabled={isChangingPlan}
                    >
                      <SelectTrigger className="w-auto h-8 px-2 border-dashed border-slate-300 bg-transparent">
                        {isChangingPlan ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Pencil className="w-3 h-3 text-slate-500" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex items-center gap-2">
                              {plan.id === 'vip' && <Crown className="w-4 h-4 text-amber-500" />}
                              {plan.id === 'pro' && <Zap className="w-4 h-4 text-purple-500" />}
                              {plan.id === 'basic' && <Sparkles className="w-4 h-4 text-gray-500" />}
                              <span>{plan.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({plan.monthly_limit === 999 ? '∞' : plan.monthly_limit}/mês)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900">Ativo</span>
                </div>
              </div>
            </div>

            {/* App Consumption */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Uso Detalhado por App
              </h3>
              <div className="space-y-3">
                <AppConsumptionCard
                  icon={FileText}
                  appName="ResumePass AI"
                  used={user.used_this_month}
                  limit={user.monthly_limit}
                  label="Análises Usadas"
                  variant="curriculo"
                />
                <AppConsumptionCard
                  icon={Briefcase}
                  appName="Job Marketplace"
                  used={0}
                  limit={0}
                  label="Vagas Aplicadas"
                  variant="jobs"
                />
              </div>
            </div>

            {/* Activity Feed */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Histórico de Atividades
                </h3>
              </div>
              
              {loadingActivities ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhuma atividade registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {getActivityLabel(activity.app_id)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getAppLabel(activity.app_id)} •{' '}
                          {format(new Date(activity.created_at), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-6 border-t bg-white">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onResetUsage(user.user_id)}
              disabled={isResetting || user.used_this_month === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Resetar Créditos
            </Button>
            <Button variant="outline" className="text-slate-700">
              <UserX className="w-4 h-4 mr-2" />
              Suspender
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
