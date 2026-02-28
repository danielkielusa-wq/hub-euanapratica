# Prime Jobs — Manual de Testes E2E

**Última atualização:** 2026-02-28
**Escopo:** Todos os fluxos do Prime Jobs — listagem, filtros, detalhes, acesso à vaga (job-link-proxy), bookmarks, sistema de créditos e painel admin.

---

## O que é o Prime Jobs

Prime Jobs é um agregador **curado** de oportunidades remotas para brasileiros trabalharem em empresas americanas. As vagas **não são obrigatoriamente públicas** — algumas existem apenas no LinkedIn ou foram obtidas por contato direto com o recrutador. Por isso:

- O usuário **não "aplica"** no sentido tradicional — ele **acessa** o link da vaga ou o perfil do recrutador responsável.
- O URL da vaga **nunca aparece no HTML/DOM**. Ele só é entregue via Edge Function autenticada (`job-link-proxy`) após validação de quota.
- O que é registrado é que o usuário **acessou** aquela oportunidade — o follow-up (enviar mensagem, candidatar-se) é responsabilidade do candidato.

---

## Pré-requisitos

### Usuários necessários

| Papel | Como criar |
|-------|-----------|
| **Admin** | Usuário com role `admin` — use sua conta padrão |
| **Usuário PRO** | Registrar em `/register` + assinar plano Pro via Ticto (ou simular via Admin → Assinaturas) |
| **Usuário VIP** | Idem, plano VIP |
| **Usuário FREE** | Conta sem assinatura ativa (plano `basic`) |

### Vagas necessárias na base

Para os testes básicos, precisam existir **pelo menos 3 vagas ativas** com URLs ou links de contato válidos.

**Criar via Admin:**
1. Logar como Admin → `/admin/prime-jobs`
2. Aba **Vagas** → botão **Nova Vaga**
3. Preencher os campos obrigatórios e marcar **Ativa**

**Ou verificar via SQL:**
```sql
SELECT id, title, company, url, contact_profile_link, is_active
FROM jobs
WHERE is_active = true
LIMIT 5;
```

### Configurações necessárias

| Config | Onde verificar |
|--------|---------------|
| Plano PRO com `prime_jobs_limit > 0` | Admin → `/admin/planos` → PRO → features → `prime_jobs_limit` (padrão: 20) |
| Plano VIP com `prime_jobs_limit > 0` | Idem VIP (padrão: 50) |
| Plano FREE com `prime_jobs_limit = 0` | Idem FREE/basic (padrão: 0) |
| `prime_jobs_free_preview_count` | `/admin/prime-jobs` → aba **Configurações** (padrão: 3) |

**Verificação SQL:**
```sql
-- Planos e limites
SELECT id, name, features->>'prime_jobs_limit' AS prime_jobs_limit
FROM plans
WHERE id IN ('basic', 'pro', 'vip');

-- Config de preview gratuito
SELECT key, value FROM app_configs WHERE key = 'prime_jobs_free_preview_count';
```

---

## Arquitetura resumida

```
Usuário → /prime-jobs → get_jobs_with_user_context() RPC → listagem
Usuário → /prime-jobs/:id → get_job_by_id() RPC → detalhe
Usuário clica "Acessar Oportunidade" → job-link-proxy Edge Function:
  1. JWT validado
  2. get_app_quota(user_id, 'prime_jobs') → verifica créditos
  3. Busca URL da vaga (service_role — não exposta no frontend)
  4. Registra clique em job_link_clicks (fire-and-forget)
  5. Registra em job_applications + usage_logs (fire-and-forget)
  6. Retorna { redirect_url } → frontend abre em nova aba
```

**Tabelas principais:**

| Tabela | Propósito |
|--------|-----------|
| `jobs` | Catálogo de vagas (url e contact_profile_link protegidos via RLS) |
| `job_applications` | Registro de quais vagas cada usuário acessou |
| `job_bookmarks` | Vagas salvas pelo usuário |
| `job_link_clicks` | Audit trail de clicks (post_link e contact_link) |
| `job_imports` | Histórico de importações JSON em lote |
| `usage_logs` | Sistema unificado de créditos (app_id = 'prime_jobs') |

---

## 1. Listagem de vagas — Usuário FREE

**Rota:** `/prime-jobs`

