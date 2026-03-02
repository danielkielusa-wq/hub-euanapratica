# Guia de Testes — Agenda Semanal + Notificacoes Diarias

> Cobre: UI da agenda, Edge Function `send-daily-agenda`, pg_cron, N8N e troubleshooting.
>
> Ultima atualizacao: 2026-03-03

---

## Sumario

- [Prerequisitos](#prerequisitos)
- [1. Testes de UI](#1-testes-de-ui)
- [2. Teste da Edge Function via UI](#2-teste-da-edge-function-via-ui)
- [3. Teste da Edge Function via curl](#3-teste-da-edge-function-via-curl)
- [4. Verificar pg_cron](#4-verificar-pg_cron)
- [5. Testar N8N Webhook](#5-testar-n8n-webhook)
- [6. Verificar Telegram](#6-verificar-telegram)
- [7. Verificar Email](#7-verificar-email)
- [Troubleshooting](#troubleshooting)
- [Checklist completo](#checklist-completo)

---

## Prerequisitos

Antes de testar notificacoes, confirme que os seguintes secrets estao configurados no Supabase:

```
Supabase Dashboard → Edge Functions → Secrets
```

| Secret | Status | Como obter |
|--------|--------|------------|
| `TELEGRAM_BOT_TOKEN` | Obrigatorio para Telegram | @BotFather → /newbot |
| `TELEGRAM_CHAT_ID` | Obrigatorio para Telegram | @userinfobot → Id: |
| `ADMIN_NOTIFICATION_EMAIL` | Obrigatorio para Email | Seu email pessoal |
| `INTERNAL_FUNCTION_SECRET` | Ja deve existir | `app_configs.internal_function_secret` |

Para verificar se o secret `INTERNAL_FUNCTION_SECRET` existe:

```sql
SELECT value FROM app_configs WHERE key = 'internal_function_secret';
```

---

## 1. Testes de UI

### 1.1 Acesso e renderizacao

**Passos:**
1. Acesse `/admin/agenda-semanal`
2. Verifique o grid de 5 colunas (Seg–Sex)

**Esperado:**
- [ ] Grid com 5 colunas aparece corretamente
- [ ] Dia atual tem borda dourada e fundo levemente diferente
- [ ] Tarefas de manha (icone sol) e final do dia (icone lua) visiveis
- [ ] Barra de progresso global mostra `0%` inicialmente
- [ ] Mini-barra de progresso em cada coluna de dia
- [ ] Badge "Esta semana" aparece no header

### 1.2 Marcar tarefas

**Passos:**
1. Clique em qualquer task card
2. Clique novamente para desmarcar
3. Clique no quadrado (checkbox) diretamente

**Esperado:**
- [ ] Card fica opaco e riscado ao marcar
- [ ] Checkbox mostra checkmark dourado
- [ ] Barra de progresso do dia aumenta
- [ ] Barra de progresso global aumenta
- [ ] Contagem "X/Y" no header do dia atualiza
- [ ] Quando todos do dia forem marcados, aparece "✓" em teal

### 1.3 Persistencia no browser

**Passos:**
1. Marque 3 tarefas
2. Feche e reabra o browser
3. Acesse `/admin/agenda-semanal` novamente

**Esperado:**
- [ ] As 3 tarefas estao marcadas (estado preservado)
- [ ] Barra de progresso mostra o percentual correto

**Verificar no DevTools:**
```
Application → Local Storage → localhost
Chave: agenda-semanal-YYYY-MM-DD (segunda-feira atual)
Valor: {"mon-m-1": true, ...}
```

### 1.4 Filtro de papel

**Passos:**
1. Clique em "Fundador"
2. Clique em "Assistente CRM"
3. Clique em "Creator"
4. Clique em "Todos os papeis"

**Esperado:**
- [ ] Cada filtro mostra apenas as tarefas do papel selecionado
- [ ] Barra de progresso recalcula para o filtro ativo
- [ ] "Todos os papeis" volta ao estado completo (27 tarefas)

### 1.5 Navegacao entre semanas

**Passos:**
1. Clique na seta `<` (semana anterior)
2. Verifique datas no header
3. Clique na seta `>` (semana seguinte)
4. Retorne a semana atual

**Esperado:**
- [ ] Datas no header mudam corretamente
- [ ] Badge "Esta semana" desaparece em semanas diferentes
- [ ] Progresso e zerado para semanas sem dados (novo localStorage key)
- [ ] Retornar a semana atual mostra progresso salvo anteriormente

### 1.6 Resetar semana

**Passos:**
1. Marque algumas tarefas
2. Clique em "Resetar semana"

**Esperado:**
- [ ] Todos os checkboxes voltam ao estado desmarcado
- [ ] Barra de progresso volta a 0%
- [ ] Chave removida do localStorage

### 1.7 Links de acao

**Passos:**
1. Encontre uma tarefa com link (ex: "Leads novos + WhatsApp pendentes")
2. Clique no link "→ Ver leads"

**Esperado:**
- [ ] Redireciona para `/admin/leads-dashboard`
- [ ] Card NAO e marcado como feito ao clicar no link (apenas o link)

---

## 2. Teste da Edge Function via UI

### 2.1 Botao "Testar agora"

**Pre-requisito:** Pelo menos `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` OU `ADMIN_NOTIFICATION_EMAIL` configurados.

**Passos:**
1. Acesse `/admin/agenda-semanal`
2. Clique no botao dourado **"Testar agora"**
3. Aguarde o toast aparecer (max ~5 segundos)

**Esperado (com Telegram configurado):**
```
✅ Enviado!
Telegram: sent | Email: sent
```

**Esperado (sem secrets configurados):**
```
✅ Enviado!
Telegram: skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set
Email: skipped — ADMIN_NOTIFICATION_EMAIL secret not set
```

**Erro esperado (sem auth):**
```
Erro ao enviar
Unauthorized
```

### 2.2 Botao "Documentacao"

**Passos:**
1. Clique em **"Documentacao"**

**Esperado:**
- [ ] Sheet lateral abre pela direita
- [ ] 7 secoes visiveis com scroll
- [ ] Botao "Copiar" na URL do webhook funciona
- [ ] Texto "Copiado" aparece apos clicar

---

## 3. Teste da Edge Function via curl

### 3.1 Chamada valida com internal secret

```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-daily-agenda" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: <INTERNAL_FUNCTION_SECRET>" \
  --silent | jq .
```

**Esperado (dia de semana):**
```json
{
  "success": true,
  "day": "Terça-feira",
  "taskCount": 5,
  "telegram": "sent",
  "email": "sent"
}
```

**Esperado (fim de semana):**
```json
{
  "message": "Fim de semana — nenhuma agenda enviada",
  "day": 0
}
```

### 3.2 Chamada sem autenticacao (deve falhar)

```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-daily-agenda" \
  -H "Content-Type: application/json" \
  --silent | jq .
```

**Esperado:**
```json
{ "error": "Unauthorized" }
```
**Status HTTP:** 401

### 3.3 Chamada com secret errado (deve falhar)

```bash
curl -X POST "https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-daily-agenda" \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: secret-errado" \
  --silent | jq .
```

**Esperado:**
```json
{ "error": "Unauthorized" }
```
**Status HTTP:** 401

### 3.4 Verificar logs da funcao

No Supabase Dashboard:

```
Edge Functions → send-daily-agenda → Logs
```

Filtros uteis:
- Procure por `[send-daily-agenda]` nos logs
- Resultado esperado: `{ day: "...", telegram: "sent", email: "sent" }`

---

## 4. Verificar pg_cron

### 4.1 Confirmar que o job existe

Execute no SQL Editor do Supabase:

```sql
SELECT
  jobname,
  schedule,
  command,
  active,
  jobid
FROM cron.job
WHERE jobname = 'send-daily-agenda-6am-brt';
```

**Esperado:**
```
jobname                    | schedule      | active
---------------------------+---------------+-------
send-daily-agenda-6am-brt  | 0 9 * * 1-5   | true
```

### 4.2 Ver historico de execucoes

```sql
SELECT
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'send-daily-agenda-6am-brt'
)
ORDER BY start_time DESC
LIMIT 10;
```

**Status esperado:** `succeeded`

### 4.3 Forcas execucao manual via SQL (apenas para teste)

```sql
SELECT invoke_edge_function('send-daily-agenda', '{}');
```

**Esperado:** Retorna HTTP status 200 em `~2-3 segundos`.

### 4.4 Verificar se job esta desativado (problema comum)

```sql
-- Reativar se necessario
UPDATE cron.job
SET active = true
WHERE jobname = 'send-daily-agenda-6am-brt';
```

---

## 5. Testar N8N Webhook

Se estiver usando N8N em vez de pg_cron:

### 5.1 Configuracao minima do no HTTP Request

| Campo | Valor |
|-------|-------|
| Method | POST |
| URL | `https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/send-daily-agenda` |
| Header: `x-internal-secret` | `<INTERNAL_FUNCTION_SECRET>` |
| Header: `Content-Type` | `application/json` |
| Body | `{}` (vazio) |

### 5.2 Testar o no manualmente no N8N

1. Abra o workflow no N8N
2. Clique em **"Test workflow"** ou **"Execute node"** no no HTTP Request
3. Verifique o output

**Esperado:**
```json
{
  "success": true,
  "day": "...",
  "telegram": "sent",
  "email": "sent"
}
```

### 5.3 Verificar Schedule Trigger

1. No N8N Settings, confirme: **Timezone = America/Sao_Paulo**
2. Cron `0 6 * * 1-5` = seg a sex as 06:00 (horario de Brasilia)
3. Ative o workflow (toggle no canto superior direito)

---

## 6. Verificar Telegram

### 6.1 Confirmar recebimento

Apos o teste (botao ou curl), abra o Telegram e verifique a conversa com o bot.

**Mensagem esperada:**
- Titulo com emoji de calendario e dia da semana
- Secao MANHA com emojis de sol e prefixos `├` / `└`
- Secao FINAL DO DIA com emoji de lua
- Link "Ver agenda completa no Hub" ao final

### 6.2 Testar bot manualmente (opcional)

```bash
# Verificar se o bot responde
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Ver atualizacoes recentes (confirma Chat ID)
curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

### 6.3 Erros comuns no Telegram

| Erro | Causa | Solucao |
|------|-------|---------|
| `chat not found` | Chat ID errado ou bot nao iniciado | Envie /start para o bot primeiro |
| `bot was blocked by the user` | Usuario bloqueou o bot | Desbloquear no Telegram |
| `TELEGRAM_BOT_TOKEN not set` | Secret nao configurado | Adicionar no Supabase secrets |
| Parse error na mensagem | Caractere especial no HTML | Verificar logs da funcao |

---

## 7. Verificar Email

### 7.1 Confirmar recebimento

Apos o teste, verifique a caixa de entrada do `ADMIN_NOTIFICATION_EMAIL`.

**Email esperado:**
- Assunto: `📅 Agenda de Terça-feira — 04 de março`
- De: `ENP Hub <noreply@euanapratica.com>`
- Layout: header escuro, duas secoes (Manha / Final do Dia), botao CTA dourado

### 7.2 Checar Resend Dashboard

```
app.resend.com → Emails → Filtrar por data de hoje
```

Procure pelo subject `📅 Agenda de` para confirmar o envio.

### 7.3 Erros comuns no Email

| Erro | Causa | Solucao |
|------|-------|---------|
| `skipped — resend_email API config not found` | API key nao configurada em api_configs | Configurar em `/admin/configuracoes-apis` |
| `skipped — ADMIN_NOTIFICATION_EMAIL secret not set` | Secret ausente | Adicionar no Supabase secrets |
| Email na pasta de spam | Dominio de envio | Verificar dominio no Resend |
| `error: 422` | Email invalido | Verificar formato do `ADMIN_NOTIFICATION_EMAIL` |

---

## Troubleshooting

### Funcao retorna 401 mesmo com secret correto

**Causa mais provavel:** `INTERNAL_FUNCTION_SECRET` no ambiente Supabase nao bate com o valor em `app_configs`.

**Verificar:**
```sql
SELECT value FROM app_configs WHERE key = 'internal_function_secret';
```

Comparar com:
```
Supabase Dashboard → Edge Functions → Secrets → INTERNAL_FUNCTION_SECRET
```

Os dois valores devem ser identicos.

---

### Funcao retorna 401 via browser (botao "Testar agora")

O botao usa o JWT do usuario logado (nao o internal secret). A funcao `send-daily-agenda` usa `validateInternalCall` que so aceita `x-internal-secret`.

**Solucao:** Use o curl com `x-internal-secret` para testar corretamente. O botao na UI e apenas para verificar se a funcao responde — para teste completo use curl.

---

### pg_cron nao disparou no horario

**Verificar logs:**
```sql
SELECT *
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-daily-agenda-6am-brt')
ORDER BY start_time DESC
LIMIT 5;
```

**Causas comuns:**
- Job `active = false` — usar UPDATE para reativar
- `invoke_edge_function` helper nao encontra o secret `supabase_edge_url` ou `internal_function_secret` em `app_configs`
- Extensao `pg_cron` nao ativada no projeto Supabase

---

### Mensagem do Telegram nao chega mas funcao retorna "sent"

O retorno `"sent"` indica que a API do Telegram aceitou a mensagem. Possiveis causas de nao receber:

1. Chat ID errado — verificar com `@userinfobot`
2. Bot foi bloqueado — desbloquear no Telegram
3. Notificacoes do bot silenciadas — verificar configuracoes do Telegram

---

### Email nao chega mas funcao retorna "sent"

1. Checar pasta de spam
2. Verificar no Resend Dashboard se o email foi enviado
3. Confirmar que o dominio `euanapratica.com` esta verificado no Resend

---

## Checklist completo

Use esta lista antes de considerar o setup completo:

### Configuracao inicial
- [ ] Secret `TELEGRAM_BOT_TOKEN` adicionado no Supabase
- [ ] Secret `TELEGRAM_CHAT_ID` adicionado no Supabase
- [ ] Secret `ADMIN_NOTIFICATION_EMAIL` adicionado no Supabase
- [ ] Bot iniciado no Telegram (mensagem /start enviada)
- [ ] Funcao `send-daily-agenda` deployada (`npx supabase functions deploy send-daily-agenda`)

### Testes de UI
- [ ] Agenda renderiza com 5 colunas
- [ ] Dia atual destacado corretamente
- [ ] Checkboxes salvam e persistem apos reload
- [ ] Filtros de papel funcionam
- [ ] Navegacao entre semanas funciona
- [ ] Reset de semana funciona
- [ ] Sheet de documentacao abre
- [ ] Botao copiar URL funciona

### Testes de notificacao
- [ ] Curl com `x-internal-secret` retorna `{ success: true }`
- [ ] Curl sem auth retorna 401
- [ ] Mensagem recebida no Telegram
- [ ] Email recebido na caixa de entrada
- [ ] Log `[send-daily-agenda]` aparece no Supabase Edge Functions Logs

### Agendamento automatico
- [ ] Job pg_cron existe: `SELECT * FROM cron.job WHERE jobname = 'send-daily-agenda-6am-brt'`
- [ ] Job esta ativo (`active = true`)
- [ ] OU: Workflow N8N ativo com Schedule `0 6 * * 1-5` (America/Sao_Paulo)
