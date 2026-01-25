import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { E2ETestRun } from '@/types/e2e';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface E2ERunSummaryProps {
  run: E2ETestRun | null;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: E2ETestRun['status'] }) {
  const variants: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
    started: { variant: 'secondary', label: 'Iniciando...' },
    running: { variant: 'secondary', label: 'Em andamento' },
    passed: { variant: 'default', label: 'Sucesso' },
    failed: { variant: 'destructive', label: 'Falhou' },
    cancelled: { variant: 'outline', label: 'Cancelado' }
  };

  const config = variants[status] || variants.started;

  return (
    <Badge variant={config.variant} className="ml-2">
      {status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
      {status === 'passed' && <CheckCircle className="h-3 w-3 mr-1" />}
      {status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  variant?: 'default' | 'success' | 'destructive';
}

function StatCard({ title, value, icon: Icon, variant = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    destructive: 'text-destructive'
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className={`h-5 w-5 ${colorClasses[variant]}`} />
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-xl font-bold ${colorClasses[variant]}`}>{value}</p>
      </div>
    </div>
  );
}

function formatDuration(run: E2ETestRun): string {
  if (!run.finished_at) return 'Em andamento...';
  
  const start = new Date(run.started_at).getTime();
  const end = new Date(run.finished_at).getTime();
  const durationMs = end - start;
  
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${Math.floor(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`;
}

export function E2ERunSummary({ run, isLoading }: E2ERunSummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Carregando última execução...
        </CardContent>
      </Card>
    );
  }

  if (!run) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma execução encontrada.</p>
          <p className="text-sm">Clique em "Rodar Suíte Completa" para iniciar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          Última Execução
          <StatusBadge status={run.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="Total" value={run.total_tests} icon={FileText} />
          <StatCard title="Passaram" value={run.passed_count} icon={CheckCircle} variant="success" />
          <StatCard title="Falharam" value={run.failed_count} icon={XCircle} variant="destructive" />
          <StatCard title="Duração" value={formatDuration(run)} icon={Clock} />
        </div>
        <div className="text-sm text-muted-foreground">
          Iniciado em: {format(new Date(run.started_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
          {run.finished_at && (
            <span> • Finalizado em: {format(new Date(run.finished_at), "HH:mm:ss", { locale: ptBR })}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
