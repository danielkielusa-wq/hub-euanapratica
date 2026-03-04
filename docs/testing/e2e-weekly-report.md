# E2E Test Plan — Weekly Intelligence Report

**Feature**: Weekly Intelligence Report (`/admin/inteligencia-semanal`) + Suggest Lead Tasks
**Version**: 1.3
**Last Updated**: 2026-03-03
**Changelog**: v1.3 — Adicionados TC-17 (Help Sheet), TC-18 (Settings Sheet), TC-19 (Suggest Lead Tasks), TC-20 (Métricas Brutas). TC-02 atualizado com seção Métricas Brutas. TC-11/TC-15 atualizados para referenciar Settings Sheet como caminho primário.

---

## Contexto do Sistema

### O que este sistema faz

O Weekly Intelligence Report e um sistema de Business Intelligence automatizado que:

1. **Agrega dados** de 8 fontes diferentes da plataforma (leads, funil, receita, agendamentos, engajamento, tarefas)
2. **Envia para IA** (LLM configuravel — OpenAI, Anthropic, OpenRouter) para gerar analise estruturada
3. **Salva o resultado** no banco de dados com status de tracking
4. **Dispara webhook N8N** para distribuicao por email, Telegram, etc.
5. **Expoe para a UI** em `/admin/inteligencia-semanal`

### Fluxo de dados completo

```
Admin clica "Gerar Agora"
        |
        v
[Frontend] supabase.functions.invoke('generate-weekly-report', { body })
        |
        v
[Edge Function: generate-weekly-report]
  ├── 1. requireAdmin() — verifica JWT ou x-internal-secret
  ├── 2. loadReportConfig() — le app_configs (prompt, api_key, period_days, max_hot_leads)
  ├── 3. INSERT row com status='generating' — UI comeca a mostrar skeleton
  ├── 4. Promise.all(8 queries) — agrega dados em paralelo (~3-5s)
  ├── 5. sanitizeForLLM() — merge name+email, remove IDs desnecessarios
  ├── 6. callLLM() — envia JSON para o modelo, recebe analise estruturada
  ├── 7. UPDATE row com status='completed', ai_analysis, raw_metrics, custo
  ├── 8. dispatchN8NWebhook() — dispara evento 'intelligence.weekly_report' (DEVE ser await)
  └── 9. UPDATE webhook_dispatched=true
        |
        v
[Frontend polling — refetchInterval: 3000ms enquanto status='generating']
        |
        v
[UI renderiza relatorio completo automaticamente]
```

### 8 Fontes de Dados Agregadas

| # | Fonte | O que captura |
|---|-------|---------------|
| 1 | **leads_pipeline** | Novos leads (semana atual vs anterior), temperatura, area, UTM source |
| 2 | **hot_leads_without_followup** | Leads quentes/muito-quentes SEM contato nos ultimos 7 dias |
| 3 | **re_engagement_opportunities** | Leads antigos (30+ dias) sem agendamentos + com acesso recente ao relatorio |
| 4 | **funnel_metrics** | Conversao entre etapas (lead → relatorio → agendamento → assinatura/compra) |
| 5 | **booking_activity** | Sessoes desta semana vs anterior, proximas 7 dias, no-shows, cancelamentos |
| 6 | **subscription_revenue** | Assinaturas ativas por plano, novas, canceladas, receita BRL |
| 7 | **engagement_signals** | Top posts da comunidade, visualizacoes de relatorio, interacoes WhatsApp |
| 8 | **task_health** | Tarefas vencidas, concluidas nesta semana, pendentes por prioridade |

### Geracao automatica (cron)

Todo **segunda-feira as 06:00 BRT (09:00 UTC)** o pg_cron executa:
```sql
SELECT invoke_edge_function('generate-weekly-report', '{"generation_method":"scheduled"}')
```
O cron usa `x-internal-secret` para autenticacao (sem usuario), entao `created_by` sera `NULL`.

### Dois publicos do relatorio

| Publico | O que usa | Como acessa |
|---------|-----------|-------------|
| Dona do negocio | Resumo executivo, metricas, alertas, comparativo | Admin UI `/admin/inteligencia-semanal` |
| Assistente de vendas | Leads quentes, pontos de conversa, briefing | Apenas relatorios aprovados via toggle de aprovacao |

### Secoes da UI do Relatorio

| # | Secao | Cor | Conteudo |
|---|-------|-----|---------|
| 1 | **Resumo Executivo** | Indigo | 3-5 bullets com emojis |
| 2 | **Leads Quentes sem Contato** | Vermelho | Tabela com nome, email, telefone, temperatura, area, ultimo contato, acao |
| 3 | **Oportunidades** | Verde | Cards com urgencia (high/medium/low), titulo, descricao, acao sugerida |
| 4 | **Alertas** | Ambar | Cards com severidade (critical/warning/info), titulo, descricao |
| 5 | **Pontos de Conversa** | Roxo | Lista com lead_name + opener + botao Copiar |
| 6 | **Comparativo Semanal** | Azul | Paragrafo comparando semana atual vs anterior |
| 7 | **Metricas Brutas** | Cinza | Colapsavel — 8 secoes expandiveis com JSON formatado |
| — | **Card de Aprovacao** | — | Toggle + textarea diretivas + botao Salvar Aprovacao |

---

## Prerequisitos para Teste

### 1. Acesso e ambiente

| Item | Onde encontrar |
|---|---|
| Admin account | Supabase Dashboard → Authentication → Users → encontre o user → Table Editor → `user_roles` com `role = 'admin'` |
| URL local | `http://localhost:5173/admin/inteligencia-semanal` |
| URL producao | `https://hub.euanapratica.com/admin/inteligencia-semanal` |
| Logs da Edge Function | Supabase Dashboard → Edge Functions → `generate-weekly-report` → Logs |
| SQL Editor | Supabase Dashboard → SQL Editor |

### 2. Dados minimos necessarios

**a) Leads quentes no banco**

O relatorio so mostra dados relevantes se existirem leads com temperatura quente/muito-quente. Verifique:

```sql
SELECT id, name, phone, lead_temperature, lead_priority_score, processing_status
FROM career_evaluations
WHERE lead_temperature IN ('quente', 'muito-quente')
  AND processing_status = 'completed'
ORDER BY lead_priority_score DESC NULLS LAST
LIMIT 10;
```

**O que fazer se nao tiver resultados**: Abra Admin → Leads, encontre qualquer lead com relatorio gerado, e mude manualmente o campo `lead_temperature` para `quente` ou `muito-quente` via Table Editor.

