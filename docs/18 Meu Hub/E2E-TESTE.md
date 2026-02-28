# Meu Hub — Manual de Testes E2E

> Cenários passo a passo para validar o comportamento completo do "Meu Hub".
> Cada cenário pode ser executado manualmente no ambiente de staging ou produção.

---

## Pré-Requisitos Gerais

| Item | Detalhes |
|------|----------|
| Ambiente | Staging ou produção com Supabase ativo |
| Acesso admin | Conta com role `admin` para concessões manuais |
| Acesso DB | Supabase Dashboard para INSERT/UPDATE diretos |
| Hub services | Ao menos 1 serviço de cada `service_type` cadastrado em `hub_services` |
| Planos | `plans` configurados com features (`resume_pass`, `title_translator`) |
| Ticto (opcional) | Para testar fluxo de compra real; senão, simular via DB |

### Setup de Dados para Teste

Para criar os dados de teste via SQL, use o Supabase SQL Editor:

```sql
-- 1. Verificar hub_services existentes
SELECT id, name, service_type, ticto_product_id, plan_feature_key, is_visible_in_hub
FROM hub_services
ORDER BY service_type;

-- 2. Verificar planos e features
SELECT id, name, features FROM plans;

-- 3. User de teste (buscar pelo email)
SELECT id, email, full_name FROM profiles WHERE email = '<email_teste>';
```

---

## Cenário 1: Primeiro Acesso — Hub Vazio

**Objetivo:** Verificar que "Minha Jornada" não aparece quando o usuário não tem nada.

**Pré-condição:**
- Usuário sem rows em `user_hub_services`
- Plano Básico (sem features de ferramentas)

**Passos:**
1. Login como usuário de teste
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Seção "Minha Jornada" **NÃO aparece** (sem card, sem título, sem espaço vazio)
- Página exibe: Header, Tour, Checklist, Free Tier (ResumePass/Aula Base), Serviço Destacado, Outros Serviços
- Nenhum erro no console

---

## Cenário 2: Compra de Consultoria — Fluxo Completo

**Objetivo:** Validar o ciclo completo: compra → ação necessária → agendamento → sessão → histórico.

### 2.1 Simular Compra

**Pré-condição:**
- `hub_services` tem um serviço `consulting` com `ticto_product_id` preenchido

**Passos (via DB):**
```sql
-- Simular a inserção que o ticto-webhook faria
INSERT INTO user_hub_services
  (user_id, service_id, status, access_source, sessions_total, sessions_used, metadata, started_at)
VALUES
  ('<user_uuid>', '<consulting_service_uuid>', 'active', 'purchase', 1, 0, '{"booking_id": null}', now());
```

**Resultado Esperado:**
- Recarregar `/dashboard/hub`
- Seção "Minha Jornada" aparece
- Seção **"Acao Necessaria"** (ambar) contém card do serviço
- Card mostra: nome do serviço, "Agende sua sessao para comecar", badge "Comprado" (roxo)
- Botao ambar **"Agendar Sessao"**

### 2.2 Agendar Sessão

**Passos:**
1. Clicar em "Agendar Sessão" no card
2. Verificar que navega para `/dashboard/agendar/<service_id>`
3. Selecionar mentor, data e horário
4. Confirmar agendamento

**Resultado Esperado:**
- Booking criado com `status = 'confirmed'`
- Voltar para `/dashboard/hub`
- Card migrou para seção **"Em Andamento"** (verde)
- Sub-info mostra data/hora da sessão: "Sessão: seg 03/03 às 14:00"
- Botão agora é **"Entrar na Reunião"** (índigo)

### 2.3 Concluir Sessão

**Passos (via DB):**
```sql
-- Simular conclusão da sessão
UPDATE bookings
SET status = 'completed'
WHERE student_id = '<user_uuid>'
  AND service_id = '<consulting_service_uuid>'
  AND status = 'confirmed';
```

**Resultado Esperado:**
- Recarregar `/dashboard/hub`
- Card migrou para seção **"Historico"** (cinza)
- Card com opacidade reduzida (60%)
- Badge "Concluído"
- Sem botão de ação (ou badge estático "Concluído")

---

## Cenário 3: Re-compra — Incremento de Sessões

**Objetivo:** Validar que comprar o mesmo serviço novamente incrementa `sessions_total`.

**Pré-condição:**
- Cenário 2 concluído (1 sessão utilizada, card em "Histórico")

