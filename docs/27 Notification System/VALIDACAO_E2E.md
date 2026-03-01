# Validacao E2E — Sistema de Notificacoes

**Pre-requisito:** logado como admin, app rodando (prod ou `npm run dev`).

---

## 1. Verificar estrutura do banco

**Supabase Dashboard → SQL Editor:**

```sql
-- Tabelas criadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('notification_type_configs', 'user_notification_preferences');

-- Seeds (deve retornar ~23 tipos)
SELECT type_key, category, in_app_enabled FROM notification_type_configs ORDER BY category;

-- Colunas novas na notifications
SELECT column_name FROM information_schema.columns
WHERE table_name = 'notifications'
  AND column_name IN ('read_at', 'action_url', 'icon', 'category', 'metadata');

-- RPCs existem
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('mark_notification_read', 'mark_all_notifications_read', 'get_unread_notification_count');
```

**Esperado:** 2 tabelas, 5 colunas, 3 RPCs, ~23 seeds.

---

## 2. Bell sem badge

- Navegar para `/dashboard`
- **Esperado:** sino sem badge numerico (zero notificacoes)

---

## 3. Inserir notificacao e verificar realtime

```sql
-- Pegar user_id
SELECT id, email FROM auth.users LIMIT 5;

-- Inserir (substituir <USER_ID>)
INSERT INTO notifications (user_id, type, title, message, action_url, icon, category, status, sent_at)
VALUES (
  '<USER_ID>',
  'post_commented',
  'Alguem comentou no seu post',
  'João Silva: "Excelente conteudo!"',
  '/comunidade',
  'message-circle',
  'social',
  'sent',
  NOW()
);
```

**Esperado (sem reload):**
- [ ] Badge `1` aparece no sino em 2-3s
- [ ] Toast aparece com titulo + botao "Ver"

---

## 4. Centro de notificacoes

- Clicar no sino
- **Verificar:**
  - [ ] Popover abre
  - [ ] Item com icone azul (social), titulo, mensagem, tempo relativo
  - [ ] Fundo levemente azul = nao-lida
  - [ ] Ponto roxo no canto direito

---

## 5. Aba "Nao lidas"

- Clicar aba **"Nao lidas"**
- **Esperado:** badge `1` dentro da aba, item listado

---

## 6. Marcar como lida (clique no item)

- Clicar na notificacao
- **Esperado:**
  - [ ] Fundo normal (sem azul)
  - [ ] Ponto roxo some
  - [ ] Badge do sino vai para `0`
  - [ ] Aba "Nao lidas" vazia

---

## 7. Marcar todas como lidas

Inserir 3 de uma vez:

```sql
INSERT INTO notifications (user_id, type, title, icon, category, status, sent_at)
VALUES
  ('<USER_ID>', 'credits_recharged', 'Creditos recarregados: +10', 'coins', 'system', 'sent', NOW()),
  ('<USER_ID>', 'live_scheduled', 'Nova live: Estrategia de Carreira', 'video', 'business', 'sent', NOW()),
  ('<USER_ID>', 'badge_earned', 'Nova badge conquistada!', 'award', 'learning', 'sent', NOW());
```

- Badge mostra `3`
- Abrir popover → **"Marcar todas como lidas"**
- **Esperado:** badge some, itens sem destaque

---

## 8. Badge "9+"

```sql
INSERT INTO notifications (user_id, type, title, icon, category, status, sent_at)
SELECT '<USER_ID>', 'post_liked', 'Curtida no seu post', 'heart', 'social', 'sent', NOW()
FROM generate_series(1, 10);
```

- **Esperado:** badge mostra **"9+"**

---

## 9. Estado vazio

- Marcar todas → aba "Nao lidas"
- **Esperado:** icone de caixa + "Nenhuma notificacao"

---

## 10. Icones e cores por categoria

```sql
INSERT INTO notifications (user_id, type, title, icon, category, status, sent_at)
VALUES
  ('<USER_ID>', 'subscription_activated', 'Assinatura ativada', 'check-circle', 'system', 'sent', NOW()),
  ('<USER_ID>', 'product_launch', 'Novo produto', 'rocket', 'business', 'sent', NOW()),
  ('<USER_ID>', 'new_course_content', 'Nova aula publicada', 'book-open', 'learning', 'sent', NOW()),
  ('<USER_ID>', 'booking_confirmed', 'Agendamento confirmado', 'calendar-check', 'scheduling', 'sent', NOW());
```

| Categoria | Cor esperada |
|-----------|-------------|
| system | Cinza |
| social | Azul |
| business | Roxo |
| learning | Verde |
| scheduling | Ambar |

---

## 11. Navegacao via action_url

```sql
INSERT INTO notifications (user_id, type, title, action_url, icon, category, status, sent_at)
VALUES ('<USER_ID>', 'espaco_invitation', 'Convite para Espaco', '/espacos', 'users', 'scheduling', 'sent', NOW());
```

- Clicar na notificacao
- **Esperado:** navega para `/espacos`, notificacao marcada como lida

---

## 12. Pagina admin `/admin/notificacoes`

- **Verificar:**
  - [ ] Cards agrupados por categoria (5 grupos)
  - [ ] Cada card: nome, `type_key` em mono, descricao, 2 switches
  - [ ] Contagem "X enviada(s)" nos tipos com notificacoes dos testes

---

## 13. Toggle switches (admin)

- Desabilitar **In-app** de `post_liked`
- **Esperado:** switch muda, toast de confirmacao
- Reabilitar para nao afetar testes futuros

---

## 14. Edicao de config

- Hover em qualquer card → clicar lapis
- Alterar display_name → Salvar
- **Esperado:** card atualiza, toast "Configuracao atualizada"
- Reverter o nome

---

## Checklist Final

| # | Cenario | OK |
|---|---------|:--:|
| 1 | Banco: tabelas, RPCs, seeds | |
| 2 | Bell sem badge inicial | |
| 3 | Badge em realtime (sem reload) | |
| 4 | Toast na chegada | |
| 5 | Popover: item com estilo nao-lido | |
| 6 | Aba "Nao lidas" funciona | |
| 7 | Click → marca lida, badge some | |
| 8 | "Marcar todas" funciona | |
| 9 | Badge "9+" acima de 9 | |
| 10 | Estado vazio correto | |
| 11 | Icones/cores por categoria | |
| 12 | Navegacao via action_url | |
| 13 | Admin: cards e grupos carregam | |
| 14 | Toggle switches salvam | |
| 15 | Dialog edicao salva | |
