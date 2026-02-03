import { RefreshCw, Settings2, Save, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanCard } from '@/components/admin/plans/PlanCard';
import { useAdminPlans } from '@/hooks/useAdminPlans';

export default function AdminPlans() {
  const { plans, isLoading, isSaving, updatePlan, refetch } = useAdminPlans();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 md:p-8">
        <div className="max-w-7xl mx-auto animate-fade-in pb-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Gestão de Planos</h1>
              <p className="text-muted-foreground mt-1">
                Configure preços, limites e benefícios de cada nível de assinatura.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={refetch}
                className="gap-2 rounded-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Plans Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-[700px] rounded-[32px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {plans.map(plan => (
                <PlanCard
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
