import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Play, Loader2, FlaskConical, ChevronDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useLastE2ERun, useE2ERunHistory, useRunE2ETests } from '@/hooks/useE2ETests';
import { E2ERunSummary } from '@/components/admin/e2e/E2ERunSummary';
import { E2EResultsTable } from '@/components/admin/e2e/E2EResultsTable';
import { CorrectionPromptBlock } from '@/components/admin/e2e/CorrectionPromptBlock';
import { E2ERunHistory } from '@/components/admin/e2e/E2ERunHistory';
import { E2E_TEST_SUITES } from '@/data/e2e-test-definitions';

export default function AdminE2ETests() {
  const { data: lastRun, isLoading: loadingLastRun } = useLastE2ERun();
  const { data: history, isLoading: loadingHistory } = useE2ERunHistory(10);
  const runTestsMutation = useRunE2ETests();
  
  const [selectedSuites, setSelectedSuites] = useState<number[]>([]);
  const [showSuiteSelector, setShowSuiteSelector] = useState(false);

  const handleRunAllTests = async () => {
    try {
      const result = await runTestsMutation.mutateAsync(undefined);
      if (result.failed > 0) {
        toast.warning(`Execução concluída: ${result.passed} passaram, ${result.failed} falharam`);
      } else {
        toast.success(`Todos os ${result.total} testes passaram!`);
      }
    } catch (error) {
      toast.error('Erro ao executar testes');
    }
  };

  const handleRunSelectedSuites = async () => {
    if (selectedSuites.length === 0) {
      toast.error('Selecione pelo menos uma suite');
      return;
    }
    try {
      const result = await runTestsMutation.mutateAsync(selectedSuites);
      if (result.failed > 0) {
        toast.warning(`Execução concluída: ${result.passed} passaram, ${result.failed} falharam`);
      } else {
        toast.success(`Todos os ${result.total} testes passaram!`);
      }
    } catch (error) {
      toast.error('Erro ao executar testes');
    }
  };

  const toggleSuite = (suiteNumber: number) => {
    setSelectedSuites(prev => 
      prev.includes(suiteNumber)
        ? prev.filter(n => n !== suiteNumber)
        : [...prev, suiteNumber]
    );
  };

  const isRunning = runTestsMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FlaskConical className="h-8 w-8" />
              Testes E2E
            </h1>
            <p className="text-muted-foreground mt-1">
              Execute e monitore os testes automatizados da plataforma
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleRunAllTests}
              disabled={isRunning}
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Rodar Suíte Completa
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Seletor de Suites (opcional) */}
        <Collapsible open={showSuiteSelector} onOpenChange={setShowSuiteSelector}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    Rodar Suites Selecionadas
                    {selectedSuites.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground">
                        ({selectedSuites.length} selecionadas)
                      </span>
                    )}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showSuiteSelector ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {E2E_TEST_SUITES.map(suite => (
                    <label
                      key={suite.number}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedSuites.includes(suite.number)}
                        onCheckedChange={() => toggleSuite(suite.number)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{suite.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {suite.tests.length} testes
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <Button
                  onClick={handleRunSelectedSuites}
                  disabled={isRunning || selectedSuites.length === 0}
                  variant="secondary"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Rodar {selectedSuites.length} Suite(s)
                    </>
                  )}
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Resumo da Última Execução */}
        <E2ERunSummary run={lastRun || null} isLoading={loadingLastRun} />

        {/* Tabela de Resultados */}
        <E2EResultsTable runId={lastRun?.id} />

        {/* Prompt de Correções (se houver falhas) */}
        {lastRun?.status === 'failed' && lastRun.correction_prompt && (
          <CorrectionPromptBlock prompt={lastRun.correction_prompt} />
        )}

        {/* Mensagem de Sucesso */}
        {lastRun?.status === 'passed' && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="py-6 flex items-center justify-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <p className="text-green-700 dark:text-green-400 font-medium">
                Todos os testes passaram! Nenhum ajuste necessário.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        <E2ERunHistory runs={history} isLoading={loadingHistory} />
      </div>
    </DashboardLayout>
  );
}
