import { FileText, Users, Video, ArrowRight, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAssignments } from '@/hooks/useAssignments';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ActivityType = 'upload' | 'networking' | 'aula';
type ActivityStatus = 'pending' | 'in_progress' | 'completed';

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  category: string;
  status: ActivityStatus;
}

const typeConfig: Record<ActivityType, { icon: React.ElementType; bgColor: string; iconColor: string }> = {
  upload: { icon: FileText, bgColor: 'bg-amber-500/10', iconColor: 'text-amber-500' },
  networking: { icon: Users, bgColor: 'bg-primary/10', iconColor: 'text-primary' },
  aula: { icon: Video, bgColor: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
};

const statusConfig: Record<ActivityStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/10' },
  in_progress: { label: 'Em andamento', className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/10' },
  completed: { label: 'Concluido', className: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10' },
};

function ActivityCard({ activity }: { activity: Activity }) {
  const navigate = useNavigate();
  const config = typeConfig[activity.type];
  const status = statusConfig[activity.status];
  const Icon = config.icon;

  return (
    <Card 
      className="p-4 rounded-[20px] border border-border bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate('/dashboard/tarefas')}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', config.bgColor)}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div>
            <p className="font-medium text-foreground">{activity.title}</p>
            <p className="text-sm text-muted-foreground">{activity.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn('border-0', status.className)}>
            {activity.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {status.label}
          </Badge>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface RecentActivitiesProps {
  onViewAll?: () => void;
}

export function RecentActivities({ onViewAll }: RecentActivitiesProps) {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useAssignments();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/dashboard/tarefas');
    }
  };

  // Transform assignments into activities
  const activities: Activity[] = (assignments || []).slice(0, 3).map(assignment => {
    let status: ActivityStatus = 'pending';
    if (assignment.my_submission?.status === 'submitted') {
      status = 'in_progress';
    } else if (assignment.my_submission?.status === 'reviewed') {
      status = 'completed';
    }

    // Determine type based on submission_type or title keywords
    let type: ActivityType = 'upload';
    if (assignment.title.toLowerCase().includes('network') || assignment.title.toLowerCase().includes('linkedin')) {
      type = 'networking';
    } else if (assignment.title.toLowerCase().includes('aula') || assignment.title.toLowerCase().includes('video')) {
      type = 'aula';
    }

    return {
      id: assignment.id,
      title: assignment.title,
      type,
      category: assignment.espaco?.name || 'Atividade',
      status,
    };
  });

  const displayActivities = activities;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Atividades Recentes</h2>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto"
          onClick={handleViewAll}
        >
          Ver todas
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-[20px]" />
            <Skeleton className="h-20 rounded-[20px]" />
            <Skeleton className="h-20 rounded-[20px]" />
          </>
        ) : displayActivities.length > 0 ? (
          displayActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        ) : (
          <Card className="p-6 rounded-[20px] border border-border bg-card text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade atribuida para voce no momento.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