**Atenção**: As temperaturas devem estar em minusculo (`quente`, `muito-quente`). Se estiverem em maiusculo (`QUENTE`), a query nao vai encontrar. Verifique com:
```sql
SELECT DISTINCT lead_temperature FROM career_evaluations WHERE processing_status = 'completed';
```

**b) Configuracoes do relatorio (auto-populadas pela migration)**

```sql
SELECT key, value FROM app_configs WHERE key LIKE 'weekly_report%';
```

Deve retornar 5 linhas:

| key | valor esperado |
|-----|----------------|
| `weekly_report_prompt` | O texto do prompt (longo) |
| `weekly_report_api_key` | Slug de uma API ativa (ex: `openai_api`) |
| `weekly_report_period_days` | `7` |
| `weekly_report_max_hot_leads` | `20` |
| `weekly_report_cron_schedule` | `0 9 * * 1 (Seg 06:00 BRT)` |

Se nao existirem, rode a migration: `npx supabase db push --include-all`

**c) Uma API de IA ativa e configurada**

Navegue para **Admin → Configuracoes de APIs** (`/admin/configuracoes-apis`). Role para baixo ate o card **"LLM por Feature"**. A linha "Relatorio Semanal de Inteligencia" mostra um dropdown com a API atualmente selecionada.

Se mostrar "Selecionar API...", escolha uma (ex: OpenAI API) e clique **Salvar**.

Para verificar via SQL:
```sql
SELECT api_key, is_active, base_url
FROM api_configs
WHERE api_key = (SELECT value FROM app_configs WHERE key = 'weekly_report_api_key');
```
Deve retornar uma linha com `is_active = true`. Se nao retornar nada, a api_key configurada nao existe — reconfigure via UI.

---

## Cenarios de Teste

---

### TC-01 — Estado Vazio (Sem Relatorios)

**O que esta sendo testado**: Comportamento da UI quando nao ha nenhum relatorio gerado. A pagina deve carregar sem erros e exibir um estado vazio claro.

**Por que importa**: Uma pagina que quebra sem dados e um sinal de query sem tratamento de null ou componente sem estado vazio implementado.

**Setup**: Limpe todos os relatorios (apenas em ambiente de desenvolvimento):
```sql
DELETE FROM weekly_intelligence_reports;
```

**Como executar**:
1. Faca login como admin
2. Navegue para `/admin/inteligencia-semanal`

**O que observar**:
- A pagina carrega sem erros vermelhos no Console (DevTools)
- Header mostra "Inteligencia Semanal" com icone Brain
- Cards de status mostram "—" ou "Nenhum" para todos os campos
- No centro, um card com borda tracejada: "Nenhum relatorio gerado"
- Botao "Gerar Primeiro Relatorio" visivel
- Nenhuma query ao banco deve retornar erro (verifique Network tab — so deve aparecer um request para `weekly_intelligence_reports` que retorna vazio, nao erro 4xx/5xx)

---

### TC-02 — Geracao Manual (Caminho Feliz)

**O que esta sendo testado**: O fluxo completo de ponta a ponta — desde o clique do botao ate o relatorio renderizado na UI, passando pela Edge Function, 8 queries paralelas, LLM e salvamento no banco.

**Por que importa**: Este e o teste mais critico. Se falhar, nada mais funciona. Deve ser executado primeiro apos qualquer deploy da Edge Function.

**Setup**: Certifique-se que os prerequisitos (2a, 2b, 2c) estao todos atendidos.

**Como executar**:
1. Navegue para `/admin/inteligencia-semanal`
2. Clique no botao **"Gerar Agora"** (canto superior direito)
3. Observe a UI enquanto a geracao acontece (deve levar 15–40 segundos)
4. Aguarde o status mudar para "Completo"

**O que o Edge Function recebe**:
- Body: `{ "period_days": undefined, "generation_method": "manual" }`
- A funcao usara `weekly_report_period_days` do `app_configs` (padrao: `7`)
- O LLM usado sera o configurado no card "LLM por Feature"

**O que observar na UI**:
- Logo apos clicar: botao vira "Gerando...", skeleton aparece no lugar do conteudo, card amarelo "Gerando relatorio de inteligencia..." aparece
- Apos conclusao (sem refresh):
  - Status card mostra data, "Manual", "Completo", custo em USD
  - **Resumo Executivo**: bullets com emojis e dados especificos
  - **Leads Quentes**: tabela com nome, email, telefone, temperatura (badge colorido), area, ultimo contato, acao recomendada
  - **Oportunidades**: cards com urgencia (high/medium/low), titulo, descricao, acao sugerida
  - **Alertas**: cards com severidade (critical/warning/info), titulo, descricao
  - **Pontos de Conversa**: lista com botao "Copiar"
  - **Comparativo Semanal**: paragrafo com numeros
  - **Metricas Brutas**: card colapsavel com 8 secoes expandiveis (ver TC-20 para teste especifico)
  - **Card de Aprovacao** ao final

**O que verificar no banco**:
```sql
SELECT id, status, generation_method, model_used, tokens_used, cost_usd,
       duration_ms, webhook_dispatched, created_by
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```

| Campo | Valor esperado |
|-------|----------------|
| `status` | `completed` |
| `generation_method` | `manual` |
| `model_used` | ex: `openai/gpt-4o-mini` (nao null) |
| `tokens_used` | > 0 |
| `cost_usd` | > 0 |
| `duration_ms` | > 0 |
| `webhook_dispatched` | `true` |
| `created_by` | UUID do admin que clicou |

**O que verificar no log de custo**:
```sql
SELECT edge_function, provider, model, input_tokens, output_tokens, cost_usd, status
FROM api_cost_logs
ORDER BY created_at DESC LIMIT 3;
```
Deve haver uma linha com `edge_function = 'generate-weekly-report'`, `status = 'success'`, `cost_usd > 0`.

**Se o custo for $0.00**: O modelo pode nao estar na tabela de precificacao. Veja TC-10 para diagnostico.

---

### TC-03 — Estado de Geracao (Polling / Skeleton)

**O que esta sendo testado**: O mecanismo de polling automatico que atualiza a UI durante a geracao sem refresh manual.

**Por que importa**: A Edge Function leva 15–40 segundos. Sem polling, o usuario teria que recarregar a pagina para ver o resultado. O TanStack Query esta configurado com `refetchInterval: 3000` enquanto o status e `'generating'`.

**Como executar**:
1. Clique "Gerar Agora"
2. Nao recarregue a pagina
3. Observe a UI por 30–40 segundos

