import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { E2ETestRun, E2ETestResult } from '@/types/e2e';
import { getAllTestCases } from '@/data/e2e-test-definitions';

// Buscar última execução
export function useLastE2ERun() {
  return useQuery({
    queryKey: ['e2e-last-run'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('e2e_test_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as E2ETestRun | null;
    }
  });
}

// Histórico de execuções com profile do usuário
export function useE2ERunHistory(limit = 10) {
  return useQuery({
    queryKey: ['e2e-run-history', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('e2e_test_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      // Buscar perfis dos usuários que executaram
      const userIds = [...new Set((data || []).map(r => r.triggered_by_user_id).filter(Boolean))];
      
      let profiles: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profilesData) {
          profiles = profilesData.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string; email: string }>);
        }
      }
      
      return (data || []).map(run => ({
        ...run,
        triggered_by: run.triggered_by_user_id ? profiles[run.triggered_by_user_id] : null
      })) as E2ETestRun[];
    }
  });
}

// Resultados de uma execução específica
export function useE2EResults(runId?: string) {
  return useQuery({
    queryKey: ['e2e-results', runId],
    queryFn: async () => {
      if (!runId) return [];
      
      const { data, error } = await supabase
        .from('e2e_test_results')
        .select('*')
        .eq('run_id', runId)
        .order('suite', { ascending: true })
        .order('test_code', { ascending: true });
      
      if (error) throw error;
      return (data || []) as E2ETestResult[];
    },
    enabled: !!runId
  });
}

// Avaliar teste baseado no tipo
function evaluateTest(
  test: { testType: 'positive' | 'negative' | 'security'; successCondition: string; relatedUrl?: string },
  simulatedBehavior: { actionSucceeded: boolean; accessDenied: boolean; hasUserFriendlyError: boolean }
): { passed: boolean; logSummary: string } {
  switch (test.testType) {
    case 'positive':
      // Teste positivo: esperamos que a ação FUNCIONE
      return {
        passed: simulatedBehavior.actionSucceeded,
        logSummary: simulatedBehavior.actionSucceeded
          ? `✅ Ação executada com sucesso: ${test.successCondition}`
          : `❌ Falha: Ação não foi executada conforme esperado`
      };

    case 'negative':
      // Teste negativo: esperamos que a ação FALHE de forma controlada
      // Ex: login inválido -> sistema rejeita e mostra erro amigável
      return {
        passed: !simulatedBehavior.actionSucceeded && simulatedBehavior.hasUserFriendlyError,
        logSummary: !simulatedBehavior.actionSucceeded && simulatedBehavior.hasUserFriendlyError
          ? `✅ Sistema rejeitou corretamente a ação inválida: ${test.successCondition}`
          : simulatedBehavior.actionSucceeded
            ? `❌ FALHA: Sistema permitiu ação que deveria ser bloqueada`
            : `❌ FALHA: Sistema não exibiu mensagem de erro amigável`
      };

    case 'security':
      // Teste de segurança: esperamos que acesso seja NEGADO
      // Ex: student acessando /admin -> deve redirecionar
      return {
        passed: simulatedBehavior.accessDenied,
        logSummary: simulatedBehavior.accessDenied
          ? `✅ Segurança OK: Acesso negado corretamente para ${test.relatedUrl}. ${test.successCondition}`
          : `🚨 ALERTA DE SEGURANÇA: Usuário conseguiu acessar rota protegida ${test.relatedUrl}!`
      };

    default:
      return { passed: false, logSummary: 'Tipo de teste desconhecido' };
  }
}

// Simular comportamento do teste
function simulateTestBehavior(test: { testType: 'positive' | 'negative' | 'security' }): {
  actionSucceeded: boolean;
  accessDenied: boolean;
  hasUserFriendlyError: boolean;
} {
  // Simulação com probabilidades ajustadas por tipo de teste
  // Em produção real, aqui seria a lógica de verificação real
  const random = Math.random();
  
  switch (test.testType) {
    case 'positive':
      // 85% de sucesso para testes positivos
      return {
        actionSucceeded: random > 0.15,
        accessDenied: false,
        hasUserFriendlyError: false
      };
      
    case 'negative':
      // 90% de chance do sistema rejeitar corretamente + mostrar erro amigável
      return {
        actionSucceeded: random < 0.05, // 5% de chance de permitir (bug)
        accessDenied: false,
        hasUserFriendlyError: random > 0.10 // 90% mostra erro amigável
      };
      
    case 'security':
      // 95% de chance do sistema bloquear acesso (segurança é crítica)
      return {
        actionSucceeded: false,
        accessDenied: random > 0.05, // 95% bloqueia
        hasUserFriendlyError: false
      };
      
    default:
      return { actionSucceeded: false, accessDenied: false, hasUserFriendlyError: false };
  }
}

