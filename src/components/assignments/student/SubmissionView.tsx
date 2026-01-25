import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Clock, FileCheck } from 'lucide-react';
import { formatFileSize } from '@/lib/file-utils';
import type { Submission } from '@/types/assignments';

interface SubmissionViewProps {
  submission: Submission;
}

export function SubmissionView({ submission }: SubmissionViewProps) {
  const handleDownload = () => {
    if (submission.file_url) {
      window.open(submission.file_url, '_blank');
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Sua Entrega
          </CardTitle>
          {submission.submitted_at && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Enviado em {format(new Date(submission.submitted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File submission */}
        {submission.file_url && submission.file_name && (
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{submission.file_name}</p>
                {submission.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(submission.file_size)}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>
        )}

        {/* Text submission */}
        {submission.text_content && (
          <div className="p-4 bg-background rounded-lg border">
            <p className="text-sm font-medium mb-2">Texto da entrega:</p>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{submission.text_content}</p>
            </div>
          </div>
        )}

        {/* Draft indicator */}
        {submission.status === 'draft' && submission.draft_saved_at && (
          <p className="text-xs text-muted-foreground">
            Rascunho salvo em {format(new Date(submission.draft_saved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