**Passos (via DB):**
```sql
-- Simular re-compra (o que o ticto-webhook faria)
UPDATE user_hub_services
SET
  sessions_total = sessions_total + 1,
  status = 'active',
  started_at = now()
WHERE user_id = '<user_uuid>'
  AND service_id = '<consulting_service_uuid>';
```

**Resultado Esperado:**
- Recarregar `/dashboard/hub`
- Card volta para **"Ação Necessária"** (pois tem 1 sessão disponível restante)
- Contador visível: **"1/2 sessões utilizadas"** (ícone ⚡)
- Botão "Agendar Sessão"

---

## Cenário 4: Compra de Mentoria ao Vivo

**Objetivo:** Validar card de `live_mentoring` com próxima sessão.

**Passos (via DB):**
```sql
-- 1. Verificar que há um hub_service tipo live_mentoring com espaco_id
SELECT id, name, espaco_id FROM hub_services WHERE service_type = 'live_mentoring';

-- 2. Inserir acesso
INSERT INTO user_hub_services
  (user_id, service_id, status, access_source, sessions_total, sessions_used, metadata, started_at)
VALUES
  ('<user_uuid>', '<mentoring_service_uuid>', 'active', 'purchase', NULL, 0,
   '{"espaco_id": "<espaco_uuid>"}', now());

-- 3. (Opcional) Matricular no espaço
INSERT INTO user_espacos (user_id, espaco_id, status, enrolled_at)
VALUES ('<user_uuid>', '<espaco_uuid>', 'active', now())
ON CONFLICT (user_id, espaco_id) DO NOTHING;

-- 4. (Opcional) Criar sessão futura no espaço
INSERT INTO sessions (espaco_id, title, datetime, status, duration_minutes, created_by)
VALUES ('<espaco_uuid>', 'Sessão Teste', now() + INTERVAL '3 days', 'scheduled', 60, '<mentor_uuid>');
```

**Resultado Esperado:**
- Recarregar `/dashboard/hub`
- Card em seção **"Em Andamento"** (verde, status sempre `active`)
- Sub-info: "Próxima sessão: qua 05/03 às 10:00" (se sessão futura existe)
- Ou: "Acesse seu Espaço para ver as próximas sessões" (se sem sessão futura)
- Botão **"Acessar Espaço"** → navega para `/espaco/<espaco_uuid>`
- Badge "Comprado" (roxo)

---

## Cenário 5: Evento ao Vivo — Upcoming → Completed

**Objetivo:** Validar ciclo de `live_event`.

**Passos (via DB):**
```sql
-- 1. Inserir acesso com data futura
INSERT INTO user_hub_services
  (user_id, service_id, status, access_source, metadata, started_at)
VALUES
  ('<user_uuid>', '<live_event_service_uuid>', 'active', 'purchase',
   '{"session_datetime": "<data_futura_ISO>", "meeting_link": "https://meet.google.com/xxx"}',
   now());
```

**Resultado Esperado (data futura):**
- Card em **"Próximos Eventos"** (azul)
- Sub-info: data/hora do evento
- Botão **"Entrar no Evento"** (abre meeting_link)

**Simular evento passado:**
```sql
UPDATE user_hub_services
SET metadata = jsonb_set(metadata, '{session_datetime}', '"2026-01-01T10:00:00Z"')
WHERE user_id = '<user_uuid>' AND service_id = '<live_event_service_uuid>';
```

**Resultado Esperado (data passada):**
- Card migra para **"Histórico"** (cinza)
- Badge "Concluído"

---

## Cenário 6: Curso Gravado — Progresso

**Objetivo:** Validar card de `recorded_course` com barra de progresso.

**Passos (via DB):**
```sql
-- 1. Inserir acesso sem progresso
INSERT INTO user_hub_services
  (user_id, service_id, status, access_source, metadata, started_at)
VALUES
  ('<user_uuid>', '<course_service_uuid>', 'active', 'purchase', '{}', now());
```

**Resultado Esperado (0%):**
- Card em **"Ação Necessária"** (status `not_started`)
- Sub-info: "Ainda não iniciado"
- Botão **"Começar Curso"**

**Simular progresso:**
```sql
UPDATE user_hub_services
SET metadata = '{"progress_percent": 45}'
WHERE user_id = '<user_uuid>' AND service_id = '<course_service_uuid>';
```

