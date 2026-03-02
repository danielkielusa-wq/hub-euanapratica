# Guia de Testes — Audit Fixes (2026-03-01)

## Resumo das Mudanças

| # | Categoria | Mudança | Arquivos |
|---|-----------|---------|----------|
| 1 | Segurança | Comparação timing-safe para `x-internal-secret` | `_shared/authGuard.ts` |
| 2 | Segurança | Auth guards em 4 Edge Functions desprotegidas | `translate-title`, `analyze-post-for-upsell`, `recommend-product`, `simulate-ticto-callback` |
| 3 | Performance | Code splitting com React.lazy() (49 páginas) | `src/App.tsx` |
| 4 | Config | 30+ app_configs para parâmetros LLM | Migration `20260301100000` |
| 5 | Performance | `.limit()` em 5 queries admin sem paginação | `useAdminBookings`, `useAdminCourses`, `useAdminIdeas`, `useAdminWhatsAppFlows`, `useAdminUsers` |

---

## 1. Segurança — Timing-Safe Secret Comparison

### O que mudou
- `authGuard.ts` → `validateInternalCall()` agora usa comparação byte-a-byte com XOR (constant-time)
- Removido fallback para `SUPABASE_SERVICE_ROLE_KEY` — agora exige `INTERNAL_FUNCTION_SECRET`

### Como testar

#### 1.1 Chamada interna válida (deve funcionar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  -d '{"lead_id": "test", "template_name": "test"}'
```
**Esperado**: Resposta 400 (bad request por dados inválidos) ou 200 — NÃO 401.

#### 1.2 Chamada interna com secret errado (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: wrong-secret-value" \
  -d '{"lead_id": "test", "template_name": "test"}'
```
**Esperado**: `401 Unauthorized`

#### 1.3 Chamada sem nenhum header de auth (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": "test"}'
```
**Esperado**: `401 Unauthorized`

#### 1.4 Verificar nos logs que SERVICE_ROLE_KEY não é mais aceito como internal secret
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-whatsapp" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <SUPABASE_SERVICE_ROLE_KEY>" \
  -d '{"lead_id": "test"}'
```
**Esperado**: `401 Unauthorized` (antes aceitaria como fallback)

---

## 2. Segurança — Auth Guards em Edge Functions

### O que mudou
Estas 4 funções antes aceitavam chamadas sem autenticação:
- `translate-title` → agora exige `requireAuthOrInternal`
- `analyze-post-for-upsell` → agora exige `requireAuthOrInternal`
- `recommend-product` → agora exige `requireAuthOrInternal`
- `simulate-ticto-callback` → agora exige `requireAdmin`

### Como testar

#### 2.1 translate-title — Sem auth (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/translate-title" \
  -H "Content-Type: application/json" \
  -d '{"title": "Engenheiro de Software", "target_language": "en"}'
```
**Esperado**: `401 Unauthorized`

#### 2.2 translate-title — Com JWT válido (deve funcionar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/translate-title" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_JWT>" \
  -d '{"title": "Engenheiro de Software", "target_language": "en"}'
```
**Esperado**: `200` com tradução

#### 2.3 analyze-post-for-upsell — Sem auth (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/analyze-post-for-upsell" \
  -H "Content-Type: application/json" \
  -d '{"post_content": "test"}'
```
**Esperado**: `401 Unauthorized`

#### 2.4 recommend-product — Sem auth (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/recommend-product" \
  -H "Content-Type: application/json" \
  -d '{"lead_id": "some-uuid"}'
```
**Esperado**: `401 Unauthorized`

#### 2.5 simulate-ticto-callback — Sem auth (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/simulate-ticto-callback" \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
```
**Esperado**: `401 Unauthorized`

#### 2.6 simulate-ticto-callback — Com JWT de student (deve rejeitar)
```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/simulate-ticto-callback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <STUDENT_JWT>" \
  -d '{"event": "test"}'
