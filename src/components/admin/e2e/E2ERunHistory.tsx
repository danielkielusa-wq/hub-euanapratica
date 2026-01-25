import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, XCircle, History } from 'lucide-react';
import { E2ETestRun } from '@/types/e2e';
import { useE2EResults } from '@/hooks/useE2ETests';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { E2EResultsTable } from './E2EResultsTable';
import { CorrectionPromptBlock } from './CorrectionPromptBlock';

interface E2ERunHistoryProps {
  runs?: E2ETestRun[];
  isLoading?: boolean;
}

interface RunDetailsModalProps {
  run: E2ETestRun | null;
  open: boolean;
  onClose: () => void;
}

function RunDetailsModal({ run, open, onClose }: RunDetailsModalProps) {
  if (!run) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Execução de {format(new Date(run.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            <Badge variant={run.status === 'passed' ? 'default' : 'destructive'}>
              {run.status === 'passed' ? 'Sucesso' : 'Falhou'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{run.total_tests}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{run.passed_count}</p>
                <p className="text-sm text-muted-foreground">Passaram</p>
              </div>
              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{run.failed_count}</p>
                <p className="text-sm text-muted-foreground">Falharam</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{run.skipped_count}</p>
                <p className="text-sm text-muted-foreground">Pulados</p>
              </div>
            </div>

            <E2EResultsTable runId={run.id} />
            
            {run.status === 'failed' && run.correction_prompt && (
              <CorrectionPromptBlock prompt={run.correction_prompt} />
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function E2ERunHistory({ runs, isLoading }: E2ERunHistoryProps) {
  const [selectedRun, setSelectedRun] = useState<E2ETestRun | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRuns = runs?.filter(run => 
    statusFilter === 'all' || run.status === statusFilter
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando histórico...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Execuções
        </CardTitle>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="passed">Apenas sucessos</SelectItem>
            <SelectItem value="failed">Apenas falhas</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {(!filteredRuns || filteredRuns.length === 0) ? (
          <div className="py-8 text-center text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma execução no histórico.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Executado por</TableHead>
                  <TableHead>Suites</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      {format(new Date(run.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.triggered_by?.full_name || run.triggered_by?.email || 'Desconhecido'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {Array.isArray(run.suites_executed) && run.suites_executed.length > 0
                        ? `Suites ${run.suites_executed.join(', ')}`
                        : 'Todas'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {run.status === 'passed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-green-600">{run.passed_count}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-destructive">{run.failed_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedRun(run)}
                      >
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <RunDetailsModal 
          run={selectedRun} 
          open={!!selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      </CardContent>
    </Card>
  );
}
