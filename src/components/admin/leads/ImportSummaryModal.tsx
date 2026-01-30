import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Users, FileText, AlertTriangle } from 'lucide-react';
import type { ImportResult } from '@/types/leads';

interface ImportSummaryModalProps {
  result: ImportResult | null;
  open: boolean;
  onClose: () => void;
}

export function ImportSummaryModal({ result, open, onClose }: ImportSummaryModalProps) {
  if (!result) return null;

  const successCount = result.newUsersCreated + result.reportsLinkedToExisting;
  const hasErrors = result.errors.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
            Resultado da Importação
          </DialogTitle>
          <DialogDescription>
            {successCount} de {result.totalRows} leads processados com sucesso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-[16px]">
              <FileText className="w-6 h-6 text-muted-foreground mb-2" />
              <span className="text-2xl font-bold">{result.totalRows}</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-950/20 rounded-[16px]">
              <Users className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-2xl font-bold text-green-600">{result.newUsersCreated}</span>
              <span className="text-xs text-muted-foreground">Novos usuários</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-[16px]">
              <CheckCircle2 className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-2xl font-bold text-blue-600">{result.reportsLinkedToExisting}</span>
              <span className="text-xs text-muted-foreground">Vinculados</span>
            </div>
          </div>

          {/* Errors List */}
          {hasErrors && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" />
                Erros ({result.errors.length})
              </h4>
              <ScrollArea className="h-[150px] rounded-[12px] border p-3">
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm flex gap-2">
                      <span className="font-mono text-muted-foreground">Linha {error.row}:</span>
                      <span className="text-destructive">{error.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} className="rounded-[12px]">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
