import { Card, CardContent } from '@/components/ui/card';
import { Users, UserCheck, UserX, HelpCircle } from 'lucide-react';
import type { AttendanceStats as Stats } from '@/hooks/useAttendance';

interface AttendanceStatsProps {
  stats: Stats;
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const items = [
    {
      label: 'Total',
      value: stats.total,
      icon: Users,
      className: 'text-foreground',
    },
    {
      label: 'Presentes',
      value: stats.present,
      icon: UserCheck,
      className: 'text-accent',
    },
    {
      label: 'Ausentes',
      value: stats.absent,
      icon: UserX,
      className: 'text-destructive',
    },
    {
      label: 'Não marcados',
      value: stats.unmarked,
      icon: HelpCircle,
      className: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={item.className}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
