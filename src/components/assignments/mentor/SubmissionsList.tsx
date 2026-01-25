import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Users
} from 'lucide-react';
import { useAssignmentSubmissions } from '@/hooks/useSubmissions';
import { formatFileSize } from '@/lib/file-utils';
import type { Submission, SubmissionStatus } from '@/types/assignments';
import { cn } from '@/lib/utils';

interface SubmissionsListProps {
  assignmentId: string;
  onReview: (submission: Submission) => void;
}

export function SubmissionsList({ assignmentId, onReview }: SubmissionsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('all');
  
  const { data: submissions, isLoading } = useAssignmentSubmissions(assignmentId, {
    submitted: filter
  });

  const filteredSubmissions = submissions?.filter(s => {
    if (!searchTerm) return true;
    const name = s.user?.full_name?.toLowerCase() || '';
    const email = s.user?.email?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (submission: Submission) => {
    if (submission.status === 'reviewed') {
      const resultConfig = {
        approved: { label: 'Aprovada', className: 'bg-primary/10 text-primary border-primary/20' },
        revision: { label: 'Revisar', className: 'bg-accent text-accent-foreground' },
        rejected: { label: 'Não Aprovada', className: 'bg-destructive/10 text-destructive border-destructive/20' },
      };
      const config = submission.review_result ? resultConfig[submission.review_result] : null;
      return config ? (
        <Badge variant="outline" className={config.className}>
          <CheckCircle className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      ) : null;
    }

    if (submission.submitted_at) {
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          <Clock className="h-3 w-3 mr-1" />
          Entregue
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-muted-foreground">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="yes">Entregaram</SelectItem>
            <SelectItem value="no">Não entregaram</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {!filteredSubmissions || filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Entrega</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{submission.user?.full_name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{submission.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(submission)}</TableCell>
                  <TableCell>
                    {submission.submitted_at ? (
                      format(new Date(submission.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.file_url ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-32">
                          {submission.file_name}
                        </span>
                        {submission.file_size && (
                          <span className="text-xs text-muted-foreground">
                            ({formatFileSize(submission.file_size)})
                          </span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(submission.file_url!, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : submission.text_content ? (
                      <span className="text-sm text-muted-foreground">Texto enviado</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.submitted_at && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onReview(submission)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {submission.status === 'reviewed' ? 'Ver' : 'Avaliar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