**O que observar**:
- Dentro de 1 segundo: UI mostra skeleton e card "Gerando..."
- A cada 3 segundos: o frontend re-consulta o banco (visivel na aba Network do DevTools — filtre por `weekly_intelligence_reports`)
- Quando o banco mudar `status` para `completed`: o skeleton desaparece e o relatorio aparece — sem nenhuma acao do usuario

**Como confirmar o polling**: Abra DevTools → Network → filtre por `weekly_intelligence_reports` — voce deve ver requests a cada ~3 segundos enquanto status e `generating`.

---

### TC-04 — Estado de Erro (Falha do LLM)

**O que esta sendo testado**: Que erros na geracao sao capturados, salvos no banco, e exibidos claramente na UI com mensagem acionavel.

**Por que importa**: Se o LLM retornar erro (quota esgotada, API key invalida, timeout), o sistema deve gravar o erro e manter o botao disponivel para nova tentativa — nao deixar a pagina em estado de carregamento infinito.

**Como simular** (opcao 1 — via UI):
Navegue para Admin → Configuracoes de APIs → LLM por Feature. Selecione uma API invalida ou inativa e salve. Clique "Gerar Agora". Depois restaure.

**Como simular** (opcao 2 — via SQL):
```sql
-- Invalida temporariamente
UPDATE app_configs SET value = 'chave_invalida' WHERE key = 'weekly_report_api_key';
-- ... execute o teste ...
-- Restaura
UPDATE app_configs SET value = 'openai_api' WHERE key = 'weekly_report_api_key';
```

**O que observar na UI**:
- Um card vermelho aparece com "Erro ao gerar relatorio"
- A mensagem de erro do banco e exibida (ex: "API key not found in api_configs")
- O botao "Gerar Agora" permanece disponivel para nova tentativa

**O que verificar no banco**:
```sql
SELECT status, error_message FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
```
- `status = 'error'`
- `error_message` nao e null e descreve o problema

---

### TC-05 — Validacao de Conteudo (Secao Leads Quentes)

**O que esta sendo testado**: Que o filtro de "sem follow-up em 7 dias" funciona corretamente — leads com contato recente nao aparecem, leads sem contato aparecem.

**Por que importa**: Esta e a secao mais critica para a assistente de vendas. Um lead que ja foi contactado ontem nao deve aparecer como "sem follow-up".

**Setup** — prepare dois leads:

**Lead A** (deve aparecer): Lead quente, SEM interacoes nos ultimos 7 dias.
```sql
-- Verificar se Lead A nao tem interacao recente
SELECT lead_id, MAX(created_at) as ultima
FROM lead_interactions
WHERE lead_id = '<lead_a_uuid>'
GROUP BY lead_id;
-- Se tiver interacao nos ultimos 7 dias, delete-a (ou escolha outro lead)
```

**Lead B** (NAO deve aparecer): Lead quente, COM interacao recente.
```sql
-- Adicionar interacao recente para Lead B
INSERT INTO lead_interactions (lead_id, type, channel, notes, created_at)
VALUES ('<lead_b_uuid>', 'call', 'phone', 'Contato de teste - TC-05', NOW());
```

**Como executar**:
1. Gere um novo relatorio (TC-02)
2. Encontre a secao "Leads Quentes sem Follow-up"

**O que observar**:
- Lead A aparece na tabela com email, telefone (se existir), badge de temperatura, data do ultimo contato
- Lead B NAO aparece (contato recente em menos de 7 dias)
- A coluna "Ultimo Contato" mostra a data para quem teve contato antes, e "Nunca" (em vermelho) para quem nunca teve
- Clicar no nome do lead abre `/admin/leads/<uuid>` com o perfil completo

**Limpeza**: Delete a interacao de teste do Lead B se quiser restaurar o estado original.

---

### TC-06 — Historico de Relatorios

**O que esta sendo testado**: Que o historico lista ate 12 relatorios passados e permite selecionar qualquer um para visualizacao.

**Por que importa**: O dono do negocio pode querer comparar relatorios de semanas diferentes ou revisar analises passadas sem perder o mais recente.

**Setup**: Gere pelo menos 3 relatorios (repita TC-02 tres vezes).

**Como executar**:
1. Na pagina `/admin/inteligencia-semanal`, clique no botao **"Historico"** (canto superior direito)
2. O painel desliza pela direita
3. Observe a lista

**O que observar**:
- Lista ordenada do mais recente para o mais antigo
- Cada item mostra: intervalo de datas (DD/MM – DD/MM), badge de status (Completo/Erro/Gerando), metodo (Manual/Agendado), duracao, icone de raio para webhook disparado
- Clicar em um item carrega AQUELE relatorio no painel principal
- O banner azul "Visualizando relatorio de X — Y" aparece quando um historico esta selecionado, com botao "Ver mais recente" para voltar
- Clicar no mesmo item novamente deseleciona e volta ao relatorio mais recente

**Confirmacao no banco**:
```sql
SELECT id, period_start, period_end, status, generation_method, cost_usd, created_at
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 12;
```
A lista deve bater exatamente com o que a UI mostra.

---

### TC-07 — Visualizacao de Relatorio Historico

**O que esta sendo testado**: Que ao selecionar um relatorio antigo do historico, a UI exibe os DADOS DAQUELE relatorio especifico — nao do mais recente.

**Por que importa**: O componente usa `useReportById(id)` quando um historico esta selecionado. Se estiver errado, todos os historicos mostrariam os mesmos dados.

**Setup**: Gere 2 relatorios com dados diferentes (ex: em dias diferentes, com diferentes volumes de leads).

**Como executar**:
1. Abra o historico e clique no segundo relatorio mais recente
2. Observe o conteudo principal

**O que observar**:
- O card de status mostra o intervalo de datas do relatorio selecionado (nao do mais recente)
- O resumo executivo e as secoes refletem OS DADOS daquele relatorio
- O botao "Gerar Agora" ainda gera um NOVO relatorio — nao sobrescreve o historico

---

### TC-08 — Aprovacao para Assistente

**O que esta sendo testado**: Que o toggle de aprovacao persiste no banco e as diretivas sao salvas corretamente.

**Por que importa**: A assistente de vendas acessa apenas o relatorio mais recente com `approved_for_assistant = true`. Se o toggle nao salvar, a assistente ficara sem acesso ao relatorio da semana.

**Como executar**:
1. Gere um relatorio (TC-02)
2. Role ate o final da pagina — localize o card **"Aprovacao para Assistente"**
3. Ative o toggle
4. No campo de diretivas, escreva: `"Foque nos leads quentes esta semana. Priorize consultoria sobre mentoria. Evite abordar leads com barreira familiar."`
5. Clique **"Salvar Aprovacao"**