**Pré-condição:** Usuário FREE logado. Existem 6+ vagas ativas.

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para `/prime-jobs` | Página carrega. Stats cards mostram dados reais (não "Engineering", não "$0"). |
| 2 | Observar o grid de vagas | Apenas as primeiras **N** vagas estão visíveis (N = valor de `prime_jobs_free_preview_count`, padrão 3). As demais mostram o card bloqueado. |
| 3 | Observar a mensagem de contagem | "Você está vendo 3 de X vagas. Faça upgrade para ver todas!" |
| 4 | Clicar numa vaga bloqueada | Abre o modal de upgrade (`UpgradeModal`). |
| 5 | Verificar que o badge de plano no header mostra "Plano free" | ✓ |
| 6 | Verificar que o contador de acessos **não aparece** no header | ✓ (FREE não tem limite mensal, tem preview count) |

---

## 2. Listagem de vagas — Usuário PRO/VIP

**Rota:** `/prime-jobs`

**Pré-condição:** Usuário PRO ou VIP logado.

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para `/prime-jobs` | Todas as vagas aparecem sem bloqueio. |
| 2 | Verificar contador no header | Mostra "Aplicações: X/20" (PRO) ou "X/50" (VIP) onde X = acessos feitos este mês. |
| 3 | Clicar no botão "Buscar" sem digitar nada | Lista completa mantida. |
| 4 | Digitar título no campo de busca e pressionar Enter | Lista filtra por título/empresa/descrição. |
| 5 | Usar filtro de Categoria | Lista filtra corretamente pela categoria selecionada. |
| 6 | Usar filtro de Senioridade | Lista filtra por `experience_level`. |
| 7 | Usar filtro de Modelo (Remote Type) | Lista filtra por `remote_type`. |
| 8 | Usar filtro de Tipo de Contrato | Lista filtra por `job_type`. |
| 9 | Combinar múltiplos filtros | Filtros se acumulam (AND). O badge azul no botão Filtros aparece. |
| 10 | Clicar "Limpar Filtros" | Todos os filtros são removidos. Lista volta ao estado original. |
| 11 | Clicar no ícone de coração numa vaga | Vaga é adicionada/removida dos bookmarks. Toast de confirmação aparece. |
| 12 | Clicar em "Minhas Vagas Salvas" | Navega para `/prime-jobs/bookmarks`. |

---

## 3. Detalhe da vaga — Visualização

**Rota:** `/prime-jobs/:id`

**Pré-condição:** Usuário PRO logado. A vaga existe e está ativa.

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para o detalhe de uma vaga | Header mostra título, empresa, localização, badges de tipo/nível/remote/salário. |
| 2 | Verificar seção "Sobre a Vaga" | Descrição renderizada (HTML sanitizado via DOMPurify). |
| 3 | Verificar seção AI Insights | Se `ai_enrichment` não for null, exibe o bloco de insights (english level, missing skills, etc.). |
| 4 | Verificar sidebar "Acesso Prime" | Card escuro com título "Vaga garimpada. Acesso direto." e botão "Acessar Oportunidade". |
| 5 | Verificar quota no sidebar | "Acessos este mês: X/20" com barra de progresso colorida. |
| 6 | Clicar no ícone de coração | Bookmark toggled. Ícone muda. |
| 7 | Clicar no ícone de compartilhar | URL copiada para clipboard. Toast "Link copiado!" aparece. |
| 8 | Clicar em "Voltar para Prime Jobs" | Navega de volta para `/prime-jobs`. |

---

## 4. Acesso à oportunidade — Fluxo principal (PRO/VIP com crédito disponível)

**Rota:** `/prime-jobs/:id`

**Pré-condição:** Usuário PRO, tem créditos disponíveis (`remaining > 0`). A vaga tem `url` preenchido. A vaga **não** foi acessada antes por este usuário (`is_applied = false`).

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Clicar em "Acessar Oportunidade" | Botão mostra spinner. |
| 2 | Aguardar resposta | Nova aba abre com a URL da vaga (LinkedIn, site da empresa, etc.). |
| 3 | Verificar toast | "Acesso liberado! A vaga está nas suas mãos. Bora!" |
| 4 | Verificar que o botão muda de estado | Botão fica desabilitado, verde translúcido, texto "Acesso Liberado" com ícone de check. |
| 5 | Verificar que o título do sidebar muda | "A porta está aberta — o próximo passo é seu." |
| 6 | Verificar que a descrição muda | Encoraja o próximo passo — "Você já tem o caminho, agora é hora de agir..." |
| 7 | Verificar que o contador de acessos aumentou | "Acessos este mês: (X+1)/20" |
| 8 | Verificar microcopy abaixo do botão | "Você acessou — agora é com você" |

