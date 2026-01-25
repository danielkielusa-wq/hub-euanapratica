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
        <Button asChild size="sm">
          <Link to={`/dashboard/tarefas/${assignment.id}`}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Ver Feedback
          </Link>
        </Button>
      );
    }
    
    if (isSubmitted) {
      return (
        <Button asChild variant="outline" size="sm">
          <Link to={`/dashboard/tarefas/${assignment.id}`}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Ver Entrega
          </Link>
        </Button>
      );
    }
    
    return (
      <Button asChild size="sm">
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
      const resultColors = {
        approved: 'bg-green-500/10 text-green-600 border-green-500/20',
        revision: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
        rejected: 'bg-destructive/10 text-destructive border-destructive/20'
      };
      const resultTexts = {
        approved: 'Aprovada',
        revision: 'Revisar',
        rejected: 'Não Aprovada'
      };
      const result = submission?.review_result;
      return (
        <Badge variant="outline" className={result ? resultColors[result] : ''}>
          {result ? resultTexts[result] : 'Avaliada'}
        </Badge>
      );
    }
    
    if (isSubmitted) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Entregue
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        Pendente
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base leading-tight truncate">
                {assignment.title}
              </h3>
              {assignment.espaco && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {assignment.espaco.name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
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
          <p className="text-sm text-muted-foreground line-clamp-2">
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