**O que observar na UI**:
- Toast de sucesso: "Aprovacao atualizada"
- O toggle permanece ativado depois do save

**O que verificar no banco**:
```sql
SELECT id, approved_for_assistant, assistant_directives
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
- `approved_for_assistant = true`
- `assistant_directives` contem o texto que voce digitou

**Teste de revogacao**: Desative o toggle → clique "Salvar Aprovacao":
- `approved_for_assistant = false`
- A assistente nao ve mais este relatorio

**Onde a assistente acessa**: A interface da assistente consulta `weekly_intelligence_reports WHERE approved_for_assistant = true ORDER BY created_at DESC LIMIT 1`. Apenas o relatorio mais recente aprovado e exibido.

---

### TC-09 — Disparo do Webhook N8N

**O que esta sendo testado**: Que ao concluir a geracao, o webhook e disparado para o N8N com o payload correto.

**Por que importa**: O webhook e o canal pelo qual o relatorio chega ao email/Telegram da dona do negocio. Se falhar silenciosamente, os alertas semanais param de chegar.

**Setup**:
1. No Supabase Table Editor → `n8n_automations`, encontre a linha com `name = 'weekly_intelligence_report'`
2. Confirme `is_active = true`
3. O campo `webhook_url` deve apontar para seu N8N (ex: `https://n8n.euanapratica.com/webhook/...`). Para teste isolado, use um servico como `https://webhook.site` temporariamente.

**Como executar**:
1. Gere um relatorio (TC-02)
2. Apos conclusao, consulte os logs:

```sql
SELECT trigger_event, status_code, payload_preview, error_message, dispatched_at
FROM n8n_webhook_logs
WHERE trigger_event = 'intelligence.weekly_report'
ORDER BY dispatched_at DESC LIMIT 1;
```

**O que verificar**:
- `status_code = 200` (ou o codigo retornado pelo N8N/webhook.site)
- `error_message` e null
- `payload_preview` contem um trecho do payload enviado

**Estrutura do payload enviado ao N8N** (o que o N8N recebe):
```json
{
  "event": "intelligence.weekly_report",
  "report_id": "<uuid>",
  "period": { "start": "2026-02-20", "end": "2026-02-27" },
  "executive_summary": "...",
  "hot_leads_count": 5,
  "new_leads_count": 12,
  "bookings_this_week": 3,
  "revenue_this_week_brl": 2400.00,
  "alerts_count": 2,
  "ai_analysis": { ... },
  "report_url": "https://hub.euanapratica.com/admin/inteligencia-semanal"
}
```

**Importante**: O payload NAO inclui `raw_metrics` (para reducao de tamanho) e NAO inclui dados pessoais como emails dos leads.

**Se webhook_url for null**: O sistema completa sem erro. `webhook_dispatched` permanece `false`. Comportamento esperado — N8N e opcional.

**Verificacao complementar**:
```sql
SELECT webhook_dispatched FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
-- Deve ser true
```

---

### TC-10 — Rastreamento de Custo

**O que esta sendo testado**: Que cada geracao registra o custo do LLM em `api_cost_logs` com provedor, modelo e custo nao-zero.

**Por que importa**: O custo acumulado e visivel em Admin → Custos de API. Se nao for registrado, o admin perde visibilidade sobre o gasto mensal com IA.

**Como executar**:
1. Gere um relatorio (TC-02)
2. Consulte:

```sql
SELECT edge_function, provider, model, input_tokens, output_tokens, cost_usd, duration_ms, status, metadata
FROM api_cost_logs
WHERE edge_function = 'generate-weekly-report'
ORDER BY created_at DESC LIMIT 1;
```

**O que verificar**:

| Campo | Valor esperado |
|-------|----------------|
| `edge_function` | `generate-weekly-report` |
| `provider` | `openai`, `anthropic` ou `openrouter` |
| `model` | Nome do modelo configurado |
| `input_tokens` | > 500 (o prompt e grande — 8 blocos de dados) |
| `output_tokens` | > 200 (JSON de analise) |
| `cost_usd` | > 0 (nao null, nao zero) |
| `status` | `success` |

**Se `cost_usd` for $0.00 ou null**, diagnosticar:
1. Verifique `metadata->>'cost_warning'` — vai dizer algo como `"model_not_in_pricing:gpt-4o-mini"`
2. Adicione o modelo na tabela de precificacao em `app_configs → llm_model_pricing`:
```sql
-- Ver precificacao atual
SELECT value FROM app_configs WHERE key = 'llm_model_pricing';
-- O modelo OpenRouter usa prefixo: "openai/gpt-4o-mini", nao "gpt-4o-mini"
```
3. Se `status = 'error'` no log de custo, o LLM retornou erro (verifique `error_message`)

**Verificacao na UI**: Navegue para `/admin/custos-api` — a geracao do relatorio deve aparecer na tabela de custos por funcao.

---

### TC-11 — Selecao de LLM via Settings Sheet

**O que esta sendo testado**: Que trocar a API de IA pela Settings Sheet (dentro da propria pagina do relatorio) aplica no proximo relatorio gerado.

**Por que importa**: O `app_configs → weekly_report_api_key` e lido em RUNTIME pela Edge Function. Trocar o valor deve se refletir imediatamente no proximo relatorio sem necessidade de redeploy. Agora ha dois caminhos para fazer isso: Settings Sheet (direto na pagina) ou Admin → Configuracoes de APIs.

**Caminho primario — Settings Sheet na pagina do relatorio**:
1. Navegue para `/admin/inteligencia-semanal`
2. Clique no botao **"Configuracoes"** (icone de engrenagem, canto superior direito)
3. O painel de configuracoes desliza pela direita
4. No seletor **"LLM / API de IA"**, escolha uma API diferente da atual
5. Clique **"Salvar"**

**O que observar na UI**:
- Toast: "Configuracao salva"
- O dropdown mostra a nova API

**Verificacao no banco**:
```sql
SELECT value FROM app_configs WHERE key = 'weekly_report_api_key';
-- Deve ser o slug da API que voce selecionou (ex: 'anthropic_api')
```

**Confirmacao funcional**:
6. Feche o Settings Sheet
7. Clique "Gerar Agora"
8. Apos conclusao:
```sql
SELECT model_used FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
-- O modelo deve ser do provedor novo, nao do anterior
```

