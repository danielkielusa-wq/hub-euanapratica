import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, Link as LinkIcon, FileText, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AssignmentWithSubmission } from '@/types/assignments';

interface AssignmentCardProps {
  assignment: AssignmentWithSubmission;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const submission = assignment.my_submission;
  const isSubmitted = submission?.status === 'submitted' || submission?.status === 'reviewed';
  const isReviewed = submission?.status === 'reviewed';
  const isApproved = isReviewed && submission?.review_result === 'approved';
  const isPending = !isSubmitted || (isReviewed && submission?.review_result !== 'approved');

  // Determine icon based on submission type
  const getIcon = () => {
    switch (assignment.submission_type) {
      case 'file':
        return Upload;
      case 'text':
        return FileText;
      default:
        return FileText;
    }
  };
  
  const Icon = getIcon();

  // Format due date
  const dueDate = format(new Date(assignment.due_date), "dd MMM yyyy", { locale: ptBR });
  const formattedDueDate = dueDate.split(' ').map((word, i) => 
    i === 1 ? word.charAt(0).toUpperCase() + word.slice(1) : word
  ).join(' ');

  // Status display
  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-600 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Concluída</span>
        </div>
      );
    }
    
    if (isSubmitted && !isReviewed) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 text-amber-600 bg-amber-50">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Aguardando</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Pendente</span>
      </div>
    );
  };

  return (
    <Link 
      to={`/dashboard/tarefas/${assignment.id}`}
      className="block"
    >
      <div className="flex items-center gap-4 p-4 bg-white rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
          <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {assignment.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {assignment.espaco && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 text-xs font-medium">
                {assignment.espaco.name}
              </Badge>
            )}
            <span className="text-sm text-gray-500">
              Prazo: {formattedDueDate}
            </span>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex-shrink-0 hidden sm:block">
          {getStatusBadge()}
        </div>
        
        {/* Arrow */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </Button>
      </div>
    </Link>
  );
}
