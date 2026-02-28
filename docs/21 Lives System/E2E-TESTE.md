# Sistema de Lives — Manual de Testes E2E

> Cenarios passo a passo para validar o comportamento completo do sistema de Lives.
> Cada cenario pode ser executado manualmente no ambiente de staging ou producao.

---

## Pre-Requisitos Gerais

| Item | Detalhes |
|------|----------|
| Ambiente | Staging ou producao com Supabase ativo |
| Conta mentor | Conta com role `mentor` para criacao de lives |
| Conta student | Conta com role `student` para testes de inscricao |
| Conta admin | Conta com role `admin` para validar acesso |
| Acesso DB | Supabase Dashboard para verificacoes diretas |
| Planos | `plans` configurados (basico, pro, vip) com slugs correspondentes |
| Ticto | (Opcional) Produto de teste no Ticto para validar pagamento |

### Setup de Dados para Teste

```sql
-- Verificar se migration foi aplicada
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'lives';
-- Esperado: 1

-- Verificar enums
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'live_access_type'::regtype;
-- Esperado: free, paid, subscribers, pro, vip

-- Verificar RPC existe
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'check_live_access';
-- Esperado: check_live_access

-- Verificar usuario mentor
SELECT id, email, full_name FROM profiles
JOIN user_roles ON user_roles.user_id = profiles.id
WHERE user_roles.role = 'mentor' LIMIT 5;

-- Verificar usuario student
SELECT id, email, full_name FROM profiles
JOIN user_roles ON user_roles.user_id = profiles.id
WHERE user_roles.role = 'student' LIMIT 5;
```

---

## Cenario 1: Navegacao e Sidebar

**Objetivo:** Verificar que os itens de menu aparecem para cada role.

### 1.1 Student ve "Lives" no sidebar

**Passos:**
1. Login como student
2. Observar sidebar

**Resultado Esperado:**
- Grupo DISCOVERY contem item "Lives" com icone de antena e badge "NOVO"
- Clicar → navega para `/lives`

### 1.2 Mentor ve "Lives" no sidebar

**Passos:**
1. Login como mentor
2. Observar sidebar

**Resultado Esperado:**
- Grupo GESTAO contem item "Lives" com icone de antena e badge "NOVO"
- Clicar → navega para `/mentor/lives`

### 1.3 Admin ve "Lives" no sidebar (GESTAO DE CONTEUDO)

**Passos:**
1. Login como admin
2. Observar sidebar

**Resultado Esperado:**
- Grupo GESTAO DE CONTEUDO contem item "Lives"
- Clicar → navega para `/mentor/lives`

### 1.4 Admin acessa ambas as paginas

**Passos:**
1. Login como admin
2. Navegar para `/mentor/lives`
3. Navegar para `/lives`

**Resultado Esperado:**
- Ambas as paginas carregam sem erro
- Admin pode criar lives e tambem se inscrever em lives

---

## Cenario 2: Mentor Cria Live Gratuita

**Objetivo:** Validar o fluxo completo de criacao de live gratuita.

### 2.1 Criar Live

**Passos:**
1. Login como mentor
2. Navegar para `/mentor/lives`
3. Clicar em "Criar Live"
4. Preencher:
   - Titulo: "Teste E2E - Live Gratuita"
   - Slug: (auto-gerado, verificar que aparece)
   - Descricao: "Live de teste para validacao E2E"
   - Data: amanha, 19:00
   - Duracao: 60 min
   - Meeting link: `https://meet.google.com/teste-e2e`
   - Tipo de acesso: Gratuita
   - Status: Agendada
5. Clicar "Criar Live"

**Resultado Esperado:**
- Redirect para `/mentor/lives`
- Toast "Live criada com sucesso"
- Live aparece na lista com status "Agendada" e badge "Gratuita"
- Nenhum erro no console

### 2.2 Verificar no DB

```sql
SELECT id, title, slug, status, access_type, scheduled_at, meeting_link
FROM lives
WHERE title = 'Teste E2E - Live Gratuita';
```

**Esperado:** 1 row com `status='scheduled'`, `access_type='free'`

### 2.3 Landing Page

**Passos:**
1. Copiar slug da live criada
2. Navegar para `/live/<slug>`