**Tambem verifique em `api_cost_logs`**:
```sql
SELECT provider, model FROM api_cost_logs
WHERE edge_function = 'generate-weekly-report'
ORDER BY created_at DESC LIMIT 1;
-- provider deve refletir o novo provedor
```

**Caminho alternativo**: Admin → Configuracoes de APIs → LLM por Feature — produz o mesmo resultado via interface diferente.

---

### TC-12 — Periodo Customizado (Relatorio de 30 dias)

**O que esta sendo testado**: Que o parametro `period_days` modifica a janela de agregacao de dados.

**Por que importa**: O relatorio padrao usa 7 dias. Mas o usuario pode querer uma analise mensal de vez em quando. O parametro deve funcionar corretamente para qualquer valor.

**Como executar** (via DevTools Console do navegador):
```javascript
// Execute no console do browser enquanto logado como admin
const { data, error } = await window.__supabase?.functions.invoke('generate-weekly-report', {
  body: { period_days: 30, generation_method: 'manual' }
});
console.log(data, error);
```

Alternativa: Supabase Dashboard → Edge Functions → `generate-weekly-report` → Test → envie o body `{"period_days": 30, "generation_method": "manual"}` (com o header `Authorization: Bearer <seu_jwt_admin>`).

**O que verificar no banco**:
```sql
SELECT
  period_start,
  period_end,
  (period_end::date - period_start::date) AS days_covered,
  raw_metrics -> 'leads_pipeline' -> 'this_week' -> 'total' AS leads_this_period
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
- `days_covered` deve ser ~30 (28–32 dias dependendo do calculo exato)
- `leads_this_period` deve ser maior do que em um relatorio de 7 dias (mais leads em 30 dias)

---

### TC-13 — Seguranca: Controle de Acesso

**O que esta sendo testado**: Que apenas admins conseguem acessar a pagina e invocar a Edge Function.

**Por que importa**: O relatorio contem dados sensiveis de leads (emails, telefones, barreiras pessoais). Um usuario estudante ou lead NAO pode ter acesso.

#### 13a — Acesso via UI (nao-admin)

**Setup**: Faca login com uma conta que NAO seja admin (conta de estudante ou lead).

**Executar**: Navegue para `/admin/inteligencia-semanal`

**Esperado**: Redirecionamento para `/` ou `/dashboard`, ou mensagem de "Acesso negado". O conteudo do relatorio NAO deve ser visivel.

#### 13b — Chamada direta sem autenticacao

```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/generate-weekly-report' \
  -H 'Content-Type: application/json' \
  -d '{"period_days": 7}'
```

**Esperado**: HTTP `401` com body `{"error": "Unauthorized"}`

#### 13c — Chamada com JWT de estudante

```bash
# Obtenha o JWT do estudante via DevTools → Application → Local Storage → chave do Supabase
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/generate-weekly-report' \
  -H 'Authorization: Bearer <jwt_do_estudante>' \
  -H 'Content-Type: application/json' \
  -d '{"period_days": 7}'
```

**Esperado**: HTTP `403` com body `{"error": "Forbidden: Admin role required"}`

---

### TC-14 — Geracao Agendada (Simulacao do Cron)

**O que esta sendo testado**: Que o caminho de autenticacao do cron (`x-internal-secret`) funciona sem JWT de usuario.

**Por que importa**: O cron de segunda nao tem um usuario logado — ele usa o secret interno. Se esse caminho nao funcionar, o relatorio automatico de segunda falha silenciosamente.

**Como executar**:

1. Obtenha o secret:
```sql
SELECT value FROM app_configs WHERE key = 'internal_function_secret';
```

2. Simule a chamada do cron:
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/generate-weekly-report' \
  -H 'x-internal-secret: <valor_do_secret>' \
  -H 'Content-Type: application/json' \
  -d '{"generation_method": "scheduled"}'
```

**Esperado**: HTTP `200` com `{ "report_id": "...", "status": "completed", ... }`

**Verificacao no banco**:
```sql
SELECT generation_method, created_by FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
```
- `generation_method = 'scheduled'`
- `created_by = NULL` (cron nao tem usuario)

**Para verificar o cron real de segunda-feira**: Supabase Dashboard → Database → Extensions → pg_cron → clique em "Job Run Details" para o job `generate-weekly-intelligence-report`. Status deve ser `succeeded`.

---

### TC-15 — Prompt Customizado via Settings Sheet

**O que esta sendo testado**: Que o Edge Function le o prompt em runtime do banco, nao de um valor hardcoded, e que a edicao via Settings Sheet aplica na proxima geracao.

**Por que importa**: O prompt e o principal mecanismo de controle da qualidade da analise. Deve ser possivel atualizar via Settings Sheet sem redeploy.

**Caminho primario — Settings Sheet na pagina do relatorio**:
1. Navegue para `/admin/inteligencia-semanal`
2. Clique no botao **"Configuracoes"** (icone de engrenagem)
3. No campo **"Prompt de Analise"**, adicione ao final: `SEMPRE inclua a frase "RELATORIO-VALIDADO-TC15" no campo executive_summary.`
4. Clique **"Salvar"**
5. Feche o painel e clique "Gerar Agora"
6. No Resumo Executivo, verifique se o texto "RELATORIO-VALIDADO-TC15" aparece

**Opcao alternativa — via SQL** (para verificacao/restauracao):
```sql
-- Adicionar marcador de teste
UPDATE app_configs
SET value = value || E'\n\nSEMPRE inclua a frase "RELATORIO-VALIDADO-TC15" no campo executive_summary.'
WHERE key = 'weekly_report_prompt';

-- Gere um relatorio via UI ou cURL
-- Verifique o resultado
SELECT ai_analysis -> 'executive_summary' FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;

-- Restaurar
UPDATE app_configs
SET value = LEFT(value, LENGTH(value) - LENGTH(E'\n\nSEMPRE inclua a frase "RELATORIO-VALIDADO-TC15" no campo executive_summary.'))
WHERE key = 'weekly_report_prompt';
```

**Esperado**: O campo `executive_summary` contem "RELATORIO-VALIDADO-TC15" (ou variacao interpretada pelo LLM).

---

### TC-16 — Emails nos Leads (Nao Truncados)

**O que esta sendo testado**: Que os emails dos leads aparecem completos no relatorio — tanto na tabela de leads quentes quanto no texto gerado pelo LLM.

**Por que importa**: Os emails sao essenciais para a assistente identificar unicamente cada lead. Um email truncado como "paulo@.." e inutilizavel.

**Mecanismo implementado**: O Edge Function faz merge de `name + email` no campo `name` antes de enviar ao LLM (`"Maria Silva (maria@email.com)"`). Assim, sempre que o LLM menciona o nome, o email vai junto automaticamente — sem depender de instrucoes de formatacao.

