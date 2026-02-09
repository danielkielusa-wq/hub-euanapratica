import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Download, ExternalLink, Eye, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LeadReportModal } from './LeadReportModal';
import type { CareerEvaluation } from '@/types/leads';

export function LeadsTable() {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<CareerEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<CareerEvaluation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    
    const { data, error } = await supabase.functions.invoke('format-lead-report', {
      body: { evaluationId: id, forceRefresh: true }
    });
    
    if (error) {
      toast({ 
        title: 'Erro ao regenerar', 
        description: error.message, 
        variant: 'destructive' 
      });
    } else if (data?.content) {
      setEvaluations(prev => prev.map(e => 
        e.id === id 
          ? { 
              ...e, 
              formatted_report: JSON.stringify(data.content), 
              formatted_at: new Date().toISOString() 
            }
          : e
      ));
      toast({ 
        title: 'RelatÃ³rio regenerado!', 
        description: 'O relatÃ³rio foi atualizado com sucesso.' 
      });
    }
    
    setRefreshingId(null);
  };

  const handleViewReport = (evaluation: CareerEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsModalOpen(true);
  };

  const downloadCSV = () => {
    // Headers no mesmo formato do input + URL
    const headers = [
      'Nome', 'email', 'telefone', 'Area', 'AtuaÃ§Ã£o', 
      'trabalha internacional', 'experiencia', 'Englishlevel',
      'objetivo', 'VisaStatus', 'timeline', 'FamilyStatus',
      'incomerange', 'investment range', 'impediment', 
      'impedmentother', 'main concern', 'relatorio', 'URL RelatÃ³rio'
    ];
    
    // Deduplicar por email, mantendo mais recente (jÃ¡ ordenado por created_at desc)
    const uniqueByEmail = new Map<string, CareerEvaluation>();
    evaluations.forEach(e => {
      const key = (e.email || '').trim().toLowerCase();
      if (key && !uniqueByEmail.has(key)) {
        uniqueByEmail.set(key, e);
      }
    });
    const dedupedEvaluations = Array.from(uniqueByEmail.values());
    
    const rows = dedupedEvaluations.map(e => [
      e.name,
      e.email,
      e.phone || '',
      e.area || '',
      e.atuacao || '',
      e.trabalha_internacional ? 'Sim' : 'NÃ£o',
      e.experiencia || '',
      e.english_level || '',
      e.objetivo || '',
      e.visa_status || '',
      e.timeline || '',
      e.family_status || '',
      e.income_range || '',
      e.investment_range || '',
      e.impediment || '',
      e.impediment_other || '',
      e.main_concern || '',
      e.report_content || '',
      `${window.location.origin}/report/${e.access_token}`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Adicionar BOM UTF-8 para Excel interpretar corretamente
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads-exportados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    const duplicatesRemoved = evaluations.length - dedupedEvaluations.length;
    toast({ 
      title: 'CSV exportado!', 
      description: duplicatesRemoved > 0 
        ? `${dedupedEvaluations.length} leads Ãºnicos exportados (${duplicatesRemoved} duplicatas removidas).`
        : `${dedupedEvaluations.length} leads exportados.`
    });
  };

  const dedupedEvaluations = (() => {
    const uniqueByEmail = new Map<string, CareerEvaluation>();
    evaluations.forEach(e => {
      const key = (e.email || '').trim().toLowerCase();
      if (key && !uniqueByEmail.has(key)) {
        uniqueByEmail.set(key, e);
      }
    });
    return Array.from(uniqueByEmail.values());
  })();

  const copyReportUrl = (token: string) => {
    const url = `${window.location.origin}/report/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado!', description: 'O link do relatÃ³rio foi copiado para a Ã¡rea de transferÃªncia.' });
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
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{dedupedEvaluations.length} leads encontrados</p>
        <Button variant="outline" onClick={downloadCSV} className="gap-2 rounded-[12px]">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>
      <div className="rounded-[16px] border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ãrea</TableHead>
              <TableHead>InglÃªs</TableHead>
              <TableHead>Formatado</TableHead>
              <TableHead>Acessos</TableHead>
              <TableHead>Importado em</TableHead>
              <TableHead className="w-[140px]">AÃ§Ãµes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dedupedEvaluations.map((evaluation) => (
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
                  <Badge variant={evaluation.formatted_report ? 'default' : 'secondary'}>
                    {evaluation.formatted_report ? 'Sim' : 'NÃ£o'}
                  </Badge>
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
                      onClick={() => handleViewReport(evaluation)}
                      title="Ver relatÃ³rio"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRefresh(evaluation.id)}
                      disabled={refreshingId === evaluation.id}
                      title="Regenerar relatÃ³rio"
                    >
                      <RefreshCw className={cn("w-4 h-4", refreshingId === evaluation.id && "animate-spin")} />
                    </Button>
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
                      title="Abrir relatÃ³rio"
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

      <LeadReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        evaluation={selectedEvaluation}
      />
    </>
  );
}
