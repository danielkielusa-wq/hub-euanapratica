import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CareerEvaluation } from '@/types/leads';

export function LeadsTable() {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<CareerEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('career_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setEvaluations(data as CareerEvaluation[] || []);
    }
    setIsLoading(false);
  };

  const copyReportUrl = (token: string) => {
    const url = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: 'O link do relatório foi copiado para a área de transferência.' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
        ))}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum lead importado ainda
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Área</TableHead>
            <TableHead>Inglês</TableHead>
            <TableHead>Acessos</TableHead>
            <TableHead>Importado em</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <TableRow key={evaluation.id}>
              <TableCell className="font-medium">{evaluation.name}</TableCell>
              <TableCell className="text-muted-foreground">{evaluation.email}</TableCell>
              <TableCell>{evaluation.area || '-'}</TableCell>
              <TableCell>
                {evaluation.english_level && (
                  <Badge variant="outline">{evaluation.english_level}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={evaluation.access_count > 0 ? 'default' : 'secondary'}>
                  {evaluation.access_count}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(evaluation.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyReportUrl(evaluation.access_token)}
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.open(`/report/${evaluation.access_token}`, '_blank')}
                    title="Abrir relatório"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
