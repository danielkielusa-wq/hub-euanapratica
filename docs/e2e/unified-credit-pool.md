# Pool Unificado de Créditos — Documentação de Testes E2E

> **Escopo:** Sistema de créditos mensais unificados (ResumePass AI + Title Translator + Prime Jobs)
> **Migração:** `20260302500000_unified_credit_pool.sql`
> **Última atualização:** 2026-03-01

---

## Índice

1. [Pré-requisitos e Setup](#1-pré-requisitos-e-setup)
2. [TC-01 — RPC: Validar get_unified_credits](#tc-01--rpc-validar-get_unified_credits)
3. [TC-02 — ResumePass AI: Consumo de 3 créditos](#tc-02--resumepass-ai-consumo-de-3-créditos)
4. [TC-03 — ResumePass AI: Bloqueio por créditos insuficientes](#tc-03--resumepass-ai-bloqueio-por-créditos-insuficientes)
5. [TC-04 — Title Translator: Consumo de 1 crédito](#tc-04--title-translator-consumo-de-1-crédito)
6. [TC-05 — Prime Jobs: Consumo de 1 crédito](#tc-05--prime-jobs-consumo-de-1-crédito)
7. [TC-06 — Pool compartilhado: Esgotamento cruzado entre apps](#tc-06--pool-compartilhado-esgotamento-cruzado-entre-apps)
8. [TC-07 — Plano VIP: Créditos ilimitados (999)](#tc-07--plano-vip-créditos-ilimitados-999)
9. [TC-08 — Prime Jobs: Flag de feature independente do crédito](#tc-08--prime-jobs-flag-de-feature-independente-do-crédito)
10. [TC-09 — Admin: Gestão de créditos por plano](#tc-09--admin-gestão-de-créditos-por-plano)
11. [TC-10 — Admin: Custo configurável via app_configs](#tc-10--admin-custo-configurável-via-app_configs)
12. [TC-11 — UI: Labels e displays atualizados](#tc-11--ui-labels-e-displays-atualizados)
13. [TC-12 — Edge cases: Usuários sem assinatura e planos legados](#tc-12--edge-cases-usuários-sem-assinatura-e-planos-legados)
14. [Matriz de cobertura](#matriz-de-cobertura)

---

## 1. Pré-requisitos e Setup

### Usuários de teste necessários

| Perfil | Plano | Créditos/mês |
|--------|-------|--------------|
| `basic_user` | Basic | 5 |
| `pro_user` | Pro | 30 |
| `vip_user` | VIP | 999 |
| `admin_user` | Admin | bypass (999) |
| `no_sub_user` | Nenhuma assinatura ativa | fallback Basic (5) |

### Resetar uso do mês (executar no SQL Editor antes de cada TC)

```sql
-- Substitua <user_id> pelo UUID do usuário de teste
DELETE FROM usage_logs
WHERE user_id = '<user_id>'
  AND created_at >= date_trunc('month', now());
```

### Verificar estado atual dos créditos

```sql
SELECT * FROM get_unified_credits('<user_id>');
```

### Verificar custos configurados

```sql
SELECT value FROM app_configs WHERE key = 'credit_costs';
-- Esperado: {"curriculo_usa":3,"title_translator":1,"prime_jobs":1}
```

---

## TC-01 — RPC: Validar get_unified_credits

**Objetivo:** Confirmar que o RPC retorna os valores corretos para cada tipo de usuário.

### Passos

Executar no SQL Editor do Supabase:

**1.1 — Usuário Basic**
```sql
SELECT * FROM get_unified_credits('<basic_user_id>');
```
Resultado esperado:
```
plan_id  | plan_name | monthly_credits | used_credits | remaining_credits | features
---------+-----------+-----------------+--------------+-------------------+---------
basic    | Básico    | 5               | 0            | 5                 | {...}
```

**1.2 — Usuário Pro**
```sql
SELECT * FROM get_unified_credits('<pro_user_id>');
```
Esperado: `monthly_credits = 30`

**1.3 — Usuário VIP**
```sql
SELECT * FROM get_unified_credits('<vip_user_id>');
```
Esperado: `monthly_credits = 999`

**1.4 — Usuário Admin**
```sql
SELECT * FROM get_unified_credits('<admin_user_id>');
```
Esperado: `plan_id = 'admin', monthly_credits = 999, used_credits = 0, remaining_credits = 999`

**1.5 — Usuário sem assinatura**
```sql
SELECT * FROM get_unified_credits('<no_sub_user_id>');
```
Esperado: fallback para `plan_id = 'basic', monthly_credits = 5`

### Resultado esperado
Todos os 5 casos retornam dados válidos sem erro. `remaining_credits = monthly_credits - used_credits` sempre.

---

## TC-02 — ResumePass AI: Consumo de 3 créditos

**Objetivo:** Verificar que uma análise de currículo consome 3 créditos do pool.

**Pré-condição:** Basic user com 5 créditos (usage zerado).

### Passos

1. Login como `basic_user`
2. Navegar para `/curriculo`
3. Verificar que o pill de créditos no header exibe **`5/5 Créditos`**
4. Upload de um CV em PDF + colar um link de vaga
5. Clicar em **"Analisar"**
6. Aguardar conclusão da análise (score aparece na tela)

### Verificações

**Frontend:**
- Pill de créditos atualiza para **`2/5 Créditos`** sem precisar recarregar
- A barra de progresso circular reflete o novo valor

**Banco de dados:**
```sql
SELECT app_id, credits_used, created_at
FROM usage_logs
WHERE user_id = '<basic_user_id>'
ORDER BY created_at DESC
LIMIT 1;
```
Esperado: `app_id = 'curriculo_usa', credits_used = 3`

```sql
SELECT remaining_credits FROM get_unified_credits('<basic_user_id>');
```
Esperado: `remaining_credits = 2`

---

## TC-03 — ResumePass AI: Bloqueio por créditos insuficientes

**Objetivo:** Verificar que a análise é bloqueada quando restam menos de 3 créditos.

**Pré-condição:** Continuar do TC-02 (basic_user com 2 créditos restantes).

### Passos

1. Com `basic_user` já logado (2 créditos restantes)
2. Navegar para `/curriculo`
3. Observar o botão de análise

### Verificações

**Frontend:**
- Botão exibe **"Créditos Insuficientes"** e está **desabilitado** (não clicável)
- Pill de créditos mostra `2/5` com cor âmbar (≤25% disponível)
- Barra de progresso em âmbar

**Edge Function (verificar via tentativa manual):**
Chamar `analyze-resume` com JWT do usuário quando ele tem < 3 créditos deve retornar `HTTP 402` com body:
```json
{
  "error": "Você usou X de Y créditos este mês. Esta ação requer 3 crédito(s).",
  "error_code": "LIMIT_REACHED"
}
```

---

## TC-04 — Title Translator: Consumo de 1 crédito

**Objetivo:** Verificar que uma tradução de título consome 1 crédito do pool.

**Pré-condição:** Basic user com 2 créditos restantes (após TC-02).

### Passos

1. Navegar para `/traduzir-titulo` (ou rota do Title Translator)
2. Verificar display de créditos — deve mostrar **2 restantes**
3. Inserir um cargo em português e clicar em traduzir
4. Aguardar resultado da tradução

### Verificações

**Frontend:**
- Créditos atualizam de **2 → 1** após a tradução

**Banco de dados:**
```sql
SELECT app_id, credits_used
FROM usage_logs
WHERE user_id = '<basic_user_id>'
ORDER BY created_at DESC
LIMIT 1;
```
Esperado: `app_id = 'title_translator', credits_used = 1`

**5. Traduzir novamente (1 crédito restante → 0):**
- Tradução conclui, créditos vão para **0/5**
- Pill fica vermelho com ícone de alerta

**6. Tentar traduzir uma 3ª vez (0 créditos):**
- Bloqueado com erro "Créditos mensais insuficientes"

---

## TC-05 — Prime Jobs: Consumo de 1 crédito

**Objetivo:** Verificar que acessar uma vaga consome 1 crédito e não duplica ao acessar novamente.

**Pré-condição:** Pro user com 30 créditos.

### Passos

1. Login como `pro_user`
2. Navegar para `/vagas`
3. Verificar que o display mostra **"Créditos: 30 restantes"** (não "Acessos")
4. Abrir detalhes de uma vaga específica
5. Verificar que `/vagas/:id` mostra **"Créditos este mês: 0/30"**
6. Clicar em **"Acessar Vaga"** (post_link)
7. Verificar que a URL é revelada e uma nova aba abre

### Verificações

**Frontend:**
- Display atualiza para **"Créditos: 29 restantes"**
- JobDetails mostra **"1/30 crédito(s)"**

**Banco de dados:**
```sql
SELECT app_id, credits_used
FROM usage_logs
WHERE user_id = '<pro_user_id>'
ORDER BY created_at DESC
LIMIT 1;
```
Esperado: `app_id = 'prime_jobs', credits_used = 1`

**Sem duplicação (clicar na mesma vaga novamente):**
```sql
SELECT remaining_credits FROM get_unified_credits('<pro_user_id>');
```
Esperado: ainda `29` — `record_prime_jobs_application` retorna o `application_id` existente sem debitar novo crédito.

---

## TC-06 — Pool compartilhado: Esgotamento cruzado entre apps

**Objetivo:** Verificar que créditos de apps diferentes consomem do mesmo pool e o esgotamento bloqueia todos os apps.

**Pré-condição:** Basic user com **5 créditos** (usage zerado).

### Sequência de ações

| Passo | App | Custo | Restante esperado |
|-------|-----|-------|-------------------|
| 1 | Analisar currículo (ResumePass) | 3 | **2** |
| 2 | Traduzir título (Title Translator) | 1 | **1** |
| 3 | Acessar vaga (Prime Jobs) | 1 | **0** |

### Verificações após passo 3

**MemberCard em `/hub`:**
- Exibe `0/5 CRÉDITOS MENSAIS`
- Barra de progresso vazia (vermelha)

**Banco de dados:**
```sql
SELECT SUM(credits_used), COUNT(*)
FROM usage_logs
WHERE user_id = '<basic_user_id>'
  AND created_at >= date_trunc('month', now());
```
Esperado: `sum = 5, count = 3` (3 registros, 3 apps diferentes)

**Bloqueio de todos os apps:**
- `/curriculo` → botão "Créditos Insuficientes" desabilitado
- Title Translator → erro ao tentar traduzir
- Prime Jobs → tentativa de acessar nova vaga retorna 403

---

## TC-07 — Plano VIP: Créditos ilimitados (999)

**Objetivo:** Verificar que usuário VIP não é bloqueado em uso normal.

**Pré-condição:** VIP user com 999 créditos.

### Passos

1. Login como `vip_user`
2. Realizar 3 análises de currículo (−9 créditos)
3. Realizar 3 traduções de título (−3 créditos)
4. Acessar 3 vagas no Prime Jobs (−3 créditos)

### Verificações

**Frontend:**
- MemberCard mostra `984/999 CRÉDITOS MENSAIS` (ou valor equivalente)
- Nenhum app bloqueia o usuário
- Botão "Fazer Upgrade" **não aparece** (VIP não vê upgrade button)

**Banco de dados:**
```sql
SELECT remaining_credits FROM get_unified_credits('<vip_user_id>');
```
Esperado: `≥ 984` (999 − uso acumulado)

---

## TC-08 — Prime Jobs: Flag de feature independente do crédito

**Objetivo:** Verificar que a flag `prime_jobs` bloqueia independentemente dos créditos disponíveis.

**Pré-condição:** Basic user com créditos sobrando.

### Passos

**Setup (SQL Editor):**
```sql
-- Desabilitar prime_jobs no plano Basic temporariamente
UPDATE plans
SET features = features || '{"prime_jobs": false}'::jsonb
WHERE id = 'basic';
```

1. Login como `basic_user` (com créditos disponíveis)
2. Tentar acessar uma vaga no Prime Jobs

### Verificações

- Erro retornado: **"Seu plano não inclui acesso ao Prime Jobs"** (não "Créditos insuficientes")
- HTTP 403 com `error_code: "LIMIT_REACHED"`
- **Nenhum crédito é debitado** do pool

**Banco de dados:**
```sql
SELECT COUNT(*) FROM usage_logs
WHERE user_id = '<basic_user_id>'
  AND app_id = 'prime_jobs'
  AND created_at >= date_trunc('month', now());
```
Esperado: `0` (nenhum registro de uso criado)

**Teardown (restaurar):**
```sql
UPDATE plans
SET features = features || '{"prime_jobs": true}'::jsonb
WHERE id = 'basic';
```

---

## TC-09 — Admin: Gestão de créditos por plano

**Objetivo:** Verificar que o admin pode alterar os créditos mensais de um plano e a mudança reflete imediatamente para os usuários.

### Passos

1. Login como `admin_user`
2. Navegar para `/admin/planos`
3. Verificar que cada card de plano mostra **uma única seção** "Créditos Mensais (Pool Unificado)"
4. Confirmar que **não existem** inputs separados de "ResumePass AI" ou "Title Translator"
5. No card do plano **Basic**, alterar o valor de `5` para `10`
6. Clicar em **"Salvar"**
7. Verificar toast de confirmação: "Plano atualizado!"

### Verificações

**Banco de dados:**
```sql
SELECT features->>'monthly_credits' AS monthly_credits
FROM plans
WHERE id = 'basic';
```
Esperado: `"10"`

**Frontend (basic_user):**
```sql
SELECT remaining_credits FROM get_unified_credits('<basic_user_id>');
```
Esperado: `10` (se uso = 0)

- MemberCard do `basic_user` mostra `X/10 CRÉDITOS MENSAIS`

**Teardown (restaurar):**
- Voltar o valor para `5` e salvar novamente.

---

## TC-10 — Admin: Custo configurável via app_configs

**Objetivo:** Verificar que alterar os custos em `app_configs` afeta o comportamento das Edge Functions sem necessidade de redeploy.

### Passos

**Setup (SQL Editor):**
```sql
-- Mudar custo do currículo de 3 para 2
UPDATE app_configs
SET value = '{"curriculo_usa":2,"title_translator":1,"prime_jobs":1}'
WHERE key = 'credit_costs';
```

1. Login como `basic_user` (5 créditos)
2. Analisar um currículo

### Verificações

**Frontend:**
- Créditos reduzem de `5 → 3` (custo = 2, não 3)

**Banco de dados:**
```sql
SELECT credits_used FROM usage_logs
WHERE user_id = '<basic_user_id>'
  AND app_id = 'curriculo_usa'
ORDER BY created_at DESC
LIMIT 1;
```
Esperado: `credits_used = 2`

**Teardown (restaurar):**
```sql
UPDATE app_configs
SET value = '{"curriculo_usa":3,"title_translator":1,"prime_jobs":1}'
WHERE key = 'credit_costs';
```

> **Nota:** A alteração é lida em tempo real pela Edge Function a cada request (sem cache). Não é necessário redeploy.

---

## TC-11 — UI: Labels e displays atualizados

**Objetivo:** Verificar que todos os labels da interface foram atualizados para refletir o pool unificado.

**Pré-condição:** Qualquer usuário autenticado com assinatura ativa.

### Checklist por tela

| # | Tela | Elemento | Texto esperado | Texto proibido |
|---|------|----------|---------------|----------------|
| 11.1 | `/hub` → MemberCard | Badge de créditos | **CRÉDITOS MENSAIS** | "CRÉDITOS CURRÍCULO USA" |
| 11.2 | `/hub` → MemberCard | Sub-label | **Renova no início do mês** | — |
| 11.3 | `/curriculo` → Header | Pill direito | **X/Y Créditos** | "análises" |
| 11.4 | `/curriculo` → QuotaDisplay | Inline text | **X/Y créditos** | "análises" |
| 11.5 | `/curriculo` → QuotaDisplay | Tooltip | **"X de Y créditos usados este mês"** | "análises usadas" |
| 11.6 | `/vagas` → PrimeJobs | Contador | **"Créditos: X restantes"** | "Acessos: X/Y" |
| 11.7 | `/vagas/:id` → JobDetails | Seção lateral | **"Créditos este mês"** | "Acessos este mês" |
| 11.8 | `/vagas/:id` → JobDetails | Counter | **"X crédito(s)"** | "X acesso(s)" |
| 11.9 | Modal de Upgrade (crédito esgotado) | Planos listados | Valor de **`monthly_credits`** correto | Valor errado/legado |

---

## TC-12 — Edge cases: Usuários sem assinatura e planos legados

**Objetivo:** Verificar comportamento em situações limite.

### 12.1 — Usuário sem nenhuma assinatura

**Setup:** Usar `no_sub_user` (sem linha em `user_subscriptions`).

```sql
SELECT * FROM get_unified_credits('<no_sub_user_id>');
```
Esperado: fallback para Basic — `plan_id = 'basic', monthly_credits = 5`

**Frontend:** MemberCard e QuotaDisplay mostram `X/5`.

---

### 12.2 — Assinatura com status `past_due`

**Setup:**
```sql
UPDATE user_subscriptions
SET status = 'past_due'
WHERE user_id = '<pro_user_id>';
```

```sql
SELECT * FROM get_unified_credits('<pro_user_id>');
```
Esperado: ainda retorna plano Pro (`monthly_credits = 30`) — `past_due` ainda tem acesso.

**Teardown:**
```sql
UPDATE user_subscriptions
SET status = 'active'
WHERE user_id = '<pro_user_id>';
```

---

### 12.3 — Assinatura cancelada

**Setup:**
```sql
UPDATE user_subscriptions
SET status = 'cancelled'
WHERE user_id = '<pro_user_id>';
```

```sql
SELECT * FROM get_unified_credits('<pro_user_id>');
```
Esperado: fallback para Basic (`monthly_credits = 5`).

**Teardown:**
```sql
UPDATE user_subscriptions
SET status = 'active'
WHERE user_id = '<pro_user_id>';
```

---

### 12.4 — Rollover de mês

O cálculo de `used_credits` usa:
```sql
WHERE created_at >= date_trunc('month', now())
```

Para simular:
```sql
-- Inserir uso "do mês passado" manualmente
INSERT INTO usage_logs (user_id, app_id, credits_used, created_at)
VALUES ('<basic_user_id>', 'curriculo_usa', 3, now() - interval '35 days');

SELECT used_credits, remaining_credits
FROM get_unified_credits('<basic_user_id>');
```
Esperado: registro antigo **não conta** — `used_credits = 0`, `remaining_credits = 5`.

---

## Matriz de cobertura

| Camada | Componente | TC(s) |
|--------|-----------|-------|
| **DB — RPC** | `get_unified_credits` | TC-01 |
| **DB — RPC** | `get_full_plan_access` | TC-06 (via frontend) |
| **DB — RPC** | `record_prime_jobs_application` | TC-05, TC-08 |
| **DB — Tabela** | `usage_logs.credits_used` | TC-02, TC-04, TC-05, TC-10 |
| **DB — Tabela** | `plans.features.monthly_credits` | TC-09 |
| **DB — Tabela** | `app_configs.credit_costs` | TC-10 |
| **Edge Function** | `analyze-resume` (custo 3) | TC-02, TC-03, TC-10 |
| **Edge Function** | `translate-title` (custo 1) | TC-04 |
| **Edge Function** | `job-link-proxy` (custo 1) | TC-05, TC-08 |
| **Frontend** | `useSubscription` (get_unified_credits) | TC-01 via UI |
| **Frontend** | `usePlanAccess` (pool unificado) | TC-11 |
| **Frontend** | `usePrimeJobsQuota` | TC-05, TC-08 |
| **Frontend** | `MemberCard` | TC-06, TC-07, TC-09, TC-11 |
| **Frontend** | `CurriculoHeader` + `QuotaDisplay` | TC-02, TC-03, TC-11 |
| **Frontend** | `CurriculoUSA` (hasCredits >= 3) | TC-03 |
| **Frontend** | `PrimeJobs` + `JobDetailsPage` | TC-05, TC-11 |
| **Frontend** | `UpgradeModal` | TC-03 (modal trigger) |
| **Admin** | `PlanCard` (input unificado) | TC-09 |
| **Admin** | `app_configs` credit_costs | TC-10 |
| **Edge case** | Sem assinatura / cancelled / past_due | TC-12 |
| **Edge case** | Rollover de mês | TC-12.4 |
