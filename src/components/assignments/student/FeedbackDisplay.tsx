import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import type { ReviewResult } from '@/types/assignments';
import { cn } from '@/lib/utils';

interface FeedbackDisplayProps {
  feedback: string | null;
  reviewResult: ReviewResult | null;
  reviewedAt: string | null;
  reviewerName?: string;
}

export function FeedbackDisplay({ 
  feedback, 
  reviewResult, 
  reviewedAt,
  reviewerName 
}: FeedbackDisplayProps) {
  if (!reviewResult) return null;

  const resultConfig = {
    approved: {
      icon: CheckCircle,
      label: 'Aprovada',
      className: 'border-green-500/30 bg-green-500/5',
      badgeClassName: 'bg-green-500/10 text-green-600 border-green-500/20',
      iconClassName: 'text-green-500'
    },
    revision: {
      icon: RotateCcw,
      label: 'Precisa Revisar',
      className: 'border-yellow-500/30 bg-yellow-500/5',
      badgeClassName: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      iconClassName: 'text-yellow-500'
    },
    rejected: {
      icon: AlertCircle,
      label: 'Não Aprovada',
      className: 'border-destructive/30 bg-destructive/5',
      badgeClassName: 'bg-destructive/10 text-destructive border-destructive/20',
      iconClassName: 'text-destructive'
    }
  };

  const config = resultConfig[reviewResult];
  const Icon = config.icon;

  return (
    <Card className={cn("border-2", config.className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback do Mentor
          </CardTitle>
          <Badge variant="outline" className={config.badgeClassName}>
            <Icon className={cn("h-3 w-3 mr-1", config.iconClassName)} />
            {config.label}
          </Badge>
        </div>
        {reviewedAt && (
          <p className="text-sm text-muted-foreground">
            Avaliado {reviewerName && `por ${reviewerName}`} em{' '}
            {format(new Date(reviewedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </CardHeader>
      {feedback && (
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{feedback}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