**Resultado Esperado:**
- Pagina carrega com titulo, descricao, data/hora
- Badge "Gratuita" visivel
- Nome e foto do mentor visivel
- CTA: botao "Inscreva-se Gratuitamente"

---

## Cenario 3: Student se Inscreve em Live Gratuita

**Pre-condicao:** Live gratuita criada no Cenario 2.

### 3.1 Discovery

**Passos:**
1. Login como student
2. Navegar para `/lives`

**Resultado Esperado:**
- Live "Teste E2E - Live Gratuita" aparece no grid
- Card mostra: titulo, data, mentor, badge "Gratuita", contagem de inscritos

### 3.2 Inscricao

**Passos:**
1. Clicar no card da live → landing page
2. Clicar "Inscreva-se Gratuitamente"

**Resultado Esperado:**
- Toast "Inscricao confirmada!"
- Botao muda para "Voce esta inscrito!" (verde, com data/hora)
- Se live tem `meeting_link`, link aparece

### 3.2.1 Email de Confirmacao com Calendario

**Resultado Esperado (apos inscricao):**
- Email recebido: "Inscricao confirmada: [titulo]"
- Email contem: data, horario, duracao, nome do mentor
- Botao "Adicionar ao Google Calendar" funcional (abre Google Calendar com evento pre-preenchido)
- Arquivo `.ics` anexo ao email
- Gmail/Outlook mostra opcao "Adicionar ao Calendario" automaticamente
- Abrir `.ics` → evento com titulo da live, data/hora corretos, descricao com link

**Verificar Log:**
```sql
SELECT * FROM email_logs
WHERE template_name = 'live_registration_confirmation'
  AND recipient = '<student_email>'
ORDER BY created_at DESC LIMIT 1;
-- Esperado: status='sent'
```

### 3.3 Hub Integration

**Passos:**
1. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Secao "Minhas Lives" aparece com card da live (maximo 2 lives visiveis)
- Card mostra: titulo, data/hora, icone de calendario azul
- Botao "Ver Detalhes"
- Se inscrito em mais de 2 lives: link "Ver todas (N)" → `/lives`

### 3.4 Verificar no DB

```sql
SELECT lr.id, lr.attended, lr.payment_status, p.full_name, p.email
FROM live_registrations lr
JOIN profiles p ON p.id = lr.user_id
WHERE lr.live_id = '<live_uuid>';
```

**Esperado:** 1 row com `payment_status='none'`, `attended=false`

---

## Cenario 4: Mentor Gerencia Live (Go Live → Encerrar)

**Pre-condicao:** Live gratuita com inscrito (cenarios 2 e 3).

### 4.1 Go Live

**Passos:**
1. Login como mentor
2. Navegar para `/mentor/lives`
3. Clicar "Go Live" na live agendada

**Resultado Esperado:**
- Status muda para "Ao Vivo" (badge vermelho)
- Card ganha destaque visual (ring vermelho)

### 4.1.1 Email "Go Live" para Inscritos

**Pre-condicao:** Live com 2+ inscritos.

**Resultado Esperado (apos Go Live):**
- Todos os inscritos recebem email "Estamos ao vivo! [titulo] comecou agora"
- Email contem botao "Entrar na Live" com link da reuniao
- Link alternativo para pagina da live

**Verificar Logs:**
```sql
SELECT recipient, status, created_at FROM email_logs
WHERE template_name = 'live_going_live'
ORDER BY created_at DESC LIMIT 20;
-- Esperado: 1 row por inscrito, todos status='sent'
```

### 4.1.2 Botoes de Compartilhamento Social

**Passos:**
1. Login como mentor
2. Navegar para `/mentor/lives/:id` (pagina de detalhes)

**Resultado Esperado (quando live esta "Ao Vivo"):**
- Card de compartilhamento aparece com borda vermelha
- 4 botoes: WhatsApp (verde), LinkedIn (azul), Twitter/X (preto), Copiar Texto (outline)
- WhatsApp: abre `wa.me` com mensagem pre-preenchida
- LinkedIn: abre janela de compartilhamento
- Twitter/X: abre tweet pre-preenchido
- Copiar Texto: copia mensagem e icone muda para check

**Quando live NAO esta "Ao Vivo":**
- Card de compartilhamento NAO aparece

### 4.2 Verificar perspectiva do Student

