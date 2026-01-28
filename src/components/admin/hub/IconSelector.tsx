import { useState } from 'react';
import {
  FileCheck,
  GraduationCap,
  Award,
  Monitor,
  Globe,
  Building2,
  Sparkles,
  Briefcase,
  BookOpen,
  Mic,
  Video,
  Users,
  Rocket,
  Brain,
  Target,
  TrendingUp,
  Zap,
  Crown,
  Star,
  Heart,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const iconMap: Record<string, LucideIcon> = {
  FileCheck,
  GraduationCap,
  Award,
  Monitor,
  Globe,
  Building2,
  Sparkles,
  Briefcase,
  BookOpen,
  Mic,
  Video,
  Users,
  Rocket,
  Brain,
  Target,
  TrendingUp,
  Zap,
  Crown,
  Star,
  Heart,
};

interface IconSelectorProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const [search, setSearch] = useState('');
  
  const filteredIcons = Object.entries(iconMap).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Ícone Visual
      </Label>
      <Input
        placeholder="Buscar ícone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9"
      />
      <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1">
        {filteredIcons.map(([name, Icon]) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={cn(
              'flex items-center justify-center p-2.5 rounded-lg border-2 transition-all',
              value === name
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            )}
            title={name}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

export { iconMap };