**Verificação SQL (pós-acesso):**
```sql
-- Registro em job_applications
SELECT * FROM job_applications
WHERE user_id = '<user_id>'
  AND job_id = '<job_id>'
ORDER BY applied_at DESC LIMIT 1;

-- Registro em usage_logs (crédito consumido)
SELECT * FROM usage_logs
WHERE user_id = '<user_id>'
  AND app_id = 'prime_jobs'
ORDER BY created_at DESC LIMIT 1;

-- Registro de click
SELECT * FROM job_link_clicks
WHERE user_id = '<user_id>'
  AND job_id = '<job_id>'
ORDER BY clicked_at DESC LIMIT 1;

-- Quota atualizada
SELECT * FROM get_app_quota('<user_id>', 'prime_jobs');
```

---

## 5. Acesso à oportunidade — Vaga já acessada

**Pré-condição:** Usuário acessou a vaga anteriormente (`is_applied = true`).

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para o detalhe da vaga | Botão "Acesso Liberado" (desabilitado, verde translúcido) já aparece. |
| 2 | Verificar que nenhum crédito foi consumido novamente | Contagem de acessos não muda. |
| 3 | Verificar microcopy | "Você acessou — agora é com você" |

> O sistema verifica duplicidade via `job_applications` (RPC `record_prime_jobs_application`). Se já existe registro, retorna sucesso sem inserir novamente.

---

## 6. Acesso à oportunidade — Sem crédito (limite atingido)

**Pré-condição:** Usuário PRO com `remaining = 0` (usou todos os 20 acessos do mês).

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para o detalhe de qualquer vaga não acessada | Banner amber no topo da página: "Oportunidade exclusiva Prime Jobs — Algumas dessas vagas não existem em nenhum outro lugar." |
| 2 | Verificar sidebar | Botão amber "Limite do Mês Atingido — Upgrade". |
| 3 | Clicar no botão amber | Abre `UpgradeModal`. |
| 4 | Verificar barra de progresso | 100% preenchida em amber/laranja. |

**Simular limite atingido via SQL:**
```sql
-- Inserir usage_logs até atingir o limite do plano PRO (20)
INSERT INTO usage_logs (user_id, app_id, created_at)
SELECT '<user_id>', 'prime_jobs', now() - (generate_series(1, 20) * interval '1 minute');

-- Verificar
SELECT * FROM get_app_quota('<user_id>', 'prime_jobs');
-- Deve retornar: monthly_limit=20, used_this_month=20, remaining=0
```

---

## 7. Acesso à oportunidade — Usuário FREE

**Pré-condição:** Usuário FREE (sem assinatura ativa).

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para o detalhe de uma vaga | Banner amber no topo: "Oportunidade exclusiva Prime Jobs". |
| 2 | Verificar sidebar | Botão "Desbloquear Acesso" (brand color). |
| 3 | Clicar no botão | Abre `UpgradeModal`. |
| 4 | Verificar que nenhuma aba abre e nenhum crédito é consumido | ✓ |

---

## 8. Acesso com link de contato (contact_profile_link)

Algumas vagas têm `contact_profile_link` (perfil LinkedIn do recrutador) em vez de `url` da vaga.

**Pré-condição:** Vaga com `contact_profile_link` preenchido, `url` pode ser null.

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Clicar "Acessar Oportunidade" | job-link-proxy é chamado com `type: 'post_link'` (padrão) — retorna `url`. Se não houver url, retorna erro "Link não disponível para esta vaga". |

> **Nota:** O botão de "contato direto" (contact_profile_link) é acessado separadamente no JobDetailsPage quando o campo estiver implementado no frontend.

---

## 9. Bookmarks

**Rota:** `/prime-jobs` e `/prime-jobs/:id` e `/prime-jobs/bookmarks`

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Clicar no coração de uma vaga não salva | Coração fica vermelho preenchido. Toast de confirmação. |
| 2 | Clicar no coração de uma vaga já salva | Coração volta ao estado vazio. Toast de remoção. |
| 3 | Navegar para `/prime-jobs/bookmarks` | Lista apenas as vagas salvas pelo usuário atual. |
| 4 | Verificar que vagas expiradas/inativas não aparecem | Apenas vagas `is_active = true` são retornadas. |

