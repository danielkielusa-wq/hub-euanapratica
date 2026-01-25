import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useE2EResults } from '@/hooks/useE2ETests';
import { E2ETestResult, E2ETestStatus } from '@/types/e2e';
import { cn } from '@/lib/utils';

interface E2EResultsTableProps {
  runId?: string;
}

function TestStatusBadge({ status }: { status: E2ETestStatus }) {
  const config = {
    passed: { variant: 'default' as const, label: 'Passou', icon: CheckCircle, className: 'bg-green-600 hover:bg-green-700' },
    failed: { variant: 'destructive' as const, label: 'Falhou', icon: XCircle, className: '' },
    pending: { variant: 'secondary' as const, label: 'Pendente', icon: Clock, className: '' },
    skipped: { variant: 'outline' as const, label: 'Pulado', icon: Clock, className: '' }
  };

  const { variant, label, icon: Icon, className } = config[status] || config.pending;

  return (
    <Badge variant={variant} className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

interface TestLogsModalProps {
  test: E2ETestResult | null;
  open: boolean;
  onClose: () => void;
}

function TestLogsModal({ test, open, onClose }: TestLogsModalProps) {
  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{test.test_code}</span>
            {test.test_name}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <TestStatusBadge status={test.status} />
              {test.duration_ms && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {test.duration_ms}ms
                </span>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-1">Suite</h4>
              <p className="text-sm text-muted-foreground">{test.suite}</p>
            </div>

            {test.objective && (
              <div>
                <h4 className="font-medium mb-1">Objetivo</h4>
                <p className="text-sm text-muted-foreground">{test.objective}</p>
              </div>
            )}

            {test.expected_result && (
              <div>
                <h4 className="font-medium mb-1">Resultado Esperado</h4>
                <p className="text-sm text-muted-foreground">{test.expected_result}</p>
              </div>
            )}

            {test.related_url && (
              <div>
                <h4 className="font-medium mb-1">Rota Relacionada</h4>
                <code className="text-sm bg-muted px-2 py-1 rounded flex items-center gap-2 w-fit">
                  {test.related_url}
                  <ExternalLink className="h-3 w-3" />
                </code>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-1">Log</h4>
              <pre className={cn(
                "text-sm p-3 rounded-lg overflow-x-auto",
                test.status === 'failed' ? "bg-destructive/10 text-destructive" : "bg-muted"
              )}>
                {test.log_summary || 'Nenhum log disponível'}
              </pre>
            </div>

            {test.log_raw && (
              <div>
                <h4 className="font-medium mb-1">Log Completo</h4>
                <pre className="text-xs p-3 bg-muted rounded-lg overflow-x-auto max-h-48">
                  {test.log_raw}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function E2EResultsTable({ runId }: E2EResultsTableProps) {
  const { data: results, isLoading } = useE2EResults(runId);
  const [selectedTest, setSelectedTest] = useState<E2ETestResult | null>(null);

  if (!runId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Execute uma suíte de testes para ver os resultados.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando resultados...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados Detalhados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Suite</TableHead>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Nome do Teste</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Duração</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results?.map((result) => (
                <TableRow 
                  key={result.id}
                  className={cn(
                    result.status === 'failed' && 'bg-destructive/5',
                    result.status === 'passed' && 'bg-green-500/5'
                  )}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {result.suite}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {result.test_code}
                  </TableCell>
                  <TableCell>{result.test_name}</TableCell>
                  <TableCell>
                    <TestStatusBadge status={result.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {result.duration_ms}ms
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTest(result)}
                    >
                      Ver logs
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!results || results.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TestLogsModal 
          test={selectedTest} 
          open={!!selectedTest}
          onClose={() => setSelectedTest(null)}
        />
      </CardContent>
    </Card>
  );
}
