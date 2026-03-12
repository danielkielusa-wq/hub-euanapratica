import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare, UserPlus, Play, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'submission' | 'enrollment' | 'attendance';
  text: string;
  timestamp: string;
}

interface MentorActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

const typeConfig = {
  submission: { icon: CheckSquare, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  enrollment: { icon: UserPlus, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  attendance: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
};

export function MentorActivityFeed({ activities, isLoading }: MentorActivityFeedProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[20px] border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" /> Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="rounded-[20px] border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" /> Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade recente</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[20px] border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" /> Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 6).map(activity => {
            const config = typeConfig[activity.type];
            const Icon = config.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
