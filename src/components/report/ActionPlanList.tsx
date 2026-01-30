import { Card, CardContent } from '@/components/ui/card';

interface ActionPlanListProps {
  actionPlan: Array<{
    step: number;
    title: string;
    description: string;
  }>;
}

export function ActionPlanList({ actionPlan }: ActionPlanListProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        ✅ Plano de Ação
      </h3>
      
      <div className="space-y-4">
        {actionPlan.map((action) => (
          <Card 
            key={action.step} 
            className="rounded-[24px] border border-border/50 shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-5 md:p-6">
              <div className="flex gap-4">
                {/* Step Number Circle */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-bold text-lg">{action.step}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-base md:text-lg mb-1">
                    {action.title}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