**Como executar**:
1. Garanta que pelo menos um lead quente tem email preenchido no banco:
```sql
SELECT name, email, lead_temperature FROM career_evaluations
WHERE lead_temperature IN ('quente', 'muito-quente')
  AND email IS NOT NULL AND email != ''
  AND processing_status = 'completed'
LIMIT 5;
```
2. Gere um relatorio (TC-02)
3. Na UI, verifique:
   - Tabela "Leads Quentes": coluna Email mostra o email completo (sem truncamento)
   - Texto do "Briefing de Leads Quentes": os emails aparecem no formato `Nome (email@completo.com)`
   - Secao "Pontos de Conversa": os emails aparecem nos nomes dos leads (ex: `"lead_name": "Maria Silva (maria@gmail.com)"`)

**Como verificar no banco**:
```sql
SELECT
  ai_analysis -> 'hot_leads_briefing' AS briefing,
  ai_analysis -> 'sales_talking_points' AS pontos
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
Os valores devem conter emails completos com `@` e dominio completo, nunca com `...` ou truncados.

---

### TC-17 — Help Sheet (Painel de Ajuda)

**O que esta sendo testado**: Que o botao de ajuda abre o painel correto com todas as 8 secoes informativas, e que os links internos funcionam.

**Por que importa**: A Help Sheet e a documentacao inline do sistema para o admin. Se alguma secao estiver faltando ou com conteudo errado, o usuario pode configurar incorretamente a ferramenta.

**Como executar**:
1. Navegue para `/admin/inteligencia-semanal`
2. Clique no botao **"Ajuda"** (icone de ponto de interrogacao, canto superior direito)
3. O painel desliza pela direita

**O que observar**:
- O painel abre com titulo "Guia do Relatorio Semanal" (ou similar)
- Deve haver 8 secoes colapsaveis:
  1. **Visao Geral do Sistema**: mostra o fluxo de dados com as 8 fontes → LLM → salvo → webhook
  2. **O que cada secao significa**: explica todas as 7 secoes visiveis do relatorio
  3. **Fontes de dados**: descreve as 8 fontes de dados
  4. **Aprovacao para Assistente**: explica como o toggle de aprovacao funciona
  5. **Configuracoes**: menciona editor de prompt e seletor de LLM (com link para Admin → Configuracoes de APIs)
  6. **Custo e Monitoramento**: faixa tipica de custo ($0.001–$0.01), onde verificar logs
  7. **Webhook N8N**: como configurar, quando e disparado
  8. **Agendamento Automatico (Cron)**: segunda-feira 06:00 BRT (09:00 UTC)
- Clicar em cada secao a expande/colapsa corretamente
- O link para `/admin/custos-api` na secao de Custo funciona (abre a pagina correta)
- Fechar o painel (X ou clique fora) funciona sem erros no console

---

### TC-18 — Settings Sheet (Configuracoes Inline)

**O que esta sendo testado**: Que o painel de configuracoes dentro da propria pagina do relatorio permite editar o prompt E trocar a API de IA, persistindo ambas as mudancas no banco.

**Por que importa**: O Settings Sheet centraliza a configuracao do relatorio sem sair da pagina. E o caminho mais rapido para ajustar o LLM ou o prompt entre geracoes.

**Como executar**:
1. Navegue para `/admin/inteligencia-semanal`
2. Clique no botao **"Configuracoes"** (icone de engrenagem, canto superior direito)

**O que observar na abertura**:
- Painel desliza pela direita
- Campo **"LLM / API de IA"**: dropdown mostrando a API atual (filtra APIs de email/webhook, mostra apenas APIs de LLM)
- Campo **"Prompt de Analise"**: textarea com 16 linhas exibindo o prompt completo atual do banco

**Teste de edicao do prompt**:
3. Adicione uma linha ao final do prompt: `# Teste TC-18`
4. Clique **"Salvar"**
5. Toast de sucesso deve aparecer
6. Feche e reabra o Settings Sheet — o prompt deve conter a linha adicionada (confirmando persistencia)
7. Verifique via SQL:
```sql
SELECT RIGHT(value, 15) FROM app_configs WHERE key = 'weekly_report_prompt';
-- Deve terminar com '# Teste TC-18'
```
8. Remova a linha de teste e salve novamente

**Teste de troca de API**:
9. Se houver multiplas APIs LLM configuradas, selecione uma diferente no dropdown
10. Clique **"Salvar"**
11. Verifique via SQL:
```sql
SELECT value FROM app_configs WHERE key = 'weekly_report_api_key';
-- Deve ser o slug da nova API
```

**Teste do botao Desfazer**:
12. Edite o prompt sem salvar
13. Clique **"Desfazer"** (ou botao equivalente de undo)
14. O prompt deve voltar ao valor original (antes das edicoes nao salvas)

**Nota sobre conflito**: Se TC-11 e TC-15 ja foram executados nesta sessao, restaure os valores antes de iniciar TC-18.

---

### TC-19 — Suggest Lead Tasks (Sugestao de Tarefas por Lead)

**O que esta sendo testado**: O fluxo completo da funcionalidade `suggest-lead-tasks` — desde a invocacao ate a renderizacao das sugestoes com mensagens WhatsApp prontas.

**Por que importa**: Esta funcionalidade complementa o relatorio semanal: o relatorio identifica QUAIS leads precisam de atencao; o suggest-lead-tasks define COMO abordar cada lead individualmente com acoes concretas e mensagens prontas.

**Contexto do sistema**: A Edge Function `suggest-lead-tasks`:
- Auth: `requireAdminOrAssistant` (admin E assistente de vendas tem acesso)
- Input: `{ lead_id: string }`
- Analisa: perfil completo do lead (30+ campos), ultimas 60 dias de interacoes, tarefas pendentes existentes
- Retorna: 2–5 tarefas sugeridas com prioridade, tipo, prazo, raciocinio estrategico e mensagem WhatsApp pronta
- Primeira sugestao: sempre envia link do relatorio por WhatsApp (se `report_url` disponivel)

**Configuracoes no banco** (auto-populadas):
```sql
SELECT key, value FROM app_configs WHERE key LIKE 'suggest_tasks%';
```
Deve retornar:
- `suggest_tasks_prompt`: texto do prompt
- `suggest_tasks_api_config`: slug da API (padrao: `anthropic_api`)
- `suggest_tasks_max_tokens`: `3000`

**Como executar**:

1. Obtenha o UUID de um lead quente com relatorio completo:
```sql
SELECT id, name, lead_temperature FROM career_evaluations
WHERE lead_temperature IN ('quente', 'muito-quente')
  AND processing_status = 'completed'
ORDER BY lead_priority_score DESC LIMIT 1;
```

2. Navegue para `/admin/leads/<lead_uuid>` na UI e localize o botao de sugestao de tarefas (ex: "Sugerir Tarefas" ou similar)

3. Clique no botao — aguarde 10–20 segundos para o LLM processar

**Alternativa via cURL** (para testar a funcao isolada):
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/suggest-lead-tasks' \
  -H 'Authorization: Bearer <jwt_admin>' \
  -H 'Content-Type: application/json' \
  -d '{"lead_id": "<lead_uuid>"}'
```

**O que verificar na resposta** (estrutura esperada):
```json
{
  "suggestions": [
    {
      "title": "Enviar link do relatorio de diagnostico",
      "description": "Primeiro passo: compartilhar o relatorio...",
      "type": "follow_up",
      "priority": "urgent",
      "due_in_days": 0,
      "reasoning": "Lead nao recebeu o relatorio ainda...",
      "whatsapp_message": "Ola [Nome], vi seu perfil e preparei uma analise..."
    },
    {
      "title": "Segunda sugestao especifica ao lead",
      ...
    }
  ]
}
```

**O que verificar campo por campo**:

| Campo | Esperado |
|-------|----------|
| `suggestions` | Array com 2–5 itens |
| `title` | Texto curto e acionavel |
| `type` | Um de: `follow_up`, `contact`, `review`, `convert` |
| `priority` | Um de: `low`, `medium`, `high`, `urgent` |
| `due_in_days` | Inteiro >= 0 |
| `reasoning` | Estrategia explicada (menciona o lead especifico) |
| `whatsapp_message` | Mensagem pronta para envio, ou null |

**Verificar custo no banco**:
```sql
SELECT edge_function, provider, model, cost_usd, status
FROM api_cost_logs
WHERE edge_function = 'suggest-lead-tasks'
ORDER BY created_at DESC LIMIT 1;
```
- `status = 'success'`
- `cost_usd > 0`

**Teste de seguranca — chamada sem auth**:
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/suggest-lead-tasks' \
  -H 'Content-Type: application/json' \
  -d '{"lead_id": "<qualquer_uuid>"}'
```
**Esperado**: HTTP `401`

**Teste de seguranca — chamada com JWT de estudante comum** (nao admin, nao assistant):
- **Esperado**: HTTP `403` — a funcao rejeita quem nao tem role `admin` ou `assistant`

**Teste de lead inexistente**:
```bash
curl -X POST \
  'https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/suggest-lead-tasks' \
  -H 'Authorization: Bearer <jwt_admin>' \
  -H 'Content-Type: application/json' \
  -d '{"lead_id": "00000000-0000-0000-0000-000000000000"}'
```
**Esperado**: HTTP `404` ou resposta de erro descritiva (nao deve quebrar com 500)

---

### TC-20 — Metricas Brutas (Secao Colapsavel)

**O que esta sendo testado**: Que a secao "Metricas Brutas" exibe corretamente as 8 fontes de dados coletadas pela Edge Function, e que o UI de expansao/colapsamento funciona.

**Por que importa**: As metricas brutas sao a "prova de trabalho" do relatorio — permitem ao admin auditar se os dados estao sendo agregados corretamente antes de confiar na analise do LLM.

**Setup**: Gere um relatorio com dados reais (TC-02).

**Como executar**:
1. Apos a geracao, role ate a secao **"Metricas Brutas"** (penultima secao, antes do Card de Aprovacao)
2. A secao aparece colapsada por padrao
3. Clique no header para expandir

**O que observar na expansao**:
- 8 sub-secoes, cada uma com um icone de expansao:
  1. **leads_pipeline** — contagens de leads novos por temperatura, area, UTM
  2. **hot_leads_without_followup** — lista de leads quentes sem contato recente
  3. **re_engagement_opportunities** — oportunidades de reengajamento
  4. **funnel_metrics** — taxas de conversao por etapa
  5. **booking_activity** — agendamentos da semana
  6. **subscription_revenue** — receita e assinaturas ativas
  7. **engagement_signals** — posts, visualizacoes, WhatsApp
  8. **task_health** — saude das tarefas

**O que verificar por sub-secao**:
- Cada sub-secao expande ao clicar
- O conteudo e exibido como JSON formatado (indentado, legivel)
- A altura maxima e limitada (scroll interno, nao expande a pagina indefinidamente)
- Os dados batem com a realidade: ex. `subscription_revenue.active_count` deve ser o numero de assinaturas ativas que voce sabe que existe

**Verificacao no banco**:
```sql
SELECT
  raw_metrics -> 'leads_pipeline' AS pipeline,
  raw_metrics -> 'hot_leads_without_followup' AS hot_leads,
  raw_metrics -> 'booking_activity' AS bookings,
  raw_metrics -> 'subscription_revenue' AS revenue
FROM weekly_intelligence_reports
ORDER BY created_at DESC LIMIT 1;
```
Os valores devem bater com o que aparece na UI.

**Teste de colapso**: Clique novamente no header — a secao deve colapsar sem erros no console.

---

## Guia de Troubleshooting

### Problema: Relatorio fica em "Gerando..." indefinidamente

**Causa mais provavel**: A Edge Function foi encerrada por timeout ou lancou um erro nao capturado.

**Diagnostico**:
```sql
SELECT status, error_message, duration_ms FROM weekly_intelligence_reports ORDER BY created_at DESC LIMIT 1;
```
Se `status = 'error'`, leia o `error_message`. Se ainda e `generating` ha mais de 60s, verifique os logs da Edge Function: Supabase Dashboard → Edge Functions → `generate-weekly-report` → Logs.

---

### Problema: "Erro ao gerar relatorio" na UI — API key not found

**Causa**: `app_configs → weekly_report_api_key` aponta para uma api_key que nao existe em `api_configs`.

**Solucao**:
```sql
-- Ver o que esta configurado
SELECT value FROM app_configs WHERE key = 'weekly_report_api_key';
-- Verificar se existe em api_configs
SELECT api_key, is_active FROM api_configs;
```
Depois atualize via Settings Sheet (icone de engrenagem na pagina do relatorio).

---

### Problema: Custo sempre $0.00

**Causa mais provavel**: O modelo retornado pelo LLM nao esta na tabela de precificacao.