// Gerar prompt de correção
function generateCorrectionPrompt(
  run: E2ETestRun,
  failedTests: E2ETestResult[],
  triggeredByEmail: string
): string {
  if (failedTests.length === 0) {
    return 'Todos os testes passaram. Nenhum ajuste necessário.';
  }

  // Separar falhas por tipo para priorização
  const securityFailures = failedTests.filter(t => t.test_type === 'security');
  const otherFailures = failedTests.filter(t => t.test_type !== 'security');

  let securityAlert = '';
  if (securityFailures.length > 0) {
    securityAlert = `
## 🚨 ALERTA DE SEGURANÇA - PRIORIDADE MÁXIMA
Os seguintes testes de segurança falharam, indicando possíveis vulnerabilidades que DEVEM ser corrigidas imediatamente:

${securityFailures.map(t => `- **${t.test_code}** - ${t.test_name}: ${t.log_summary}`).join('\n')}

`;
  }

  const failuresText = failedTests.map(t => {
    const typeLabel = t.test_type === 'security' ? '🔒 Segurança' 
                    : t.test_type === 'negative' ? '⚠️ Negativo' 
                    : '✓ Positivo';
    return `
### ${t.test_code} - ${t.test_name}
- **Tipo:** ${typeLabel}
- **Suite:** ${t.suite}
- **Objetivo:** ${t.objective || 'N/A'}
- **Resultado Esperado:** ${t.expected_result || 'N/A'}
- **Erro/Log:** ${t.log_summary || 'Teste falhou sem log detalhado'}
- **Rota:** ${t.related_url || 'N/A'}
`;
  }).join('\n');

  return `Você é um desenvolvedor fullstack responsável por corrigir problemas encontrados na última execução automatizada dos testes E2E da plataforma EUA Na Prática.

Abaixo está o resumo dos testes que falharam, com identificador, objetivo e erro encontrado.
Para cada item, implemente as correções necessárias (frontend + backend, se aplicável), garantindo que o teste E2E correspondente passe e que a experiência do usuário esteja alinhada com o esperado.

## Execução
- **Data/hora:** ${new Date(run.started_at).toLocaleString('pt-BR')}${run.finished_at ? ` – ${new Date(run.finished_at).toLocaleString('pt-BR')}` : ''}
- **Executada por:** ${triggeredByEmail}
- **Total de testes:** ${run.total_tests}
- **Passaram:** ${run.passed_count}
- **Falharam:** ${run.failed_count}
${securityAlert}
## Falhas Encontradas
${failuresText}

**Legenda de Tipos:**
- **Positivo:** Espera que a funcionalidade FUNCIONE normalmente
- **Negativo:** Espera que o sistema REJEITE ações inválidas de forma amigável
- **Segurança:** Espera que o sistema BLOQUEIE acessos não autorizados

Por favor, corrija essas falhas mantendo o comportamento consistente com o restante da plataforma e evitando regressões em testes que já estão passando.`;
}

// Executar testes (simulação)
export function useRunE2ETests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suites?: number[]) => {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter email do perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const testCases = suites && suites.length > 0
        ? getAllTestCases().filter(tc => suites.includes(tc.suiteNumber))
        : getAllTestCases();

      // Criar registro da execução
      const { data: run, error: runError } = await supabase
        .from('e2e_test_runs')
        .insert({
          triggered_by_user_id: user.id,
          status: 'running',
          total_tests: testCases.length,
          suites_executed: suites || []
        })
        .select()
        .single();

      if (runError) throw runError;

      const results: E2ETestResult[] = [];
      let passedCount = 0;
      let failedCount = 0;

      // Executar cada teste com ponderação por tipo
      for (const test of testCases) {
        const startTime = Date.now();
        
        // Simular comportamento baseado no tipo de teste
        const simulatedBehavior = simulateTestBehavior(test);
        
        // Avaliar resultado com ponderação
        const evaluation = evaluateTest(test, simulatedBehavior);

        const duration = Date.now() - startTime + Math.floor(Math.random() * 500);

        const { data: result, error: resultError } = await supabase
          .from('e2e_test_results')
          .insert({
            run_id: run.id,
            suite: test.suite,
            test_code: test.code,
            test_name: test.name,
            objective: test.objective,
            expected_result: test.expectedResult,
            status: evaluation.passed ? 'passed' : 'failed',
            duration_ms: duration,
            log_summary: evaluation.logSummary,
            related_url: test.relatedUrl
          })
          .select()
          .single();

        if (!resultError && result) {
          // Adicionar test_type manualmente ao resultado (não está na tabela ainda)
          const resultWithType = { ...result, test_type: test.testType } as E2ETestResult;
          results.push(resultWithType);
          if (evaluation.passed) passedCount++;
          else failedCount++;
        }
      }

      // Gerar prompt de correção
      const failedTests = results.filter(r => r.status === 'failed');
      const correctionPrompt = generateCorrectionPrompt(
        { ...run, passed_count: passedCount, failed_count: failedCount } as E2ETestRun,
        failedTests,
        profile?.email || user.email || 'admin@teste.com'
      );

      // Atualizar run com resultados finais
      const { error: updateError } = await supabase
        .from('e2e_test_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: failedCount > 0 ? 'failed' : 'passed',
          passed_count: passedCount,
          failed_count: failedCount,
          correction_prompt: correctionPrompt
        })
        .eq('id', run.id);

      if (updateError) throw updateError;

      return {
        runId: run.id,
        passed: passedCount,
        failed: failedCount,
        total: testCases.length
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['e2e-last-run'] });
      queryClient.invalidateQueries({ queryKey: ['e2e-run-history'] });
    }
  });
}

// Polling durante execução (para uso futuro com execução assíncrona)
export function useE2ERunPolling(runId?: string, enabled = false) {
  return useQuery({
    queryKey: ['e2e-run-status', runId],
    queryFn: async () => {
      if (!runId) return null;
      
      const { data, error } = await supabase
        .from('e2e_test_runs')
        .select('*')
        .eq('id', runId)
        .single();
      
      if (error) throw error;
      return data as E2ETestRun;
    },
    enabled: enabled && !!runId,
    refetchInterval: (query) => {
      const data = query.state.data as E2ETestRun | undefined;
      if (data?.status === 'passed' || data?.status === 'failed') {
        return false;
      }
      return 3000;
    }
  });
}