**Verificação SQL:**
```sql
SELECT j.title, j.company, jb.created_at
FROM job_bookmarks jb
JOIN jobs j ON j.id = jb.job_id
WHERE jb.user_id = '<user_id>'
ORDER BY jb.created_at DESC;
```

---

## 10. Stats Cards

**Rota:** `/prime-jobs`

Os 4 cards no topo são alimentados pelo RPC `get_prime_jobs_stats()`.

| Card | Fonte de dado | Comportamento quando vazio |
|------|--------------|---------------------------|
| Vagas Ativas | `COUNT(*) WHERE is_active=true AND expires_at > now()` | Mostra "0" |
| Média Salarial | `AVG(salary_min) WHERE salary_min > 0` | Mostra "—" (não "$0") |
| Novas Esta Semana | `COUNT(*) WHERE created_at > now() - 7 days AND is_active=true` | Mostra "+0" |
| Setor em Alta | `job_category mais frequente no último mês` | Mostra "—" (não "Engineering") |

**Verificação SQL:**
```sql
SELECT * FROM get_prime_jobs_stats();
```

---

## 11. Admin — Gestão de Vagas

**Rota:** `/admin/prime-jobs` → aba **Vagas**

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Navegar para `/admin/prime-jobs` | Aba Vagas está selecionada. Tabela lista todas as vagas (ativas e inativas). |
| 2 | Clicar em "Nova Vaga" | Dialog de criação abre com todos os campos. |
| 3 | Preencher campos obrigatórios (Título, Empresa, Localização, Categoria, Nível, Remote Type, Tipo de Contrato, URL ou Link de Contato) e salvar | Vaga criada. Aparece na tabela. |
| 4 | Clicar em Editar numa vaga | Dialog de edição pré-preenchido. Alteração salva corretamente. |
| 5 | Toggle "Ativa/Inativa" | Vaga some/aparece na listagem pública. |
| 6 | Marcar como "Destacada" | Vaga sobe no ranking (ORDER BY is_featured DESC). |

---

## 12. Admin — Importação em Lote (JSON)

**Rota:** `/admin/prime-jobs` → aba **Importar**

**Formato esperado do JSON:**
```json
[
  {
    "title": "Senior Full Stack Engineer",
    "company": "Acme Corp",
    "location": "Remote — USA",
    "job_category": "Engineering",
    "experience_level": "senior",
    "remote_type": "fully_remote",
    "employment_type": "full_time",
    "url": "https://linkedin.com/jobs/view/...",
    "description": "We are looking for...",
    "salary_min": 120000,
    "salary_max": 160000,
    "salary_currency": "USD",
    "tech_stack": ["React", "Node.js", "PostgreSQL"],
    "industry": "SaaS"
  }
]
```

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Colar JSON válido e clicar em Importar | Spinner aparece. Resultado mostra: X inseridas, Y atualizadas, Z ignoradas (duplicatas por URL). |
| 2 | Colar JSON com URL duplicada | Vaga é atualizada (UPDATE), não duplicada. Contador "atualizadas" incrementa. |
| 3 | Colar JSON inválido (não é array, campo obrigatório faltando) | Erro descritivo exibido. Nenhuma vaga é inserida. |

**Verificação SQL:**
```sql
SELECT file_name, total_jobs, inserted, updated, skipped, created_at
FROM job_imports
ORDER BY created_at DESC
LIMIT 5;
```

---

## 13. Admin — Enriquecimento AI

**Rota:** `/admin/prime-jobs` → aba **Enriquecer**

O enriquecimento chama a Edge Function `enrich-jobs`, que usa LLM para gerar:
- `english_level_required` (A1–C2 ou Advanced)
- `missing_skills_hint` (habilidades que brasileiros comumente não têm)
- `key_skills` (principais habilidades da vaga)
- `interview_tip` (dica de entrevista)
- `brazil_context` (contexto específico para candidatos brasileiros)

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Selecionar vagas sem `ai_enrichment` e clicar "Enriquecer Selecionadas" | Progress bar aparece. Vagas são processadas em lote. |
| 2 | Após concluído, abrir detalhe de uma vaga enriquecida | Seção "AI Insights" aparece no corpo da página. |
| 3 | Verificar que vagas já enriquecidas não são reprocessadas | Contagem de "já enriquecidas" incrementa, custo não é duplicado. |