```
**Esperado**: `403 Forbidden: Admin role required`

#### 2.7 Teste via UI — translate-title
1. Login como qualquer usuário no hub
2. Ir para Currículo → Tradutor de Título
3. Traduzir um título
4. **Esperado**: Funciona normalmente (JWT enviado automaticamente pelo frontend)

#### 2.8 Teste via UI — recommend-product
1. Login como admin
2. Ir para Admin → Leads Dashboard → Abrir um lead → Tab "Relatório"
3. O relatório usa `recommend-product` internamente
4. **Esperado**: Funciona normalmente

---

## 3. Performance — Code Splitting (React.lazy)

### O que mudou
- 49 páginas convertidas de `import X from '...'` para `const X = lazy(() => import('...'))`
- `<Routes>` envolto em `<Suspense fallback={<Loader2 spinner>}>`
- Bundle principal: **5,318 KB → 4,479 KB (-16%)**

### Como testar

#### 3.1 Verificar lazy loading no Network tab
1. Abrir DevTools → Network → filtrar por JS
2. Navegar para `/admin/leads-dashboard`
3. **Esperado**: Arquivo `AdminLeadsDashboard-*.js` carregado sob demanda (não no bundle principal)
4. Navegar para `/admin/agendamentos`
5. **Esperado**: Arquivo `AdminAgendamentos-*.js` carregado sob demanda

#### 3.2 Verificar fallback de loading
1. Throttle network para "Slow 3G" no DevTools
2. Navegar para uma página admin
3. **Esperado**: Spinner de loading aparece brevemente enquanto o chunk carrega

#### 3.3 Verificar que páginas core carregam instantaneamente
Estas páginas NÃO foram lazy-loaded (estão no bundle principal):
- `/` (Index)
- `/login`
- `/register`
- `/dashboard` (StudentDashboard)
- `/hub` (StudentHub)
- `/mentor/dashboard` (MentorDashboard)
- `/admin` (AdminDashboard)

1. Fazer login
2. Navegar para `/dashboard`
3. **Esperado**: Carregamento instantâneo, sem spinner intermediário

#### 3.4 Verificar navegação entre páginas lazy
1. Login como admin
2. Navegar: Dashboard → Leads → Agendamentos → Usuários → Cursos → Automações
3. **Esperado**: Cada página carrega normalmente, sem erros no console
4. Voltar no histórico do browser (botão voltar)
5. **Esperado**: Páginas já cacheadas carregam instantaneamente

#### 3.5 Verificar deep link direto
1. Abrir diretamente: `https://hub.euanapratica.com/admin/automacoes`
2. **Esperado**: Página carrega normalmente (Suspense + lazy load funciona no primeiro acesso)

#### 3.6 Verificar tamanho do bundle
```bash
cd "c:\Users\I335869\ENP_HUB\hub-euanapratica"
npm run build 2>&1 | grep "index-.*\.js"
```
**Esperado**: Linha principal deve mostrar ~4,479 KB (antes era ~5,318 KB)

---

## 4. Config — app_configs para parâmetros LLM

### O que foi seedado
30+ registros na tabela `app_configs` com chaves para:

| Prefixo | Edge Function | Configs |
|---------|---------------|---------|
| `anthropic_api_version` | Todas LLM | `2023-06-01` |
| `analyze_resume_*` | analyze-resume | max_tokens=8000, max_chars=15000, timeout=120000 |
| `format_report_*` | format-lead-report | max_tokens=8000, timeout=50000 |
| `daily_priorities_*` | generate-daily-priorities | min=3000, max=8000, timeout=120000 |
| `recommend_product_*` | recommend-product | max_tokens=1024, timeout=50000 |
| `suggest_tasks_*` | suggest-lead-tasks | max_tokens=1500 |
| `suggest_whatsapp_*` | suggest-whatsapp-messages | max_tokens=1200 |
| `translate_title_*` | translate-title | max_tokens=4000 |
| `generate_weekly_report_*` | generate-weekly-report | max_tokens=4000, timeout=50000 |
| `content_studio_*` | content-studio | ideas=8000, insights=8000, script=6000, posts=3000 |
| `upsell_confidence_threshold` | analyze-post-for-upsell | 0.7 |
| `llm_default_max_tokens` | callLLM() genérico | 4000 |

### Como testar

#### 4.1 Verificar que os registros existem
No Supabase Dashboard → SQL Editor:
```sql
SELECT key, value, description
FROM app_configs
WHERE key LIKE '%max_tokens%'
   OR key LIKE '%timeout_ms%'
   OR key LIKE 'anthropic_%'
   OR key LIKE 'upsell_%'
   OR key LIKE 'llm_default_%'
ORDER BY key;
```
**Esperado**: ~30 registros com os valores listados acima

#### 4.2 Verificar que ON CONFLICT não duplicou
```sql
SELECT key, COUNT(*)
FROM app_configs
GROUP BY key
HAVING COUNT(*) > 1;
```
**Esperado**: 0 registros (nenhuma duplicata)

#### 4.3 Verificar que valores podem ser editados
1. Ir para Supabase Dashboard → Table Editor → `app_configs`
2. Encontrar `analyze_resume_max_tokens` (valor: `8000`)
3. Alterar para `9000` e salvar
4. **Esperado**: Valor atualizado com sucesso

#### 4.4 Teste funcional — Verificar que Edge Functions ainda funcionam
> **NOTA**: As Edge Functions ainda leem valores hardcoded. O próximo passo seria
> migrar cada função para ler de `app_configs`. Os seeds garantem que quando isso
> for feito, os valores default já estarão no banco.

1. Login como admin
2. Gerar um relatório de lead (format-lead-report)
3. **Esperado**: Funciona normalmente (valores hardcoded ainda ativos)

---

## 5. Performance — .limit() em Queries Admin

### O que mudou

| Hook | Antes | Depois |
|------|-------|--------|
| `useAdminBookings` | Sem limite | `.limit(200)` |
| `useAdminCourses` | Sem limite | `.limit(50)` |
| `useAdminIdeas` | Sem limite | `.limit(200)` |
| `useAdminWhatsAppFlows` | Sem limite, steps/sessions buscavam TODAS as linhas | `.limit(100)` + steps/sessions filtrados por `flow_id` |
| `useAdminUsers` | Sem limite | `.limit(200)` |