**Resultado Esperado (45%):**
- Card migra para **"Em Andamento"** (status `active`)
- Barra de progresso verde em 45% + label "45%"
- Botão **"Continuar"**

**Simular conclusão:**
```sql
UPDATE user_hub_services
SET metadata = '{"progress_percent": 100}'
WHERE user_id = '<user_uuid>' AND service_id = '<course_service_uuid>';
```

**Resultado Esperado (100%):**
- Card migra para **"Histórico"** (status `completed`)
- Opacidade 60%, badge "Concluído"

---

## Cenário 7: Ferramentas de Plano (Plan Tools)

**Objetivo:** Validar que ferramentas de plano aparecem na seção "Ferramentas do seu Plano".

**Pré-condição:**
- `hub_services` tem serviço com `plan_feature_key = 'resume_pass'` e `is_visible_in_hub = true`
- Usuário tem assinatura de plano Pro ou VIP com feature `resume_pass` habilitada

### 7.1 Usuário com plano Pro

**Passos:**
1. Login como usuário com plano Pro ativo
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Seção **"Ferramentas do seu Plano"** (ícone ⚡ azul) aparece
- Card do ResumePass AI com badge "Incluso no plano" (azul)
- Barra de créditos: "X utilizados | Y restantes" + barra de progresso
- Label: "Z créditos/mês"
- Botão **"Usar Ferramenta"** → navega para `/curriculo`

### 7.2 Usuário com plano Básico

**Passos:**
1. Login como usuário com plano Básico

**Resultado Esperado:**
- Se plano Básico NÃO tem `resume_pass` nas features → seção "Ferramentas do seu Plano" **NÃO aparece**
- Se plano Básico TEM `resume_pass` com limite 1 → seção aparece com 1 crédito

### 7.3 Ferramenta ilimitada (Title Translator)

**Pré-condição:**
- `hub_services` tem serviço com `plan_feature_key = 'title_translator'`
- Plano do usuário tem feature `title_translator` habilitada

**Resultado Esperado:**
- Card mostra "Uso ilimitado este mês" (sem barra de créditos)

---

## Cenário 8: Acesso Admin Grant

**Objetivo:** Validar que acessos concedidos pelo admin aparecem corretamente.

**Passos (via DB):**
```sql
INSERT INTO user_hub_services
  (user_id, service_id, status, access_source, sessions_total, sessions_used, metadata, started_at)
VALUES
  ('<user_uuid>', '<any_service_uuid>', 'active', 'admin_grant', 1, 0, '{}', now());
```

**Resultado Esperado:**
- Card aparece na seção apropriada (depende do `service_type`)
- Badge mostra **"Comprado"** (roxo) — para `admin_grant` o badge padrão é "Comprado" (o sistema trata `plan` vs qualquer outra coisa)

> **Nota:** O badge mostra "Incluso no plano" apenas quando `access_source = 'plan'`. Para `admin_grant`, mostra "Comprado".

---

## Cenário 9: Revogar Acesso

**Objetivo:** Validar que revogar acesso remove o card imediatamente.

**Passos (via DB):**
```sql
UPDATE user_hub_services
SET status = 'cancelled'
WHERE user_id = '<user_uuid>'
  AND service_id = '<service_uuid>';
```

**Resultado Esperado:**
- Recarregar `/dashboard/hub`
- Card do serviço **desaparece** completamente
- Se era o único serviço → "Minha Jornada" inteira desaparece

---

## Cenário 10: Múltiplos Serviços Simultâneos

**Objetivo:** Validar que múltiplos serviços de tipos diferentes aparecem organizados corretamente.

**Passos (via DB):**
```sql
-- Inserir 4 serviços diferentes para o mesmo usuário
INSERT INTO user_hub_services (user_id, service_id, status, access_source, sessions_total, sessions_used, metadata, started_at)
VALUES
  -- Consultoria não agendada → Ação Necessária
  ('<user_uuid>', '<consulting_svc_uuid>', 'active', 'purchase', 1, 0, '{"booking_id": null}', now()),
  -- Mentoria ativa → Em Andamento
  ('<user_uuid>', '<mentoring_svc_uuid>', 'active', 'purchase', NULL, 0, '{"espaco_id": "<espaco_uuid>"}', now()),
  -- Evento futuro → Próximos Eventos
  ('<user_uuid>', '<event_svc_uuid>', 'active', 'purchase', NULL, 0, '{"session_datetime": "<data_futura>"}', now()),
  -- Curso concluído → Histórico
  ('<user_uuid>', '<course_svc_uuid>', 'active', 'purchase', NULL, 0, '{"progress_percent": 100}', now());
```