**Verificação SQL:**
```sql
-- Vagas com enrichment
SELECT id, title, ai_enrichment->>'english_level_required' AS english,
       ai_enrichment->>'missing_skills_hint' AS missing_skills
FROM jobs
WHERE ai_enrichment IS NOT NULL
LIMIT 5;

-- Vagas sem enrichment (candidatas ao processamento)
SELECT COUNT(*) FROM jobs WHERE ai_enrichment IS NULL AND is_active = true;
```

---

## 14. Admin — Configurações

**Rota:** `/admin/prime-jobs` → aba **Configurações**

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Alterar "Vagas visíveis para plano gratuito" de 3 para 5 e salvar | Usuários FREE passam a ver 5 vagas na listagem. |
| 2 | Verificar que a mudança é refletida imediatamente | Sem necessidade de deploy — é um valor em `app_configs`. |

**Verificação SQL:**
```sql
SELECT key, value FROM app_configs WHERE key = 'prime_jobs_free_preview_count';
```

---

## 15. Admin — Upsell Contextual

**Rota:** `/admin/prime-jobs` → aba **Upsell**

| # | Ação | Resultado esperado |
|---|------|--------------------|
| 1 | Ativar o toggle "Ativar upsell em vagas" | Config `prime_jobs_upsell_config.enabled` muda para `true`. |
| 2 | Selecionar serviços elegíveis (checkboxes) | IDs dos serviços salvos em `eligible_service_ids`. |
| 3 | Selecionar "Serviço do sidebar" | Aparece o card compacto `JobSidebarUpsell` no detalhe de toda vaga. |
| 4 | Selecionar "Serviço pós-acesso" | Após o usuário acessar uma oportunidade, modal `JobPostApplyModal` aparece com esse serviço. |
| 5 | Abrir detalhe de uma vaga com AI Insights | Bloco `JobUpsellBlock` aparece abaixo dos insights, com serviços contextuais matchados. |
| 6 | Clicar em X num card de upsell | Card desaparece e não reaparece por 7 dias (localStorage, sem DB). |

**Verificação:**
```sql
SELECT value FROM app_configs WHERE key = 'prime_jobs_upsell_config';
-- Deve retornar JSON com enabled, eligible_service_ids, sidebar_service_id, post_apply_service_id
```

---

## 16. Sistema de Créditos — Verificações gerais

### Limites por plano

| Plano | Acessos/mês | Feature key |
|-------|-------------|-------------|
| FREE (basic) | 0 | `prime_jobs_limit: 0` |
| PRO | 20 | `prime_jobs_limit: 20` |
| VIP | 50 | `prime_jobs_limit: 50` |
| Admin | Ilimitado (bypass) | — |

### Como os créditos são consumidos

1. Usuário clica "Acessar Oportunidade"
2. Frontend chama `supabase.functions.invoke('job-link-proxy', { body: { job_id, type: 'post_link' } })`
3. Edge Function valida JWT + chama `get_app_quota(user_id, 'prime_jobs')`
4. Se `remaining > 0`: retorna o link + registra em `usage_logs` (crédito consumido)
5. Se `remaining = 0`: retorna HTTP 403 com `error_code: "LIMIT_REACHED"`

### Reset mensal

Os créditos resetam automaticamente no primeiro dia de cada mês — `get_app_quota` conta `usage_logs WHERE created_at >= date_trunc('month', now())`.

### Admin bypass

Usuários com role `admin` recebem `monthly_limit: 999, remaining: 999` — nunca são bloqueados.

**Verificação completa de quota:**
```sql
-- Ver quota de qualquer usuário
SELECT * FROM get_app_quota('<user_id>', 'prime_jobs');

-- Histórico de acessos do mês atual
SELECT u.email, COUNT(*) AS acessos
FROM usage_logs ul
JOIN auth.users u ON u.id = ul.user_id
WHERE ul.app_id = 'prime_jobs'
  AND ul.created_at >= date_trunc('month', now())
GROUP BY u.email
ORDER BY acessos DESC;
```

---

## 17. Segurança — Verificações

### URLs nunca expostas no frontend

