import { RefreshCw, Settings2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanConfigCard } from '@/components/admin/plans/PlanConfigCard';
import { useAdminPlans } from '@/hooks/useAdminPlans';

export default function AdminPlans() {
  const { plans, isLoading, isSaving, updatePlan, refetch } = useAdminPlans();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Configurar Planos</h1>
                <p className="text-sm text-muted-foreground">
                  Defina os limites e funcionalidades de cada plano para os usuários.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={refetch}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[600px] rounded-[24px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {plans.map(plan => (
                <PlanConfigCard
                  key={plan.id}
                  plan={plan}
                  onSave={updatePlan}
                  isSaving={isSaving === plan.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