**Passos:**
1. Login como student (que se inscreveu)
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card da live mostra icone pulsante vermelho
- Texto "Acontecendo agora!"
- Botao "Entrar Agora" (vermelho, abre link da reuniao)

### 4.3 Controle de Presenca

**Passos:**
1. Login como mentor
2. Navegar para `/mentor/lives/<id>` (pagina de detalhes)
3. Marcar checkbox de presenca do inscrito

**Resultado Esperado:**
- Checkbox marca como presente
- Badge "Presente" (verde) aparece ao lado do nome
- DB: `attended=true`

### 4.4 Encerrar Live

**Passos:**
1. Na pagina de detalhes, clicar "Encerrar Live"

**Resultado Esperado:**
- Status muda para "Concluida"
- Botao "Go Live" e "Encerrar" desaparecem

### 4.5 Verificar Hub apos encerramento

**Passos:**
1. Login como student
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Card da live mostra icone cinza, opacidade reduzida
- Se nao ha `recording_url`: texto "Concluida"
- Se mentor adicionar `recording_url`: botao "Ver Gravacao"

---

## Cenario 5: Live Paga (via DB — sem Ticto real)

**Objetivo:** Validar fluxo de live paga simulando o webhook.

### 5.1 Criar Live Paga

**Passos (como mentor):**
1. Criar live com:
   - Tipo de acesso: Paga
   - Preco: 97.00
   - ID Produto Ticto: `TESTE_LIVE_001`
   - URL Checkout Ticto: `https://pay.ticto.com.br/teste`
   - Status: Agendada

### 5.2 Verificar Landing Page (como student)

**Passos:**
1. Acessar landing page da live paga

**Resultado Esperado:**
- CTA mostra "Comprar Acesso (R$ 97,00)"
- Botao redireciona para URL do Ticto

### 5.3 Simular Compra via DB

```sql
-- Simular o que o ticto-webhook faria
INSERT INTO live_registrations (live_id, user_id, payment_status, registered_at)
VALUES ('<live_uuid>', '<student_uuid>', 'paid', now())
ON CONFLICT (live_id, user_id) DO UPDATE SET payment_status = 'paid';
```

### 5.4 Verificar Acesso Pos-Compra

**Passos:**
1. Recarregar landing page como student

**Resultado Esperado:**
- CTA muda para "Voce esta inscrito!" (verde)
- Live aparece no Hub

### 5.5 Verificar RPC

```sql
SELECT check_live_access('<student_uuid>', '<live_uuid>');
-- Esperado: { "allowed": true, "reason": "already_registered", "registered": true }
```

---

## Cenario 6: Live para Assinantes

### 6.1 Student SEM assinatura

**Passos:**
1. Login como student sem assinatura ativa
2. Acessar landing page de live com `access_type='subscribers'`

**Resultado Esperado:**
- CTA: "Assine para Participar" → link para `/pricing`

### 6.2 Student COM assinatura ativa

**Passos:**
1. Login como student com assinatura ativa (qualquer plano)
2. Acessar mesma landing page

**Resultado Esperado:**
- CTA: "Inscreva-se Gratuitamente" → inscricao funciona normalmente

### 6.3 Verificar RPC

```sql
-- Student sem assinatura
SELECT check_live_access('<student_sem_plano>', '<live_subscribers>');
-- Esperado: { "allowed": false, "reason": "no_subscription", "required": "subscribers" }

-- Student com assinatura
SELECT check_live_access('<student_com_plano>', '<live_subscribers>');
-- Esperado: { "allowed": true, "reason": "free" }
```

---

## Cenario 7: Live Pro/VIP

### 7.1 Student com plano Basico

**Passos:**
1. Login como student com plano basico
2. Acessar landing page de live com `access_type='pro'`

**Resultado Esperado:**
- CTA: "Faca Upgrade para participar" → link para `/pricing`

### 7.2 Student com plano Pro

**Passos:**
1. Login como student com plano pro
2. Acessar mesma landing page

**Resultado Esperado:**
- CTA: "Inscreva-se" → inscricao funciona

### 7.3 Verificar RPC

