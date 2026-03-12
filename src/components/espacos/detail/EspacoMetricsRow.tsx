import { Calendar, FileText, FolderOpen, Users, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  iconBg: string;
}

function MetricCard({ icon, label, value, iconBg }: MetricCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className={cn(
        "flex-shrink-0 snap-start",
        "w-[140px] md:w-auto md:flex-1",
        "p-4 rounded-2xl",
        "bg-card/70 dark:bg-card/50 backdrop-blur-sm",
        "border border-border/40",
        "shadow-sm hover:shadow-md transition-shadow duration-200"
      )}
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
    </motion.div>
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
      <motion.div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </motion.div>

      {/* Desktop: Grid - Expanded for ultra-wide */}
      <motion.div
        className="hidden md:grid md:grid-cols-4 gap-4 max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </motion.div>
    </div>
  );
}