**Diagnostico**:
```sql
SELECT metadata->>'cost_warning' FROM api_cost_logs
WHERE edge_function = 'generate-weekly-report'
ORDER BY created_at DESC LIMIT 1;
-- Retorna algo como: "model_not_in_pricing:openai/gpt-4o-mini"
```

**Solucao**: Adicione o modelo (com e sem prefixo do provedor) na config:
```sql
-- Ver precificacao atual
SELECT value::jsonb FROM app_configs WHERE key = 'llm_model_pricing';
-- Adicione o modelo ausente via UPDATE no JSON
```

---

### Problema: Emails nao aparecem no texto do LLM

**Causa provavel**: O lead nao tem email no banco (campo `email = NULL`).

**Verificar**:
```sql
SELECT name, email FROM career_evaluations
WHERE lead_temperature IN ('quente', 'muito-quente') AND processing_status = 'completed'
ORDER BY lead_priority_score DESC LIMIT 10;
```
Se `email` for NULL para todos os leads, preencha os emails no banco. O sistema so inclui emails no merge quando o campo existe.

---

### Problema: Leads quentes nao aparecem na tabela

**Causas possiveis**:
1. Todos os leads quentes tiveram contato nos ultimos 7 dias (filtragem correta — nao e bug)
2. `lead_temperature` esta em maiusculo (`QUENTE` em vez de `quente`)
3. `processing_status` nao e `completed`

**Diagnostico**:
```sql
SELECT DISTINCT lead_temperature FROM career_evaluations WHERE processing_status = 'completed';
```
Se aparecer `QUENTE` ou `MUITO-QUENTE`, converta para minusculo:
```sql
UPDATE career_evaluations
SET lead_temperature = LOWER(lead_temperature)
WHERE lead_temperature != LOWER(lead_temperature);
```

---

### Problema: Webhook nao disparado (`webhook_dispatched = false`)

**Causas possiveis**:
1. `webhook_url` e null na tabela `n8n_automations` — configure em Admin → Automacoes
2. `is_active = false` na automacao — ative em Admin → Automacoes
3. O servidor N8N retornou erro — verifique `n8n_webhook_logs.error_message`

```sql
SELECT is_active, webhook_url FROM n8n_automations WHERE name = 'weekly_intelligence_report';
SELECT status_code, error_message FROM n8n_webhook_logs
WHERE trigger_event = 'intelligence.weekly_report'
ORDER BY dispatched_at DESC LIMIT 3;
```

---

### Problema: suggest-lead-tasks retorna sugestoes genericas (nao personalizadas ao lead)

**Causa provavel**: O lead nao tem dados ricos — sem interacoes, sem barreiras preenchidas, sem produto recomendado.

**Diagnostico**:
```sql
SELECT
  name, email, phone,
  lead_temperature, lead_priority_score, rota_letter,
  english_barrier, financial_barrier, family_barrier,
  preferred_communication, best_contact_time,
  recommended_product
FROM career_evaluations
WHERE id = '<lead_uuid>';
```
Quanto mais campos preenchidos, mais especificas as sugestoes. Com perfil vazio, o LLM vai gerar sugestoes genericas — isso e comportamento esperado, nao bug.

---

### Problema: Settings Sheet nao carrega o prompt atual

**Causa provavel**: `app_configs → weekly_report_prompt` nao existe ou tem permissao insuficiente.

**Diagnostico**:
```sql
SELECT key, LENGTH(value) AS prompt_length FROM app_configs WHERE key = 'weekly_report_prompt';
-- Deve retornar uma linha com prompt_length > 500
```
Se nao retornar, rode a migration. Se retornar mas a UI nao carrega, verifique se o RLS de `app_configs` permite leitura para `authenticated`.

---

## Checklist de Regressao

Apos qualquer mudanca na Edge Function ou nos componentes React, execute este checklist minimo:

| Verificacao | Como testar |
|---|---|
| Pagina carrega sem erro de console | DevTools → Console, nenhum erro vermelho |
| Botao "Gerar Agora" dispara geracao | Status muda para "Gerando..." em < 2s |
| Skeleton aparece durante geracao | Observe a UI nos primeiros 5s |
| Todas as 6 secoes de conteudo renderizam | Role pelo relatorio completo |
| Secao Metricas Brutas colapsa/expande | Clique no header, verify 8 sub-secoes |
| Emails aparecem completos nos leads | Tabela de leads quentes, coluna Email |
| Emails aparecem no texto do LLM | Briefing e Pontos de Conversa |
| Links de leads funcionam | Clique em nome na tabela de leads |
| Botao Copiar funciona | Clique "Copiar" em um ponto de conversa, cole num editor |
| Historico abre e carrega | Clique "Historico", selecione um item |
| Help Sheet abre com 8 secoes | Clique "Ajuda", expanda cada secao |
| Settings Sheet abre com prompt e API | Clique "Configuracoes", verificar conteudo |
| Settings Sheet salva prompt | Edite prompt, salve, reabra — deve persistir |
| Settings Sheet salva API | Troque API, salve, verifique app_configs |
| Aprovacao salva no banco | Toggle + texto + salvar, verificar DB |
| Webhook foi disparado | `webhook_dispatched = true` no DB |
| Custo foi registrado | `api_cost_logs` tem linha com custo > 0 |
| LLM por Feature reflete config atual | Admin → Configuracoes de APIs |
| Trocar LLM aplica no proximo relatorio | Mudar API via Settings Sheet, gerar, verificar `model_used` no DB |
| suggest-lead-tasks retorna JSON valido | cURL com lead_uuid, verificar estrutura |
| suggest-lead-tasks rejeita nao-autorizados | cURL sem auth → 401, estudante → 403 |

---

## Limitacoes Conhecidas / Fora de Escopo

- **Cron real de segunda**: So pode ser verificado esperando segunda-feira ou simulando via `x-internal-secret` (TC-14)
- **Acoes downstream do N8N**: O que o N8N faz com o payload (envia email, mensagem no Telegram, etc.) e testado na suite do proprio N8N, nao aqui
- **Qualidade do conteudo da IA**: A relevancia dos insights e uma avaliacao subjetiva — revise 2–3 relatorios por mes com as partes interessadas do negocio
- **Fallback de API**: Se a API primaria cair e o fallback ativar, verifique `api_cost_logs.metadata` para `"used_fallback": true`. Teste completo de fallback exige desabilitar a cota da API primaria temporariamente
- **UI do suggest-lead-tasks**: O test TC-19 cobre a Edge Function via cURL. O teste da UI depende de onde o botao esta integrado na pagina de detalhes do lead — adaptar conforme a implementacao atual