```sql
-- Student com plano basico
SELECT check_live_access('<student_basico>', '<live_pro>');
-- Esperado: { "allowed": false, "reason": "plan_too_low", "required": "pro" }

-- Student com plano pro
SELECT check_live_access('<student_pro>', '<live_pro>');
-- Esperado: { "allowed": true, "reason": "free" }
```

---

## Cenario 8: Vagas Esgotadas

### 8.1 Criar live com limite

**Passos:**
1. Criar live gratuita com `max_attendees=1`
2. Inscrever 1 student

### 8.2 Segundo student tenta se inscrever

**Passos:**
1. Login como segundo student
2. Acessar landing page

**Resultado Esperado:**
- CTA: "Vagas Esgotadas" (botao desabilitado)

### 8.3 Verificar RPC

```sql
SELECT check_live_access('<segundo_student>', '<live_com_limite>');
-- Esperado: { "allowed": false, "reason": "full" }
```

---

## Cenario 9: Cancelar Inscricao

**Pre-condicao:** Student inscrito em live gratuita.

### 9.1 Cancelar

**Passos:**
1. Acessar landing page da live
2. Clicar "Cancelar Inscricao"

**Resultado Esperado:**
- Toast "Inscricao cancelada"
- CTA volta para "Inscreva-se Gratuitamente"
- Live desaparece do Hub

### 9.2 Verificar no DB

```sql
SELECT * FROM live_registrations
WHERE live_id = '<live_uuid>' AND user_id = '<student_uuid>';
-- Esperado: 0 rows (deletado)
```

---

## Cenario 10: Editar Live

### 10.1 Editar campos

**Passos:**
1. Login como mentor
2. Navegar para `/mentor/lives`
3. Menu (...) → Editar
4. Mudar titulo, descricao, data
5. Salvar

**Resultado Esperado:**
- Toast "Live atualizada"
- Redirect para lista
- Campos refletem alteracoes

### 10.2 Verificar que slug nao duplica

**Passos:**
1. Criar segunda live
2. Tentar salvar com mesmo slug da primeira

**Resultado Esperado:**
- Toast de erro indicando slug duplicado

---

## Cenario 11: Ticto Webhook (Live Paga)

**Objetivo:** Validar que o webhook Ticto concede acesso a live paga.

**Pre-condicao:** Live paga com `ticto_product_id` configurado.

### 11.1 Simular Webhook

Usar o Ticto Simulator (`/admin/ticto-simulator`) ou curl:

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/ticto-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid",
    "token": "<ticto_secret>",
    "customer": { "email": "<student_email>" },
    "item": { "product_id": "<ticto_product_id>", "product_name": "Live Teste" },
    "order": { "hash": "TEST_HASH_001", "paid_amount": 9700 }
  }'
```

### 11.2 Verificar Resultado

```sql
-- Registration criada
SELECT * FROM live_registrations
WHERE live_id = '<live_uuid>'
  AND user_id = '<student_uuid>';
-- Esperado: payment_status='paid'

-- Order criada
SELECT * FROM orders
WHERE ticto_order_id = 'TEST_HASH_001';
-- Esperado: status='paid', amount=97.00

-- Payment log
SELECT * FROM payment_logs
WHERE transaction_id = 'TEST_HASH_001';
-- Esperado: status='processed_live'
```

### 11.3 Simular Reembolso

```bash
curl -X POST https://seqgnxynrcylxsdzbloa.supabase.co/functions/v1/ticto-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "status": "refunded",
    "token": "<ticto_secret>",
    "customer": { "email": "<student_email>" },
    "item": { "product_id": "<ticto_product_id>" },
    "order": { "hash": "TEST_HASH_001" }
  }'
```

### 11.4 Verificar Reembolso

```sql
SELECT payment_status FROM live_registrations
WHERE live_id = '<live_uuid>' AND user_id = '<student_uuid>';
-- Esperado: 'refunded'

SELECT status FROM orders WHERE ticto_order_id = 'TEST_HASH_001';
-- Esperado: 'refunded'
```

---

## Cenario 12: Auto-Encerramento de Live (Cron)

**Objetivo:** Validar que lives esquecidas sao auto-encerradas apos duracao + 60min.

### 12.1 Setup

```sql
-- Criar live "ao vivo" que excedeu duracao ha mais de 60 min
UPDATE lives SET
  status = 'live',
  scheduled_at = now() - interval '3 hours',
  duration_minutes = 60
