import { useMemo } from 'react';
import { Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useInView } from '@/hooks/useInView';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { V2TimelineMilestones } from '@/types/leads';

interface V2CheckpointsProps {
  milestones: V2TimelineMilestones;
}

interface CheckpointItem {
  date: string;
  title: string;
  description: string;
  color: string;
}

const checkpointMeta = [
  { title: 'Primeiro check-in', description: 'Avaliar progresso no inglês e rotina estabelecida.', color: 'bg-rose-400' },
  { title: 'Check-in mensal', description: 'Revisar avanço na carreira conforme necessário.', color: 'bg-blue-400' },
  { title: 'Revisão trimestral', description: 'Avaliação completa de progresso e próximos passos.', color: 'bg-emerald-400' },
];

function formatCheckpointDate(raw: string): string {
  try {
    const parsed = parseISO(raw);
    if (isValid(parsed)) {
      return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
    }
  } catch {
    // not ISO
  }
  return raw;
}

export function V2Checkpoints({ milestones }: V2CheckpointsProps) {
  const { ref, isInView } = useInView();

  const checkpoints = useMemo<CheckpointItem[]>(() => {
    const dates = [
      milestones.scheduled_follow_up_1,
      milestones.scheduled_follow_up_2,
      milestones.scheduled_follow_up_3,
    ];
    return dates
      .filter(Boolean)
      .map((date, i) => ({
        date: formatCheckpointDate(date),
        ...checkpointMeta[i],
      }));
  }, [milestones]);

  if (checkpoints.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Próximos checkpoints</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Datas de follow-up para acompanhar seu progresso.
      </p>

      <div ref={ref} className="space-y-3">
        {checkpoints.map((cp, index) => (
          <Card
            key={index}
            className="rounded-2xl shadow-sm transition-all duration-500 ease-out hover:shadow-md"
            style={{
              opacity: isInView ? 1 : 0,
              transform: isInView ? 'translateY(0)' : 'translateY(12px)',
              transitionDelay: `${index * 100}ms`,
            }}
          >
            <CardContent className="p-3 sm:p-4 md:p-5 flex items-start gap-3 sm:gap-4">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${cp.color} flex items-center justify-center shrink-0`}>
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">{cp.date}</span>
                  <span className="font-semibold text-sm text-foreground">{cp.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {cp.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