**O que verificar:** Abrir DevTools → Network → clicar "Acessar Oportunidade" → inspecionar a response do `job-link-proxy`. O URL da vaga **só aparece na response JSON**, nunca no HTML da página.

### RLS — Usuário não pode ver URLs via REST direto

```bash
# Tentativa de acessar URL de uma vaga via REST (deve falhar — RLS bloqueia url e contact_profile_link)
curl https://seqgnxynrcylxsdzbloa.supabase.co/rest/v1/jobs?select=url,contact_profile_link \
  -H "apikey: <anon_key>" \
  -H "Authorization: Bearer <user_jwt>"
# Deve retornar colunas vazias ou erro — as colunas url e contact_profile_link têm RLS restritivo
```

### Quota não pode ser burlada pelo frontend

O check de quota é feito **dentro da Edge Function** com `service_role`. O frontend não tem como forçar a entrega do link sem passar pela validação.

---

## 18. Referência Técnica

### Edge Function: job-link-proxy

```
supabase/functions/job-link-proxy/index.ts
```

**Fluxo:**
1. `validateUserAuth(req)` — valida JWT
2. `get_app_quota(userId, 'prime_jobs')` — checa créditos
3. `SELECT url FROM jobs WHERE id = job_id AND is_active = true` (via service_role)
4. INSERT em `job_link_clicks` (fire-and-forget)
5. `record_prime_jobs_application(userId, jobId)` (fire-and-forget)
6. INSERT em `usage_logs` (fire-and-forget)
7. Retorna `{ redirect_url }`

### RPCs principais

| RPC | Chamado por | Propósito |
|-----|------------|-----------|
| `get_jobs_with_user_context` | `useJobs` hook | Listagem com filtros + flags is_bookmarked/is_applied |
| `get_job_by_id` | `useJob` hook | Detalhe de uma vaga |
| `get_prime_jobs_stats` | `usePrimeJobsStats` hook | 4 cards de estatísticas |
| `get_job_categories` | `useJobCategories` hook | Dropdown de categorias com contagem |
| `get_app_quota` | `usePrimeJobsQuota` hook + job-link-proxy | Quota unificada de créditos |
| `record_prime_jobs_application` | job-link-proxy | Registra acesso em job_applications |
| `get_job_public_preview` | `JobPublicPreview` page | Preview sem autenticação (só metadados) |

### Arquivos de código relevantes

| Arquivo | Propósito |
|---------|-----------|
| [src/pages/jobs/PrimeJobs.tsx](../../src/pages/jobs/PrimeJobs.tsx) | Página de listagem |
| [src/pages/jobs/JobDetailsPage.tsx](../../src/pages/jobs/JobDetailsPage.tsx) | Página de detalhe + CTA |
| [src/hooks/useJobs.ts](../../src/hooks/useJobs.ts) | Hooks de listagem e stats |
| [src/hooks/useJobApplications.ts](../../src/hooks/useJobApplications.ts) | Hook de quota + mutação de acesso |
| [src/hooks/useJobBookmarks.ts](../../src/hooks/useJobBookmarks.ts) | Hook de bookmarks |
| [src/hooks/useJobUpsell.ts](../../src/hooks/useJobUpsell.ts) | Config + matching de upsell |
| [supabase/functions/job-link-proxy/index.ts](../../supabase/functions/job-link-proxy/index.ts) | Edge Function protegida de entrega de URLs |
| [src/pages/admin/AdminPrimeJobs.tsx](../../src/pages/admin/AdminPrimeJobs.tsx) | Painel admin completo |

### Migrations relevantes (ordem cronológica)

| Migration | O que faz |
|-----------|-----------|
| `20260206200000_prime_jobs_support.sql` | Schema inicial: jobs, job_applications, job_bookmarks |
| `20260228900002_prime_jobs_redesign.sql` | Redesign: job_imports, job_link_clicks, RPCs, preview anon |
| `20260228999000_grant_jobs_authenticated.sql` | Grants RLS para authenticated |
| `20260228999300_add_missing_jobs_columns.sql` | Colunas adicionais |
| `20260228999900_integrate_prime_jobs_credits.sql` | Integração com sistema unificado get_app_quota |
| `20260228999910_prime_jobs_audit_fixes.sql` | Drop check_prime_jobs_quota obsoleto + seed prime_jobs_free_preview_count |
| `20260228999800_seed_prime_jobs_upsell_config.sql` | Seed da config de upsell |