### Como testar

#### 5.1 Admin Bookings
1. Login como admin → `/admin/agendamentos`
2. **Esperado**: Lista de agendamentos carrega normalmente
3. Aplicar filtros (status, mentor, serviço)
4. **Esperado**: Filtros funcionam normalmente
5. Verificar no Network tab: resposta do Supabase tem no máximo 200 registros

#### 5.2 Admin Courses
1. Login como admin → `/admin/cursos`
2. **Esperado**: Lista de cursos carrega normalmente
3. **Esperado**: Contagem de módulos/aulas aparece corretamente em cada card

#### 5.3 Admin Ideas (Kanban)
1. Login como admin → `/admin/ideias`
2. **Esperado**: Kanban carrega com ideias nas colunas corretas
3. Arrastar uma ideia entre colunas
4. **Esperado**: Funciona normalmente

#### 5.4 Admin WhatsApp Flows
1. Login como admin → `/admin/whatsapp-flows`
2. **Esperado**: Lista de flows carrega normalmente
3. **Esperado**: Contagem de steps e sessões ativas aparece em cada card
4. Abrir um flow → verificar que steps carregam
5. **Esperado**: Funciona normalmente

#### 5.5 Admin Users
1. Login como admin → `/admin/usuarios`
2. **Esperado**: Lista de usuários carrega normalmente
3. Aplicar filtro de busca (nome ou email)
4. **Esperado**: Filtro funciona
5. Aplicar filtro de role (admin, student, etc)
6. **Esperado**: Filtro funciona

#### 5.6 Verificar limites via Network tab
Para qualquer das páginas acima:
1. DevTools → Network → filtrar por "rest" ou "supabase"
2. Observar o request para a tabela
3. Verificar que o header `Range` ou query param inclui o limite
4. **Esperado**: Response não excede o limite configurado

---

## Checklist Rápido

Use esta checklist para validação rápida:

- [ ] **Auth guard**: `curl` sem auth para `translate-title` retorna 401
- [ ] **Auth guard**: `curl` sem auth para `recommend-product` retorna 401
- [ ] **Auth guard**: `curl` sem auth para `analyze-post-for-upsell` retorna 401
- [ ] **Auth guard**: `curl` sem auth para `simulate-ticto-callback` retorna 401
- [ ] **Auth guard**: `simulate-ticto-callback` com JWT de student retorna 403
- [ ] **Secret**: `x-internal-secret` com valor errado retorna 401
- [ ] **Secret**: `x-internal-secret` com SERVICE_ROLE_KEY retorna 401 (não mais aceito)
- [ ] **Code split**: Network tab mostra chunks separados ao navegar entre páginas admin
- [ ] **Code split**: Bundle principal < 4,500 KB no build
- [ ] **Code split**: Páginas core (login, dashboard) carregam sem spinner
- [ ] **app_configs**: ~30 registros LLM existem na tabela
- [ ] **app_configs**: Sem duplicatas
- [ ] **Limits**: Admin Bookings carrega (max 200)
- [ ] **Limits**: Admin Courses carrega (max 50)
- [ ] **Limits**: Admin Ideas kanban carrega (max 200)
- [ ] **Limits**: Admin WhatsApp Flows carrega (max 100)
- [ ] **Limits**: Admin Users carrega (max 200)
- [ ] **UI funcional**: Todas as páginas admin navegáveis sem erro no console
- [ ] **UI funcional**: Tradução de título funciona (usuário logado)
- [ ] **UI funcional**: Geração de relatório funciona (admin)

---

## Como obter tokens JWT para testes curl

### JWT de admin
```js
// No console do browser, logado como admin:
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

### JWT de student
```js
// No console do browser, logado como student:
const { data } = await supabase.auth.getSession();
console.log(data.session.access_token);
```

### INTERNAL_FUNCTION_SECRET
Disponível no Supabase Dashboard → Settings → Edge Functions → Secrets, ou via:
```bash
npx supabase secrets list
```

---

## Rollback (se necessário)

### Auth guards
Se alguma Edge Function quebrar por causa do auth guard:
1. Reverter a mudança no arquivo `index.ts` da função
2. `npx supabase functions deploy <nome-da-funcao>`

### Code splitting
Se alguma página não carregar por lazy loading:
1. Reverter o `import` de `lazy(() => import(...))` para `import X from '...'`
2. `npm run build && npm run deploy` (ou via Vercel auto-deploy)

### app_configs
Registros usam `ON CONFLICT DO NOTHING` — são apenas seeds. Para remover:
```sql
DELETE FROM app_configs WHERE key IN (
  'analyze_resume_max_tokens', 'analyze_resume_max_chars', ...
);
```

### Query limits
Se alguma tabela admin não mostrar todos os registros esperados:
1. Aumentar o `.limit(N)` no hook correspondente
2. Rebuild
