import { Calendar, FileText, FolderOpen, Users, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconBg: string;
  delay?: number;
}

function MetricCard({ icon, label, value, iconBg, delay = 0 }: MetricCardProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 snap-start",
        "w-[140px] md:w-auto md:flex-1",
        "p-4 rounded-2xl",
        "bg-card/70 dark:bg-card/50 backdrop-blur-sm",
        "border border-border/40",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        "animate-fade-slide-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2.5 rounded-xl", iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface EspacoMetricsRowProps {
  sessionsCount: number;
  tasksCount: number;
  materialsCount: number;
  maxStudents?: number | null;
  isMentor?: boolean;
}

export function EspacoMetricsRow({ 
  sessionsCount, 
  tasksCount, 
  materialsCount, 
  maxStudents,
  isMentor = false
}: EspacoMetricsRowProps) {
  const metrics = isMentor ? [
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      label: "Alunos",
      value: maxStudents ?? 0,
      iconBg: "bg-primary/10",
    },
    {
      icon: <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      label: "Próximas Sessões",
      value: sessionsCount,
      iconBg: "bg-blue-500/10",
    },
    {
      icon: <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      label: "Correções",
      value: tasksCount,
      iconBg: "bg-amber-500/10",
    },
    {
      icon: <FolderOpen className="h-5 w-5 text-secondary" />,
      label: "Materiais",
      value: materialsCount,
      iconBg: "bg-secondary/10",
    },
  ] : [
    {
      icon: <Calendar className="h-5 w-5 text-primary" />,
      label: "Próximas Sessões",
      value: sessionsCount,
      iconBg: "bg-primary/10",
    },
    {
      icon: <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      label: "Tarefas Pendentes",
      value: tasksCount,
      iconBg: "bg-amber-500/10",
    },
    {
      icon: <FolderOpen className="h-5 w-5 text-secondary" />,
      label: "Materiais",
      value: materialsCount,
      iconBg: "bg-secondary/10",
    },
    {
      icon: <Users className="h-5 w-5 text-accent" />,
      label: "Vagas",
      value: maxStudents ?? '∞',
      iconBg: "bg-accent/10",
    },
  ];

  return (
    <div className="px-4 py-4">
      {/* Mobile: Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:hidden">
        {metrics.map((metric, idx) => (
          <MetricCard key={metric.label} {...metric} delay={idx * 50} />
        ))}
      </div>
      
      {/* Desktop: Grid - Expanded for ultra-wide */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {metrics.map((metric, idx) => (
          <MetricCard key={metric.label} {...metric} delay={idx * 50} />
        ))}
      </div>
    </div>
  );
}