WHERE id = '<live_uuid>';
```

### 12.2 Aguardar Cron

O cron `check-unfinished-lives` roda a cada 15 minutos.

### 12.3 Verificar

```sql
-- Email enviado ao mentor
SELECT * FROM email_logs
WHERE template_name = 'live_unfinished_warning'
ORDER BY created_at DESC LIMIT 5;
-- Esperado: 1 row para o mentor da live

-- Live auto-encerrada
SELECT status FROM lives WHERE id = '<live_uuid>';
-- Esperado: 'completed'
```

---

## Cenario 13: Hub — Limite de 2 Lives

**Objetivo:** Validar que "Meu Hub" mostra no maximo 2 lives com prioridade por status.

### 13.1 Inscrever em 3+ Lives

**Passos:**
1. Login como student
2. Inscrever em 3 ou mais lives (gratuitas)
3. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Secao "Minhas Lives" mostra apenas 2 cards
- Lives com status `live` aparecem primeiro, depois `scheduled`, depois `completed`
- Link "Ver todas (N)" aparece com contagem total
- Clicar "Ver todas" → navega para `/lives`

### 13.2 Com Menos de 3 Lives

**Passos:**
1. Student com apenas 1-2 lives inscritas
2. Navegar para `/dashboard/hub`

**Resultado Esperado:**
- Mostra todos os cards (1 ou 2)
- Link "Ver todas" NAO aparece

---

## Cenario 14: Discovery — Filtros e Busca

### 14.1 Busca por texto

**Passos:**
1. Navegar para `/lives`
2. Digitar parte do titulo no campo de busca

**Resultado Esperado:**
- Grid filtra em tempo real
- Mostra apenas lives que contem o texto no titulo ou descricao

### 14.2 Filtro por tipo de acesso

**Passos:**
1. Selecionar "Gratuitas" no dropdown

**Resultado Esperado:**
- Mostra apenas lives com `access_type='free'`

### 14.3 Nenhum resultado

**Passos:**
1. Digitar texto que nao existe em nenhuma live

**Resultado Esperado:**
- Mensagem "Nenhuma live disponivel"
- Texto "Tente ajustar seus filtros."

---

## Checklist Rapido

| # | Cenario | Status |
|---|---------|--------|
| 1 | Sidebar: student ve "Lives" | [ ] |
| 2 | Sidebar: mentor ve "Lives" | [ ] |
| 3 | Sidebar: admin ve "Lives" em GESTAO DE CONTEUDO | [ ] |
| 4 | Mentor cria live gratuita | [ ] |
| 5 | Landing page renderiza corretamente | [ ] |
| 6 | Student se inscreve em live gratuita | [ ] |
| 7 | Email de confirmacao com .ics e Google Calendar | [ ] |
| 8 | Live aparece no Hub do student (max 2) | [ ] |
| 9 | Hub mostra "Ver todas (N)" quando 3+ lives | [ ] |
| 10 | Mentor clica "Go Live" | [ ] |
| 11 | Email "Go Live" enviado a todos inscritos | [ ] |
| 12 | Botoes de compartilhamento social aparecem (Ao Vivo) | [ ] |
| 13 | Student ve "Entrar Agora" durante live | [ ] |
| 14 | Mentor marca presenca | [ ] |
| 15 | Mentor encerra live | [ ] |
| 16 | Auto-close: cron encerra live esquecida | [ ] |
| 17 | Auto-close: mentor recebe email + WhatsApp | [ ] |
| 18 | Live paga: CTA mostra preco | [ ] |
| 19 | Live paga: webhook concede acesso | [ ] |
| 20 | Live assinantes: sem plano ve "Assine" | [ ] |
| 21 | Live assinantes: com plano pode inscrever | [ ] |
| 22 | Live Pro: plano basico ve "Upgrade" | [ ] |
| 23 | Live Pro: plano pro pode inscrever | [ ] |
| 24 | Vagas esgotadas: botao desabilitado | [ ] |
| 25 | Cancelar inscricao funciona | [ ] |
| 26 | Editar live funciona | [ ] |
| 27 | Busca e filtros no discovery | [ ] |
| 28 | Webhook Ticto: compra | [ ] |
| 29 | Webhook Ticto: reembolso | [ ] |
