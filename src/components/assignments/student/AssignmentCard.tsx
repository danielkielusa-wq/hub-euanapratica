import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DueDateBadge } from './DueDateBadge';
import { FileText, ArrowRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AssignmentWithSubmission } from '@/types/assignments';

interface AssignmentCardProps {
  assignment: AssignmentWithSubmission;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const submission = assignment.my_submission;
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'reviewed';
  const isReviewed = submission?.status === 'reviewed';
  const hasFeedback = isReviewed && submission?.feedback;

  // Truncate description to 2 lines (approximately 150 characters)
  const truncatedDescription = assignment.description 
    ? assignment.description.length > 150 
      ? assignment.description.substring(0, 150) + '...'
      : assignment.description
    : null;

  // Determine action button
  const getActionButton = () => {
    if (isReviewed && hasFeedback) {
      return (
        <Button asChild variant="gradient" size="sm">
          <Link to={`/dashboard/tarefas/${assignment.id}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Ver Feedback
          </Link>
        </Button>
      );
    }
    
    if (isSubmitted) {
      return (
        <Button asChild variant="gradientOutline" size="sm">
          <Link to={`/dashboard/tarefas/${assignment.id}`}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Ver Entrega
          </Link>
        </Button>
      );
    }
    
    return (
      <Button asChild variant="gradient" size="sm">
        <Link to={`/dashboard/tarefas/${assignment.id}`}>
          Entregar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    );
  };

  // Status badge
  const getStatusBadge = () => {
    if (isReviewed) {
      const resultVariants = {
        approved: 'pastelEmerald' as const,
        revision: 'pastelAmber' as const,
        rejected: 'pastelRose' as const
      };
      const resultTexts = {
        approved: 'Aprovada',
        revision: 'Revisar',
        rejected: 'Não Aprovada'
      };
      const result = submission?.review_result;
      return (
        <Badge variant={result ? resultVariants[result] : 'pastelSlate'}>
          {result ? resultTexts[result] : 'Avaliada'}
        </Badge>
      );
    }
    
    if (isSubmitted) {
      return (
        <Badge variant="pastelPurple">
          Entregue
        </Badge>
      );
    }
    
    return (
      <Badge variant="pastelSlate">
        Pendente
      </Badge>
    );
  };

  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 shrink-0">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight truncate">
                {assignment.title}
              </h3>
              {assignment.espaco && (
                <Badge variant="pastelSlate" className="mt-1 text-xs">
                  {assignment.espaco.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <DueDateBadge 
              dueDate={assignment.due_date} 
              submitted={isSubmitted} 
            />
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      
      {truncatedDescription && (
        <CardContent className="py-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {truncatedDescription}
          </p>
        </CardContent>
      )}
      
      <CardFooter className="pt-2">
        <div className="flex items-center justify-end w-full">
          {getActionButton()}
        </div>
      </CardFooter>
    </Card>
  );
}
