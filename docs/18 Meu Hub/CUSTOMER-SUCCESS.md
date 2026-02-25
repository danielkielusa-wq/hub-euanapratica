# Meu Hub — Guia de Customer Success

> Para a equipe de CS que acompanha usuários na jornada pós-compra. Foco em proatividade: identificar quem está parado e empurrar para o próximo passo.

---

## O que é Meu Hub

É a seção "Minha Jornada" dentro da página **Seu Hub** (`/dashboard/hub`). Aparece automaticamente quando o usuário tem pelo menos um serviço comprado ou ferramenta de plano disponível.

O objetivo é que o usuário nunca "esqueça" o que comprou. Cada card mostra o próximo passo claro.

---

## Entendendo as Seções

### 🔔 Ação Necessária (âmbar)
**Quem aparece aqui:** clientes que compraram mas não iniciaram o processo.
- Consultoria → comprou mas não agendou sessão
- Curso → matriculado mas nunca entrou
- Evento → registrado mas sem data no sistema ainda

**O que fazer:** contato proativo. Esses clientes são o alvo principal de CS.

### ▶ Em Andamento (verde)
**Quem aparece aqui:** clientes engajados.
- Consultoria com sessão confirmada
- Mentoria ativa com Espaço
- Curso com progresso > 0%

**O que fazer:** checar periodicamente, garantir que a experiência está sendo positiva.

### 📅 Próximos Eventos (azul)
**Quem aparece aqui:** clientes com serviços futuros programados.
- Eventos ao vivo com data futura
- Mentorias sem sessão agendada ainda (mas acesso vigente)

**O que fazer:** lembrete próximo da data se não houver comunicação automática.

### 🕐 Histórico (cinza)
**Quem aparece aqui:** clientes que concluíram o serviço.
- Sessões de consultoria feitas
- Cursos 100% concluídos

**O que fazer:** pesquisa de NPS, oferta de próximo produto, depoimento.

---

## Fluxo de Acompanhamento Recomendado

```
Compra confirmada (webhook Ticto)
    ↓
D+1: Verificar se card saiu de "Ação Necessária"
    ↓ Não saiu
D+3: Contato proativo (WhatsApp/email)
    ↓ Ainda sem ação
D+7: Escalada — ligar para o cliente
    ↓ Agendou
Acompanhar em "Em Andamento" até sessão acontecer
    ↓ Sessão realizada
Coletar NPS (D+1 pós-sessão)
    ↓
Oferta de próximo produto / depoimento
```

---

## Como Verificar o Status de um Usuário

No Supabase ou painel admin:

```sql
SELECT
  hs.name AS servico,
  uhs.access_source,
  uhs.sessions_total,
  uhs.sessions_used,
  uhs.started_at,
  b.scheduled_start,
  b.status AS booking_status
FROM user_hub_services uhs
JOIN hub_services hs ON hs.id = uhs.service_id
LEFT JOIN bookings b ON b.student_id = uhs.user_id
  AND b.service_id = uhs.service_id
  AND b.status != 'cancelled'
WHERE uhs.user_id = '<user_uuid>'
  AND uhs.status = 'active'
ORDER BY uhs.started_at DESC;
```

---

## Cenários Comuns

### "Comprei mas não sei como agendar"
→ Direcionar para `/dashboard/hub` → card em "Ação Necessária" → botão "Agendar Sessão"
→ Se não aparecer: verificar `user_hub_services` se row existe com `status = 'active'`

### "Não vejo meu curso"
→ Verificar se o `user_hub_services` tem o serviço do tipo `recorded_course`
→ Verificar se `hub_services.is_visible_in_hub = true`
→ Se curso tem Espaço: verificar se há row em `user_espacos` (auto-matrícula deveria ter ocorrido na compra)

### "Comprei dois serviços diferentes, mas só vejo um"
→ Verificar se ambos têm `ticto_product_id` configurado
→ Verificar `payment_logs` pelos dois `transaction_id`
→ Cada serviço tem sua própria row em `user_hub_services`

### "Meu crédito de ResumePass não aparece"
→ Ferramenta de plano — verificar se o plano do usuário tem a feature `resume_pass` habilitada em `plans.features`
→ Se plano básico: feature pode não estar incluída → oportunidade de upsell

### "Fiz a sessão mas continua aparecendo no histórico como 'Concluído'"
→ Comportamento correto: sessões concluídas vão para "Histórico"
→ Se o usuário comprou mais sessões (re-compra): `sessions_total` deveria ter incrementado → verificar no DB

### "Quero usar o mesmo serviço novamente"
→ Se re-comprou via Ticto: `sessions_total` incrementa automaticamente, card volta para "Em Andamento"
→ Se não re-comprou: direcionar para a landing page do serviço para nova compra

---

## Badge de Origem do Acesso

No card do serviço há um badge que indica como o usuário obteve acesso:

| Badge | Cor | Significado |
|-------|-----|-------------|
| **Comprado** | Roxo | Pagou via Ticto |
| **Incluso no plano** | Azul | Ferramenta incluída na assinatura |

> Se badge mostrar "Comprado" mas o usuário diz que não pagou → investigar `payment_logs` e `access_source` em `user_hub_services`.

---

## Quando Escalar para DEV/Admin

- Card aparece para usuário errado
- Re-compra não incrementou `sessions_total` (bug no webhook)
- Acesso concedido mas card não aparece após 5 min (cache de query)
- Usuário vê serviço de outro usuário (bug de RLS — PRIORIDADE MÁXIMA)