**Resultado Esperado:**
- 4 seções visíveis na ordem: Ação Necessária → Em Andamento → Próximos Eventos → Histórico
- Cada seção com o ícone e cor corretos
- Cada seção com contagem "(1)"
- Cards nas seções correspondentes

---

## Cenário 11: Webhook Ticto — Fluxo Real de Compra

**Objetivo:** Validar o fluxo completo via webhook (substitui o INSERT manual).

**Pré-condição:**
- `hub_services` com `ticto_product_id` preenchido
- Ambiente Ticto em sandbox ou usar o Simulador Ticto em `/admin/ticto-simulator`

### Via Simulador Ticto (Admin)

**Passos:**
1. Login como admin
2. Navegar para `/admin/ticto-simulator`
3. Preencher: email do usuário de teste, product_id do serviço, status = `paid`
4. Enviar

**Verificações:**
1. `payment_logs`: nova row com `status = 'processed'`
2. `user_hub_services`: nova row com `access_source = 'purchase'`
3. `orders`: novo pedido com `status = 'paid'`
4. Se serviço tem `espaco_id`: `user_espacos` tem nova row
5. Login como usuário de teste → `/dashboard/hub` → card aparece

### Via Simulador — Re-compra

**Passos:**
1. Repetir o envio com mesmo email e mesmo product_id
2. Verificar `user_hub_services`: `sessions_total` incrementou de 1 para 2
3. Verificar que NÃO criou segunda row (update na existente)

---

## Cenário 12: Loading e Error States

### 12.1 Loading State

**Passos:**
1. Abrir DevTools → Network → Slow 3G
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Skeleton loading (retângulos cinza pulsando) no lugar de "Minha Jornada"
- Após carregamento: cards renderizam normalmente

### 12.2 Supabase Error

**Passos:**
1. Abrir DevTools → Console
2. Navegar para `/dashboard/hub`
3. Verificar ausência de erros vermelhos no console

**Se query falhar** (simular desligando RLS temporariamente):
- Seção não aparece (fallback = vazio)
- Console mostra erro do TanStack Query (não crash)

---

## Cenário 13: Responsividade

**Objetivo:** Validar layout em diferentes tamanhos de tela.

**Passos:**
1. Carregar `/dashboard/hub` com múltiplos cards
2. Testar em: Desktop (1440px), Tablet (768px), Mobile (375px)

**Resultado Esperado:**
- Desktop: grid 2 colunas para cards
- Tablet: grid 2 colunas
- Mobile: grid 1 coluna (cards empilhados)
- Badges não quebram linha
- Botões CTA acessíveis em todas as resoluções

---

## Checklist Rápido de Validação

| # | Cenário | Status |
|---|---------|--------|
| 1 | Hub vazio: "Minha Jornada" não aparece | [ ] |
| 2.1 | Consultoria comprada → seção "Ação Necessária" | [ ] |
| 2.2 | Consultoria agendada → seção "Em Andamento" + data | [ ] |
| 2.3 | Consultoria concluída → seção "Histórico" | [ ] |
| 3 | Re-compra → sessions_total incrementa + contador visível | [ ] |
| 4 | Mentoria → "Em Andamento" + próxima sessão | [ ] |
| 5 | Evento futuro → "Próximos Eventos"; passado → "Histórico" | [ ] |
| 6 | Curso 0% → "Ação Necessária"; 45% → "Em Andamento"; 100% → "Histórico" | [ ] |
| 7.1 | Plan tool (Pro) → seção "Ferramentas do seu Plano" com créditos | [ ] |
| 7.2 | Plan tool (Básico sem feature) → seção não aparece | [ ] |
| 8 | Admin grant → card aparece com badge "Comprado" | [ ] |
| 9 | Revogar acesso → card desaparece | [ ] |
| 10 | 4 serviços simultâneos → 4 seções ordenadas corretamente | [ ] |
| 11 | Webhook Ticto → row criada + card aparece | [ ] |
| 11b | Webhook re-compra → sessions_total incrementa (sem row duplicada) | [ ] |
| 12 | Loading state → skeleton; sem crash em erro | [ ] |
| 13 | Responsivo: desktop 2col, mobile 1col | [ ] |
