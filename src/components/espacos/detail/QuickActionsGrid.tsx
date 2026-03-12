import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  colSpan?: number;
}

interface QuickActionsGridProps {
  actions: QuickAction[];
}

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <Card className="rounded-[20px] border-border/50 w-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center gap-2 h-20 rounded-xl bg-muted/50 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors ${
                action.colSpan === 2 ? 'col-span-2' : ''
              }`}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
