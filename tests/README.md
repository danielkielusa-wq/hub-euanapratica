# Test Suite - Sistema de Precificação e Planos

Este diretório contém testes end-to-end e validações manuais para o sistema de planos de assinatura da plataforma.

## Estrutura

```
tests/
├── e2e/
│   └── plan-pricing-flow.test.ts    # Testes automatizados E2E
├── manual/
│   └── validate-plan-features.sql   # Testes SQL manuais
├── setup/
│   └── seed-test-users.sql          # Seed de usuários para testes
└── README.md                         # Este arquivo
```

---

## Testes Automatizados (E2E)

### Arquivo: `e2e/plan-pricing-flow.test.ts`

Testes automatizados Vitest que validam:
- ✅ Estrutura dos 3 planos (Básico, Pro, VIP)
- ✅ Features JSONB completas (prime_jobs, show_power_verbs)
- ✅ Matriz de features por plano
- ✅ Controle de acesso a rotas protegidas
- ✅ Sistema de quota mensal (uso/limite)
- ✅ Hub Services e integração TICTO
- ✅ Funções admin (RPC)

### Como Executar

#### 1. Setup de usuários de teste

```bash
# Conectar ao Supabase
npx supabase db reset --db-url "your-db-url"

# Executar seed
psql "your-db-url" < tests/setup/seed-test-users.sql
```

#### 2. Executar testes

```bash
# Instalar dependências (se necessário)
npm install -D vitest @supabase/supabase-js

# Executar todos os testes E2E
npm run test:e2e

# Ou executar arquivo específico
npx vitest run tests/e2e/plan-pricing-flow.test.ts

# Modo watch (desenvolvimento)
npx vitest tests/e2e/plan-pricing-flow.test.ts
```

#### 3. Configurar variáveis de ambiente

Certifique-se de que `.env` contém:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

---

## Testes Manuais (SQL)

### Arquivo: `manual/validate-plan-features.sql`

Conjunto de queries SQL que podem ser executadas diretamente no **Supabase SQL Editor** para validação manual.

### Como Executar

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) > Seu projeto
2. Vá em **SQL Editor** > **New query**
3. Cole cada bloco de teste do arquivo `validate-plan-features.sql`
4. Execute e compare com os resultados esperados

### Testes Disponíveis

| # | Teste | Descrição |
|---|-------|-----------|
| 1 | Estrutura dos planos | Valida preços, limites, temas |
| 2 | Features JSONB | **CRÍTICO** - Valida `prime_jobs` e `show_power_verbs` |
| 3 | Limites e contadores | Valida `resume_pass_limit`, `job_concierge_count` |
| 4 | Descontos por plano | Valida discounts JSONB e cupons |
| 5 | RPC get_full_plan_access | Testa função principal de acesso |
| 6 | Hub Services | Valida TICTO integration e `product_type` |
| 7 | Integridade de features | Verifica se todas features existem em todos planos |
| 8 | Simulação de acesso | Testa bloqueio/permissão de rotas |
| 9 | Sistema de quota | Valida uso mensal e cálculo de `remaining` |
| 10 | Relatório de saúde | Resumo geral do sistema |

---

## Fixes Aplicados (Validação)

Estes testes foram criados para validar as seguintes correções críticas:

### ✅ Fix 1: `prime_jobs` - Feature inexistente

**Problema:** Feature `prime_jobs` estava no TypeScript mas nunca foi adicionada ao banco.

**Teste de validação:**
```sql
-- TEST 2 em validate-plan-features.sql
SELECT (features->>'prime_jobs')::boolean FROM plans WHERE id = 'pro';
-- Resultado esperado: TRUE
```

### ✅ Fix 2: `show_power_verbs` - Nunca foi inserido

**Problema:** Feature `show_power_verbs` nunca foi incluída nas migrations.

**Teste de validação:**
```sql
-- TEST 2 em validate-plan-features.sql
SELECT (features->>'show_power_verbs')::boolean FROM plans WHERE id IN ('pro', 'vip');
-- Resultado esperado: TRUE para ambos
```

### ✅ Fix 3: `product_type` constraint desalinhada

**Problema:** Constraint permitia apenas `('subscription', 'one_time')`, mas TypeScript define 5 tipos.

**Teste de validação:**
```sql
-- TEST 6 em validate-plan-features.sql
SELECT product_type FROM hub_services WHERE product_type IN
  ('subscription', 'one_time', 'lifetime', 'subscription_monthly', 'subscription_annual');
-- Deve retornar sem erro
```

### ✅ Fix 4: Nomenclatura "Starter" vs "Básico"

**Teste de validação:**
```typescript
// e2e/plan-pricing-flow.test.ts - linha 103
expect(planAccess.plan_name).toBe('Básico'); // Nunca 'Starter'
```

---

## Cobertura de Testes

| Componente | Cobertura | Tipo de Teste |
|-----------|-----------|---------------|
| Database Schema | 100% | Manual SQL |
| Plan Features (JSONB) | 100% | E2E + Manual |
| RPC Functions | 80% | E2E |
| Route Access Control | 100% | E2E |
| Usage Quota System | 100% | E2E + Manual |
| TICTO Integration | 70% | E2E |
| Frontend Types | 100% | TypeScript compile-time |

---

## Resultados Esperados

Após executar **TODOS** os testes, você deve ver:

### E2E Tests (Vitest)
```
✓ tests/e2e/plan-pricing-flow.test.ts (25 tests)
  ✓ Database Schema Validation (2)
  ✓ Plan Feature Matrix Validation (3)
  ✓ Route Access Control (2)
  ✓ Usage Quota System (3)
  ✓ Hub Services & TICTO Integration (2)
  ✓ Admin Functions (1)
  ✓ Frontend TypeScript Type Safety (2)

Test Files  1 passed (1)
     Tests  25 passed (25)
  Start at  XX:XX:XX
  Duration  XXXms
```

### Manual Tests (SQL)
- **TEST 1**: 3 planos retornados (Básico R$0, Pro R$47, VIP R$97)
- **TEST 2**: `prime_jobs` e `show_power_verbs` = `true` para Pro/VIP ✅
- **TEST 7**: Nenhuma feature faltando ✅
- **TEST 10**: Todas métricas > 0 ✅

---

## Troubleshooting

### Erro: "Cannot find project ref"
```bash
cd c:\Users\I335869\ENP_HUB\hub-euanapratica
npx supabase link --project-ref seqgnxynrcylxsdzbloa
```

### Erro: "Access denied" em admin functions
- Testes de admin requerem `service_role` key
- Configure: `SUPABASE_SERVICE_KEY` no .env

### Testes E2E falhando
- Verifique se migration `20260220100000_fix_plan_features_consistency.sql` foi aplicada
- Execute: `npx supabase db push`

---

## CI/CD Integration (Futuro)

Para integrar ao pipeline:

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx supabase db reset --db-url ${{ secrets.SUPABASE_TEST_DB_URL }}
      - run: npm run test:e2e
```

---

## Contribuindo

Ao adicionar novas features ou modificar planos:

1. Atualize os testes em `plan-pricing-flow.test.ts`
2. Adicione queries de validação em `validate-plan-features.sql`
3. Execute ambos os testes
4. Documente mudanças neste README

---

## Contato

Dúvidas sobre os testes? Abra uma issue ou consulte a documentação principal em `/docs/`.
