import { Brain, Video, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { ServiceType, SERVICE_TYPE_LABELS } from '@/types/hub';

const typeConfig: Record<ServiceType, { icon: React.ElementType; color: string }> = {
  ai_tool: { icon: Brain, color: 'bg-primary/10 text-primary border-primary/30' },
  live_mentoring: { icon: Users, color: 'bg-green-100 text-green-700 border-green-300' },
  recorded_course: { icon: Video, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  consulting: { icon: Briefcase, color: 'bg-orange-100 text-orange-700 border-orange-300' },
};

interface ServiceTypeSelectorProps {
  value: ServiceType;
  onChange: (type: ServiceType) => void;
}

export function ServiceTypeSelector({ value, onChange }: ServiceTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Tipo de Serviço
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(typeConfig) as [ServiceType, typeof typeConfig[ServiceType]][]).map(([type, config]) => {
          const Icon = config.icon;
          const isSelected = value === type;
          
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={cn(
                'flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? config.color
                  : 'border-border hover:border-muted-foreground/30 text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">{SERVICE_TYPE_LABELS[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { typeConfig };
